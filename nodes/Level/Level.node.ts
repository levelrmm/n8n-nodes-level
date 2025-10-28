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
import { automationsFields, automationsOperations } from './descriptions/Automations.description';

/**
 * Level main node – revised to expose full query parameters for:
 * - List/Get Devices
 * - List/Get Groups
 * - List/Get Alerts
 * (Automations passthrough preserved)
 */
export class Level implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Level',
		name: 'level',
		icon: 'file:level.svg',
		group: ['input'],
		version: 1,
		description: 'Interact with the Level API',
		defaults: {
			name: 'Level',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'levelApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Alert', value: 'alerts' },
					{ name: 'Automation', value: 'automations' },
					{ name: 'Device', value: 'devices' },
					{ name: 'Group', value: 'groups' },
				],
				default: 'devices',
			},
			...alertsOperations,
			...alertsFields,
			...automationsOperations,
			...automationsFields,
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

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
				let response: IDataObject | IDataObject[] | undefined;
				let qs: IDataObject = {};
				let body: IDataObject | undefined;

				// Helper to append extraQuery (Key/Value pairs)
				const appendExtraQuery = (obj: IDataObject, collection: IDataObject | undefined) => {
					const pairs = (collection?.extraQuery as IDataObject)?.parameter as IDataObject[] | undefined;
					if (pairs && Array.isArray(pairs)) {
						for (const p of pairs) {
							const key = (p?.key as string) ?? '';
							if (!key) continue;
							obj[key] = p?.value as string;
						}
					}
				};

				// Helper to normalize array responses possibly wrapped in a property
				const asArray = (res: any): IDataObject[] => {
					if (Array.isArray(res)) return res as IDataObject[];

					// if there is a responsePropertyName set, prefer that
					const propName = this.getNodeParameter('responsePropertyName', itemIndex, '') as string;
					if (propName && res && typeof res === 'object') {
						const container = (res as IDataObject)[propName];
						if (Array.isArray(container)) return container as IDataObject[];
					}

					// heuristic: some endpoints may wrap arrays in a property like "devices"/"groups"/"alerts"
					for (const key of ['devices', 'groups', 'alerts', 'data', 'items']) {
						if (res && typeof res === 'object' && Array.isArray(res[key])) {
							return res[key] as IDataObject[];
						}
					}

					// if it's a single object just return as 1-element array
					if (res && typeof res === 'object') return [res as IDataObject];
					return [];
				};

				// Helper for Return All using cursor pagination (starting_after)
				const fetchAllCursor = async (endpoint: string, baseQuery: IDataObject, limitPerPage = 100) => {
					const aggregated: IDataObject[] = [];
					let cursor = baseQuery['starting_after'] as string | undefined;
					// remove cursor from baseQuery; we'll set it per page
					delete baseQuery['starting_after'];

					while (true) {
						const pageQs: IDataObject = { ...baseQuery, limit: limitPerPage };
						if (cursor) pageQs['starting_after'] = cursor;
						const pageResp = await levelApiRequest.call(this, 'GET', endpoint, {}, pageQs);
						const itemsArr = asArray(pageResp);
						if (!itemsArr.length) break;
						aggregated.push(...itemsArr);
						// stop if server returned fewer than limit
						if (itemsArr.length < (limitPerPage as number)) break;

						const last = itemsArr[itemsArr.length - 1];
						const lastId = (last?.id as string | undefined) ?? undefined;
						if (!lastId) break;
						cursor = lastId;
					}

					return aggregated;
				};

				// -------- Alerts --------
				if (resource === 'alerts') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
						const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

						qs = {};
						if (!returnAll) {
							qs.limit = limit;
						}
						if (options?.startingAfter) qs['starting_after'] = options.startingAfter as string;
						if (options?.endingBefore) qs['ending_before'] = options.endingBefore as string;

						appendExtraQuery(qs, options);

						if (returnAll) {
							response = await fetchAllCursor('/alerts', qs, 100);
						} else {
							response = await levelApiRequest.call(this, 'GET', '/alerts', {}, qs);
						}

						returnData.push(...asArray(response));
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						qs = {};
						response = await levelApiRequest.call(this, 'GET', `/alerts/${id}`, {}, qs);
						returnData.push(...asArray(response));
					} else {
						throw new NodeOperationError(this.getNode(), `Unsupported alerts operation: ${operation}`, { itemIndex });
					}
				}

				// -------- Automations (Trigger Webhook) --------
				else if (resource === 'automations') {
					if (operation === 'triggerWebhook') {
						const token = this.getNodeParameter('token', itemIndex) as string;
						const jsonParameters = this.getNodeParameter('jsonParameters', itemIndex, false) as boolean;
						body = {};

						if (jsonParameters) {
							// Read raw JSON payload
							const payload = this.getNodeParameter('jsonPayload', itemIndex, '{}') as IDataObject | string;
							if (typeof payload === 'string') {
								const trimmed = payload.trim();
								if (trimmed) {
									try {
										const parsed = JSON.parse(trimmed);
										if (typeof parsed !== 'object' || parsed === null) {
											throw new NodeOperationError(this.getNode(), 'JSON payload must be an object', { itemIndex });
										}
										body = parsed as IDataObject;
									} catch (err) {
										throw new NodeOperationError(this.getNode(), err as Error, { itemIndex });
									}
								}
							} else if (typeof payload === 'object' && payload !== null) {
								body = payload as IDataObject;
							}
						} else {
							// Build payload from UI collection
							const payloadUi = this.getNodeParameter('payloadUi', itemIndex, {}) as IDataObject;
							const properties = (payloadUi.property as IDataObject[]) ?? [];
							for (const prop of properties) {
								const key = (prop?.key as string | undefined) ?? '';
								if (!key) continue;
								body[key] = (prop?.value as string | undefined) ?? '';
							}
						}

						// Optional headers
						const headersUi = this.getNodeParameter('headersUi', itemIndex, {}) as IDataObject;
						const headersPairs = (headersUi?.header as IDataObject[]) ?? [];
						const headers: IDataObject = {};
						for (const h of headersPairs) {
							const k = (h?.name as string | undefined) ?? '';
							if (!k) continue;
							headers[k] = (h?.value as string | undefined) ?? '';
						}

						response = await levelApiRequest.call(
							this,
							'POST',
							`/automations/webhooks/${token}`,
							body,
							{},
							{ headers },
						);

						// Endpoint returns empty body on success
						if (response === undefined || response === '') {
							response = { success: true } as IDataObject;
						}
						returnData.push(...asArray(response));
					} else {
						throw new NodeOperationError(this.getNode(), `Unsupported automations operation: ${operation}`, { itemIndex });
					}
				}

				// -------- Devices --------
				else if (resource === 'devices') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
						const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

						qs = {};
						if (options?.groupId) qs['group_id'] = options.groupId as string;
						if (options?.ancestorGroupId) qs['ancestor_group_id'] = options.ancestorGroupId as string;
						if (options?.includeOperatingSystem) qs['include_operating_system'] = true;
						if (options?.includeCpus) qs['include_cpus'] = true;
						if (options?.includeMemory) qs['include_memory'] = true;
						if (options?.includeDisks) qs['include_disks'] = true;
						if (options?.includeNetworkInterfaces) qs['include_network_interfaces'] = true;
						if (options?.startingAfter) qs['starting_after'] = options.startingAfter as string;
						if (options?.endingBefore) qs['ending_before'] = options.endingBefore as string;
						appendExtraQuery(qs, options);

						if (!returnAll) {
							qs.limit = limit;
							response = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
							returnData.push(...asArray(response));
						} else {
							// Fetch all using cursor pagination
							const itemsArr = await fetchAllCursor('/devices', qs, 100);
							returnData.push(...itemsArr);
						}
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
						qs = {};
						if (options?.includeOperatingSystem) qs['include_operating_system'] = true;
						if (options?.includeCpus) qs['include_cpus'] = true;
						if (options?.includeMemory) qs['include_memory'] = true;
						if (options?.includeDisks) qs['include_disks'] = true;
						if (options?.includeNetworkInterfaces) qs['include_network_interfaces'] = true;
						appendExtraQuery(qs, options);

						response = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, qs);
						returnData.push(...asArray(response));
					} else {
						throw new NodeOperationError(this.getNode(), `Unsupported devices operation: ${operation}`, { itemIndex });
					}
				}

				// -------- Groups --------
				else if (resource === 'groups') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 20) as number;
						const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

						qs = {};
						if (options?.parentId) qs['parent_id'] = options.parentId as string;
						if (options?.startingAfter) qs['starting_after'] = options.startingAfter as string;
						if (options?.endingBefore) qs['ending_before'] = options.endingBefore as string;
						appendExtraQuery(qs, options);

						if (!returnAll) {
							qs.limit = limit;
							response = await levelApiRequest.call(this, 'GET', '/groups', {}, qs);
							returnData.push(...asArray(response));
						} else {
							const itemsArr = await fetchAllCursor('/groups', qs, 100);
							returnData.push(...itemsArr);
						}
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						response = await levelApiRequest.call(this, 'GET', `/groups/${id}`, {}, {});
						returnData.push(...asArray(response));
					} else {
						throw new NodeOperationError(this.getNode(), `Unsupported groups operation: ${operation}`, { itemIndex });
					}
				}

				else {
					throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`, { itemIndex });
				}
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