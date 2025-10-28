import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { levelApiRequest } from './GenericFunctions';

import { alertsFields, alertsOperations } from './descriptions/Alerts.description';
import { devicesFields, devicesOperations } from './descriptions/Devices.description';
import { groupsFields, groupsOperations } from './descriptions/Groups.description';

export class Level implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Level',
		name: 'level',
		icon: 'file:level.svg',
		group: ['input'],
		version: 1,
		description: 'Interact with the Level API',
		defaults: { name: 'Level' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'levelApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Alert', value: 'alert' },
					{ name: 'Device', value: 'device' },
					{ name: 'Group', value: 'group' },
				],
				default: 'device',
			},
			...alertsOperations,
			...alertsFields,
			...devicesOperations,
			...devicesFields,
			...groupsOperations,
			...groupsFields,
			{
				displayName: 'Response Property Name',
				name: 'responsePropertyName',
				type: 'string',
				default: '',
				placeholder: 'Leave empty to return the whole response',
				description:
					'If the API response wraps the array in a property (e.g. <code>devices</code>), set that property name. If left empty, the node attempts to auto-detect and returns the raw response if needed.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const asArray = (res: unknown, propName?: string): IDataObject[] => {
			if (Array.isArray(res)) return res as IDataObject[];
			if (res && typeof res === 'object') {
				const obj = res as IDataObject;
				// respect explicit responsePropertyName first
				if (propName && Array.isArray((obj as any)[propName])) return (obj as any)[propName] as IDataObject[];
				// heuristic unwraps
				for (const k of ['devices', 'groups', 'alerts', 'data', 'items']) {
					if (Array.isArray((obj as any)[k])) return (obj as any)[k] as IDataObject[];
				}
				return [obj];
			}
			return [];
		};

		const appendExtraQuery = (qs: IDataObject, collection: IDataObject | undefined) => {
			const pairs = (collection?.extraQuery as IDataObject)?.parameter as IDataObject[] | undefined;
			if (pairs && Array.isArray(pairs)) {
				for (const p of pairs) {
					const key = (p?.key as string) ?? '';
					if (!key) continue;
					qs[key] = p?.value as string;
				}
			}
		};

		const fetchAllCursor = async (endpoint: string, baseQuery: IDataObject, limitPerPage = 100) => {
			const aggregated: IDataObject[] = [];
			let cursor = baseQuery['starting_after'] as string | undefined;
			const base: IDataObject = { ...baseQuery };
			delete base['starting_after'];

			while (true) {
				const pageQs: IDataObject = { ...base, limit: limitPerPage };
				if (cursor) pageQs['starting_after'] = cursor;
				const pageResp = await levelApiRequest.call(this, 'GET', endpoint, {}, pageQs);
				const itemsArr = asArray(pageResp);
				if (!itemsArr.length) break;
				aggregated.push(...itemsArr);
				if (itemsArr.length < limitPerPage) break;
				const last = itemsArr[itemsArr.length - 1];
				const lastId = (last && typeof last === 'object') ? (last as any).id as string : undefined;
				if (!lastId) break;
				cursor = lastId;
			}
			return aggregated;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;
			const responseProp = this.getNodeParameter('responsePropertyName', itemIndex, '') as string;

			try {
				let qs: IDataObject = {};
				let response: unknown;

				// -------- Alerts --------
				if (resource === 'alert') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
						const options = this.getNodeParameter('alertListOptions', itemIndex, {}) as IDataObject;

						if (!returnAll) qs.limit = limit;
						if ((options as any).startingAfter) qs['starting_after'] = (options as any).startingAfter as string;
						if ((options as any).endingBefore) qs['ending_before'] = (options as any).endingBefore as string;
						appendExtraQuery(qs, options);

						if (returnAll) response = await fetchAllCursor('/alerts', qs, 100);
						else response = await levelApiRequest.call(this, 'GET', '/alerts', {}, qs);
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						response = await levelApiRequest.call(this, 'GET', `/alerts/${id}`, {}, {});
					} else {
						throw new Error(`Unsupported alerts operation: ${operation}`);
					}
				}

				// -------- Devices --------
				else if (resource === 'device') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
						const options = this.getNodeParameter('deviceListOptions', itemIndex, {}) as IDataObject;

						// Named options mapped to query
						if ((options as any).groupId) qs['group_id'] = (options as any).groupId as string;
						if ((options as any).ancestorGroupId) qs['ancestor_group_id'] = (options as any).ancestorGroupId as string;

						if ((options as any).includeOperatingSystem) qs['include_operating_system'] = true;
						if ((options as any).includeCpus) qs['include_cpus'] = true;
						if ((options as any).includeMemory) qs['include_memory'] = true;
						if ((options as any).includeDisks) qs['include_disks'] = true;
						if ((options as any).includeNetworkInterfaces) qs['include_network_interfaces'] = true;

						if ((options as any).startingAfter) qs['starting_after'] = (options as any).startingAfter as string;
						if ((options as any).endingBefore) qs['ending_before'] = (options as any).endingBefore as string;

						// Merge arbitrary extraQuery key/value pairs
						appendExtraQuery(qs, options);

						// ✅ NEW: generic "filters" collection (if defined in your descriptions) merged into qs
						// This allows you to add optional fields under a single "Additional Fields"/"Filters" collection
						// without needing to hardcode every param here.
						const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
						if (filters && typeof filters === 'object') {
							for (const [key, val] of Object.entries(filters)) {
								if (val === undefined || val === null) continue;
								if (typeof val === 'string' && val.trim() === '') continue;
								// allow dateTime UI types to pass Dates
								// @ts-expect-error runtime guard
								qs[key] = val instanceof Date ? val.toISOString() : val;
							}
						}

						if (!returnAll) {
							qs.limit = limit;
							response = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
						} else {
							response = await fetchAllCursor('/devices', qs, 100);
						}
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const options = this.getNodeParameter('deviceGetOptions', itemIndex, {}) as IDataObject;

						if ((options as any).includeOperatingSystem) qs['include_operating_system'] = true;
						if ((options as any).includeCpus) qs['include_cpus'] = true;
						if ((options as any).includeMemory) qs['include_memory'] = true;
						if ((options as any).includeDisks) qs['include_disks'] = true;
						if ((options as any).includeNetworkInterfaces) qs['include_network_interfaces'] = true;
						appendExtraQuery(qs, options);

						// also accept generic filters on GET if provided
						const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
						if (filters && typeof filters === 'object') {
							for (const [key, val] of Object.entries(filters)) {
								if (val === undefined || val === null) continue;
								if (typeof val === 'string' && val.trim() === '') continue;
								// @ts-expect-error runtime guard
								qs[key] = val instanceof Date ? val.toISOString() : val;
							}
						}

						response = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, qs);
					} else {
						throw new Error(`Unsupported devices operation: ${operation}`);
					}
				}

				// -------- Groups --------
				else if (resource === 'group') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
						const options = this.getNodeParameter('groupListOptions', itemIndex, {}) as IDataObject;

						if ((options as any).parentId) qs['parent_id'] = (options as any).parentId as string;
						if ((options as any).startingAfter) qs['starting_after'] = (options as any).startingAfter as string;
						if ((options as any).endingBefore) qs['ending_before'] = (options as any).endingBefore as string;
						appendExtraQuery(qs, options);

						if (!returnAll) {
							qs.limit = limit;
							response = await levelApiRequest.call(this, 'GET', '/groups', {}, qs);
						} else {
							response = await fetchAllCursor('/groups', qs, 100);
						}
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						response = await levelApiRequest.call(this, 'GET', `/groups/${id}`, {}, {});
					} else {
						throw new Error(`Unsupported groups operation: ${operation}`);
					}
				}

				else {
					throw new Error(`Unsupported resource: ${resource}`);
				}

				const arr = asArray(response, responseProp);
				returnData.push(...arr);
			} catch (error) {
				if ((error as { context?: Record<string, unknown> }).context) {
					(error as { context: Record<string, unknown> }).context.itemIndex = itemIndex;
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
