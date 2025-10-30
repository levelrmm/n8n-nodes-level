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
import { automationFields, automationOperations } from './descriptions/Automation.description';
import { deviceFields, deviceOperations } from './descriptions/Device.description';
import { groupFields, groupOperations } from './descriptions/Group.description';

const DEVICE_URL_REGEX = /\/devices\/([^/?#]+)/i;

function parseDeviceIdFromUrl(raw: string): string {
        const trimmed = raw.trim();
        if (!trimmed) {
                return '';
        }

        const match = trimmed.match(DEVICE_URL_REGEX);
        if (!match) {
                return trimmed;
        }

        const segment = match[1];

        try {
                return decodeURIComponent(segment);
        } catch {
                return segment;
        }
}

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
                                        { name: 'Automation', value: 'automation' },
                                        { name: 'Device', value: 'device' },
                                        { name: 'Group', value: 'group' },
                                ],
                                default: 'device',
                        },
                        // Alerts
                        ...alertOperations,
                        ...alertFields,
                        // Automations
                        ...automationOperations,
                        ...automationFields,
                        // Devices
                        ...deviceOperations,
                        ...deviceFields,
                        // Groups
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

                const appendExtraQuery = (qs: IDataObject, extra: IDataObject | undefined) => {
                        if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
                                return;
                        }

                        let parameter = (extra as IDataObject).parameter;

                        if (!Array.isArray(parameter)) {
                                const nested = (extra as IDataObject).extraQuery;
                                if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
                                        parameter = (nested as IDataObject).parameter;
                                }
                        }

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
                                                const query: IDataObject = {};

                                                const deviceId = parseDeviceIdFromUrl(
                                                        this.getNodeParameter('alertDeviceId', itemIndex, '') as string,
                                                );
                                                const status = this.getNodeParameter('alertStatus', itemIndex, '') as string;
                                                const startingAfter = this.getNodeParameter('alertStartingAfter', itemIndex, '') as string;
                                                const endingBefore = this.getNodeParameter('alertEndingBefore', itemIndex, '') as string;
                                                const extraQuery = this.getNodeParameter('alertExtraQuery', itemIndex, {}) as IDataObject;

                                                if (deviceId) query['device_id'] = deviceId;
                                                if (status) query['status'] = status;
                                                if (startingAfter) query['starting_after'] = startingAfter;
                                                if (endingBefore) query['ending_before'] = endingBefore;
                                                appendExtraQuery(query, extraQuery);

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

                        // -------- Automation --------
                                else if (resource === 'automation') {
                                        if (operation === 'triggerWebhook') {
                                                const token = this.getNodeParameter('token', itemIndex) as string;
                                                const jsonParameters = this.getNodeParameter('jsonParameters', itemIndex) as boolean;

                                                let body: IDataObject = {};

                                                if (jsonParameters) {
                                                        const rawPayload = this.getNodeParameter('jsonPayload', itemIndex) as string | IDataObject;
                                                        if (typeof rawPayload === 'string') {
                                                                let parsed: unknown;
                                                                try {
                                                                        parsed = JSON.parse(rawPayload) as unknown;
                                                                } catch {
                                                                        throw new NodeOperationError(this.getNode(), 'Invalid JSON payload.', {
                                                                                itemIndex,
                                                                        });
                                                                }

                                                                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                                                                        throw new NodeOperationError(this.getNode(), 'JSON payload must resolve to an object.', {
                                                                                itemIndex,
                                                                        });
                                                                }

                                                                body = parsed as IDataObject;
                                                        } else if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
                                                                body = rawPayload as IDataObject;
                                                        } else {
                                                                throw new NodeOperationError(this.getNode(), 'JSON payload must resolve to an object.', {
                                                                        itemIndex,
                                                                });
                                                        }
                                                } else {
                                                        const deviceIdsValue = this.getNodeParameter('automationDeviceIds', itemIndex, []) as unknown;
                                                        const normalizedDeviceIds: string[] = [];

                                                        if (Array.isArray(deviceIdsValue)) {
                                                                for (const entry of deviceIdsValue as Array<string | undefined>) {
                                                                        if (typeof entry !== 'string') continue;
                                                                        const parsedId = parseDeviceIdFromUrl(entry);
                                                                        if (parsedId) normalizedDeviceIds.push(parsedId);
                                                                }
                                                        } else if (typeof deviceIdsValue === 'string') {
                                                                const parsedId = parseDeviceIdFromUrl(deviceIdsValue);
                                                                if (parsedId) normalizedDeviceIds.push(parsedId);
                                                        }

                                                        if (normalizedDeviceIds.length) {
                                                                body.device_ids = normalizedDeviceIds;
                                                        }

                                                        const customParameterCollection = this.getNodeParameter('automationCustomParameters', itemIndex, {}) as IDataObject;
                                                        const customParameters = (customParameterCollection.parameter as Array<{ key?: string; value?: string }> | undefined) ?? [];
                                                        if (Array.isArray(customParameters)) {
                                                                for (const pair of customParameters as Array<{ key?: string; value?: string }>) {
                                                                        if (!pair?.key) continue;
                                                                        const key = pair.key.trim();
                                                                        if (!key || key === 'device_ids') continue;
                                                                        body[key] = pair.value ?? '';
                                                                }
                                                        }
                                                }

                                                response = await levelApiRequest.call(this, 'POST', `/automations/webhooks/${token}`, body, {});
                                        } else {
                                                throw new NodeOperationError(this.getNode(), `Unsupported automation operation: ${operation}`, {
                                                        itemIndex,
                                                });
                                        }
                                }

                        // -------- Device --------
                                else if (resource === 'device') {
                                        if (operation === 'list') {
                                                const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
                                            const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
				
                                                const query: IDataObject = {};

						const groupId = this.getNodeParameter('deviceGroupId', itemIndex, '') as string;
						const ancestorGroupId = this.getNodeParameter('deviceAncestorGroupId', itemIndex, '') as string;
						const includeOperatingSystem = this.getNodeParameter('deviceIncludeOperatingSystem', itemIndex, false) as boolean;
						const includeCpus = this.getNodeParameter('deviceIncludeCpus', itemIndex, false) as boolean;
						const includeMemory = this.getNodeParameter('deviceIncludeMemory', itemIndex, false) as boolean;
						const includeDisks = this.getNodeParameter('deviceIncludeDisks', itemIndex, false) as boolean;
						const includeNetworkInterfaces = this.getNodeParameter('deviceIncludeNetworkInterfaces', itemIndex, false) as boolean;
						const startingAfter = this.getNodeParameter('deviceStartingAfter', itemIndex, '') as string;
						const endingBefore = this.getNodeParameter('deviceEndingBefore', itemIndex, '') as string;
						const extraQuery = this.getNodeParameter('deviceExtraQuery', itemIndex, {}) as IDataObject;

						if (groupId) query['group_id'] = groupId;
						if (ancestorGroupId) query['ancestor_group_id'] = ancestorGroupId;
						if (includeOperatingSystem) query['include_operating_system'] = true;
						if (includeCpus) query['include_cpus'] = true;
						if (includeMemory) query['include_memory'] = true;
						if (includeDisks) query['include_disks'] = true;
						if (includeNetworkInterfaces) query['include_network_interfaces'] = true;
						if (startingAfter) query['starting_after'] = startingAfter;
						if (endingBefore) query['ending_before'] = endingBefore;

						appendExtraQuery(query, extraQuery);

                                                // IMPORTANT: only set one of these depending on your API.
                                                // If your API expects `per_page`, uncomment the next line and remove `qs.limit`.
                                                // qs.per_page = returnAll ? undefined : limit;

                                                if (!returnAll) query.limit = limit;

                                                response = returnAll
                                                        ? await fetchAllCursor('/devices', query, 100)
                                                        : await levelApiRequest.call(this, 'GET', '/devices', {}, query);
                                        }

                                        else if (operation === 'get') {
                                                const id = parseDeviceIdFromUrl(
                                                        this.getNodeParameter('id', itemIndex) as string,
                                                );
                                                const query: IDataObject = {};
						const includeOperatingSystem = this.getNodeParameter('deviceIncludeOperatingSystem', itemIndex, false) as boolean;
						const includeCpus = this.getNodeParameter('deviceIncludeCpus', itemIndex, false) as boolean;
						const includeMemory = this.getNodeParameter('deviceIncludeMemory', itemIndex, false) as boolean;
						const includeDisks = this.getNodeParameter('deviceIncludeDisks', itemIndex, false) as boolean;
						const includeNetworkInterfaces = this.getNodeParameter('deviceIncludeNetworkInterfaces', itemIndex, false) as boolean;
						const extraQuery = this.getNodeParameter('deviceExtraQuery', itemIndex, {}) as IDataObject;
						if (includeOperatingSystem) query['include_operating_system'] = true;
						if (includeCpus) query['include_cpus'] = true;
						if (includeMemory) query['include_memory'] = true;
						if (includeDisks) query['include_disks'] = true;
						if (includeNetworkInterfaces) query['include_network_interfaces'] = true;
						appendExtraQuery(query, extraQuery);

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
                                                const query: IDataObject = {};

						const parentId = this.getNodeParameter('groupParentId', itemIndex, '') as string;
						const startingAfter = this.getNodeParameter('groupStartingAfter', itemIndex, '') as string;
						const endingBefore = this.getNodeParameter('groupEndingBefore', itemIndex, '') as string;
						const extraQuery = this.getNodeParameter('groupExtraQuery', itemIndex, {}) as IDataObject;

						if (parentId) query['parent_id'] = parentId;
						if (startingAfter) query['starting_after'] = startingAfter;
						if (endingBefore) query['ending_before'] = endingBefore;
						appendExtraQuery(query, extraQuery);

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
