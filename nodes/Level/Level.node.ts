import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { levelApiRequest } from './GenericFunctions';

import { alertFields, alertOperations } from './descriptions/Alert.description';
import { deviceFields, deviceOperations } from './descriptions/Device.description';
import { groupFields, groupOperations } from './descriptions/Group.description';

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
                        ...alertOperations,
                        ...alertFields,
                        ...deviceOperations,
                        ...deviceFields,
                        ...groupOperations,
                        ...groupFields,
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

                const getArrayFromObject = (obj: IDataObject, key: string): IDataObject[] | undefined => {
                        const value = obj[key];
                        return Array.isArray(value) ? (value as IDataObject[]) : undefined;
                };

                const asArray = (res: unknown, propName?: string): IDataObject[] => {
                        if (Array.isArray(res)) {
                                return res as IDataObject[];
                        }

                        if (res && typeof res === 'object') {
                                const obj = res as IDataObject;

                                if (propName) {
                                        const explicit = getArrayFromObject(obj, propName);
                                        if (explicit) return explicit;
                                }

                                for (const key of ['device', 'devices', 'group', 'groups', 'alert', 'alerts', 'data', 'items']) {
                                        const candidate = getArrayFromObject(obj, key);
                                        if (candidate) return candidate;
                                }

                                return [obj];
                        }

                        return [];
                };

                const appendExtraQuery = (qs: IDataObject, collection: IDataObject | undefined) => {
                        const extra = collection?.extraQuery;
                        if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
                                return;
                        }

                        const parameter = (extra as IDataObject).parameter;
                        if (!Array.isArray(parameter)) {
                                return;
                        }

                        for (const pair of parameter as Array<{ key?: string; value?: string }>) {
                                if (!pair?.key || typeof pair.key !== 'string') continue;
                                const trimmed = pair.key.trim();
                                if (!trimmed) continue;
                                qs[trimmed] = typeof pair.value === 'string' ? pair.value : '';
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
                                const lastIdValue = last ? last['id'] : undefined;
                                const lastId = typeof lastIdValue === 'string' ? lastIdValue : undefined;
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
                                let response: unknown;

                                // -------- Alert --------
                                if (resource === 'alert') {
                                        if (operation === 'list') {
                                                const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
                                                const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
                                                const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

                                                const query: IDataObject = {};
                                                if (additionalFields.startingAfter) query['starting_after'] = additionalFields.startingAfter as string;
                                                if (additionalFields.endingBefore) query['ending_before'] = additionalFields.endingBefore as string;
                                                appendExtraQuery(query, additionalFields);

                                                if (!returnAll) {
                                                        query.limit = limit;
                                                        response = await levelApiRequest.call(this, 'GET', '/alerts', {}, query);
                                                } else {
                                                        response = await fetchAllCursor('/alerts', query, 100);
                                                }
                                        } else if (operation === 'get') {
                                                const id = this.getNodeParameter('id', itemIndex) as string;
                                                response = await levelApiRequest.call(this, 'GET', `/alerts/${id}`, {}, {});
                                        } else {
                                                throw new NodeOperationError(this.getNode(), `Unsupported alert operation: ${operation}`, {
                                                        itemIndex,
                                                });
                                        }
                                }

                        // -------- Device --------
				else if (resource === 'device') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
                                            const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
				
                                                const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

                                                const query: IDataObject = {};

                                                // map common filters if present in your description
                                                if (additionalFields.groupId) query['group_id'] = additionalFields.groupId as string;
                                                if (additionalFields.ancestorGroupId) query['ancestor_group_id'] = additionalFields.ancestorGroupId as string;

                                                // include flags
                                                if (additionalFields.includeOperatingSystem)   query['include_operating_system']   = true;
                                                if (additionalFields.includeCpus)              query['include_cpus']               = true;
                                                if (additionalFields.includeMemory)            query['include_memory']             = true;
                                                if (additionalFields.includeDisks)             query['include_disks']              = true;
                                                if (additionalFields.includeNetworkInterfaces) query['include_network_interfaces'] = true;

                                                // cursor pagination (if your API supports it)
                                                if (additionalFields.startingAfter) query['starting_after'] = additionalFields.startingAfter as string;
                                                if (additionalFields.endingBefore)  query['ending_before']  = additionalFields.endingBefore as string;

                                                appendExtraQuery(query, additionalFields);

                                                // IMPORTANT: only set one of these depending on your API.
                                                // If your API expects `per_page`, uncomment the next line and remove `qs.limit`.
                                                // qs.per_page = returnAll ? undefined : limit;

                                                if (!returnAll) query.limit = limit;

                                                response = returnAll
                                                        ? await fetchAllCursor('/devices', query, 100)
                                                        : await levelApiRequest.call(this, 'GET', '/devices', {}, query);
                                        }

                                        else if (operation === 'get') {
                                                const id   = this.getNodeParameter('id', itemIndex) as string;
                                                const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

                                                const query: IDataObject = {};
                                                if (additionalFields.includeOperatingSystem)   query['include_operating_system']   = true;
                                                if (additionalFields.includeCpus)              query['include_cpus']               = true;
                                                if (additionalFields.includeMemory)            query['include_memory']             = true;
                                                if (additionalFields.includeDisks)             query['include_disks']              = true;
                                                if (additionalFields.includeNetworkInterfaces) query['include_network_interfaces'] = true;

                                                appendExtraQuery(query, additionalFields);

                                                response = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, query);
                                        }

                                        else {
                                                throw new NodeOperationError(this.getNode(), `Unsupported device operation: ${operation}`, {
                                                        itemIndex,
                                                });
                                        }
                                }

                                // -------- Group --------
                                else if (resource === 'group') {
                                        if (operation === 'list') {
                                                const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
                                                const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
                                                const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

                                                const query: IDataObject = {};

                                                if (additionalFields.parentId) query['parent_id'] = additionalFields.parentId as string;
                                                if (additionalFields.startingAfter) query['starting_after'] = additionalFields.startingAfter as string;
                                                if (additionalFields.endingBefore) query['ending_before'] = additionalFields.endingBefore as string;
                                                appendExtraQuery(query, additionalFields);

                                                if (!returnAll) {
                                                        query.limit = limit;
                                                        response = await levelApiRequest.call(this, 'GET', '/groups', {}, query);
                                                } else {
                                                        response = await fetchAllCursor('/groups', query, 100);
                                                }
                                        } else if (operation === 'get') {
                                                const id = this.getNodeParameter('id', itemIndex) as string;
                                                response = await levelApiRequest.call(this, 'GET', `/groups/${id}`, {}, {});
                                        } else {
                                                throw new NodeOperationError(this.getNode(), `Unsupported group operation: ${operation}`, {
                                                        itemIndex,
                                                });
                                        }
                                }

                                else {
                                        throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`, {
                                                itemIndex,
                                        });
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
