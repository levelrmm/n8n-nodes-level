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
				
				    // IMPORTANT: matches the new description file
				    const af = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
				
				    const qs: IDataObject = {};
				
				    // examples if you added these to Additional Fields later:
				    // if (af.search) qs.search = af.search as string;
				    // if (af.group_id) qs.group_id = af.group_id as string;
				    // if (af.status) qs.status = af.status as string;
				    // if (af.os) qs.os = af.os as string;
				    // if (af.platform) qs.platform = af.platform as string;
				    // if (af.page) qs.page = af.page as number;
				    // if (af.per_page) qs.per_page = af.per_page as number; // only if your API supports this
				
				    // Limit MUST be `limit` to match your API and the UI field
				    if (!returnAll) qs.limit = limit;
				
				    // Fetch
				    response = returnAll
				      ? await fetchAllCursor('/devices', qs, 100)
				      : await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
				  }
				
				  else if (operation === 'get') {
				    const id = this.getNodeParameter('id', itemIndex) as string;
				    const opts = this.getNodeParameter('deviceGetOptions', itemIndex, {}) as IDataObject;
				
				    const qs: IDataObject = {};
				    if (opts.includeOperatingSystem)   qs.include_operating_system   = true;
				    if (opts.includeCpus)              qs.include_cpus               = true;
				    if (opts.includeMemory)            qs.include_memory             = true;
				    if (opts.includeDisks)             qs.include_disks              = true;
				    if (opts.includeNetworkInterfaces) qs.include_network_interfaces = true;
				
				    // extras
				    const pairs = (opts?.extraQuery as IDataObject)?.parameter as IDataObject[] | undefined;
				    if (Array.isArray(pairs)) for (const p of pairs) if (p?.key) qs[p.key as string] = (p.value as string) ?? '';
				
				    response = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, qs);
				  }
				
				  else {
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
