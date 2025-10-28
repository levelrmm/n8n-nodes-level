import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { levelApiRequest } from './GenericFunctions';
import { alertsFields, alertsOperations } from './descriptions/Alerts.description';
import { devicesFields, devicesOperations } from './descriptions/Devices.description';
import { groupsFields, groupsOperations } from './descriptions/Groups.description';

export class Level implements INodeType {
\tdescription: INodeTypeDescription = {
\t\tdisplayName: 'Level',
\t\tname: 'level',
\t\ticon: 'file:level.svg',
\t\tgroup: ['input'],
\t\tversion: 1,
\t\tdescription: 'Interact with the Level API',
\t\tdefaults: { name: 'Level' },
\t\tinputs: [NodeConnectionTypes.Main],
\t\toutputs: [NodeConnectionTypes.Main],
\t\tusableAsTool: true,
\t\tcredentials: [{ name: 'levelApi', required: true }],
\t\tproperties: [
\t\t\t{ displayName: 'Resource', name: 'resource', type: 'options', noDataExpression: true, options: [
\t\t\t\t{ name: 'Alert', value: 'alerts' },
\t\t\t\t{ name: 'Device', value: 'devices' },
\t\t\t\t{ name: 'Group', value: 'groups' },
\t\t\t], default: 'devices' },
\t\t\t...alertsOperations,
\t\t\t...alertsFields,
\t\t\t...devicesOperations,
\t\t\t...devicesFields,
\t\t\t...groupsOperations,
\t\t\t...groupsFields,
\t\t\t{ displayName: 'Response Property Name', name: 'responsePropertyName', type: 'string', default: '', placeholder: 'Leave empty to return the whole response', description: 'If the API response wraps the array in a property (e.g. <code>devices</code>), set that property name. If left empty, the node attempts to auto-detect and returns the raw response if needed.' },
\t\t],
\t};

\tasync execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
\t\tconst items = this.getInputData();
\t\tconst returnData: IDataObject[] = [];

\t\tfor (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
\t\t\tconst resource = this.getNodeParameter('resource', itemIndex) as string;
\t\t\tconst operation = this.getNodeParameter('operation', itemIndex) as string;

\t\t\ttry {
\t\t\t\tlet response: IDataObject | IDataObject[] | undefined;
\t\t\t\tlet qs: IDataObject = {};

\t\t\t\tconst appendExtraQuery = (obj: IDataObject, collection: IDataObject | undefined) => {
\t\t\t\t\tconst pairs = (collection?.extraQuery as IDataObject)?.parameter as IDataObject[] | undefined;
\t\t\t\t\tif (pairs && Array.isArray(pairs)) {
\t\t\t\t\t\tfor (const p of pairs) {
\t\t\t\t\t\t\tconst key = (p?.key as string) ?? '';
\t\t\t\t\t\t\tif (!key) continue;
\t\t\t\t\t\t\tobj[key] = p?.value as string;
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t};

\t\t\t\tconst asArray = (res: any): IDataObject[] => {
\t\t\t\t\tif (Array.isArray(res)) return res as IDataObject[];
\t\t\t\t\tconst propName = this.getNodeParameter('responsePropertyName', itemIndex, '') as string;
\t\t\t\t\tif (propName && res && typeof res === 'object') {
\t\t\t\t\t\tconst container = (res as IDataObject)[propName];
\t\t\t\t\t\tif (Array.isArray(container)) return container as IDataObject[];
\t\t\t\t\t}
\t\t\t\t\tfor (const key of ['devices', 'groups', 'alerts', 'data', 'items']) {
\t\t\t\t\t\tif (res && typeof res === 'object' && Array.isArray(res[key])) return res[key] as IDataObject[];
\t\t\t\t\t}
\t\t\t\t\tif (res && typeof res === 'object') return [res as IDataObject];
\t\t\t\t\treturn [];
\t\t\t\t};

\t\t\t\tconst fetchAllCursor = async (endpoint: string, baseQuery: IDataObject, limitPerPage = 100) => {
\t\t\t\t\tconst aggregated: IDataObject[] = [];
\t\t\t\t\tlet cursor = baseQuery['starting_after'] as string | undefined;
\t\t\t\t\tdelete baseQuery['starting_after'];
\t\t\t\t\twhile (true) {
\t\t\t\t\t\tconst pageQs: IDataObject = { ...baseQuery, limit: limitPerPage };
\t\t\t\t\t\tif (cursor) pageQs['starting_after'] = cursor;
\t\t\t\t\t\tconst pageResp = await levelApiRequest.call(this, 'GET', endpoint, {}, pageQs);
\t\t\t\t\t\tconst itemsArr = asArray(pageResp);
\t\t\t\t\t\tif (!itemsArr.length) break;
\t\t\t\t\t\taggregated.push(...itemsArr);
\t\t\t\t\t\tif (itemsArr.length < (limitPerPage as number)) break;
\t\t\t\t\t\tconst last = itemsArr[itemsArr.length - 1];
\t\t\t\t\t\tconst lastId = (last?.id as string | undefined) ?? undefined;
\t\t\t\t\t\tif (!lastId) break;
\t\t\t\t\t\tcursor = lastId;
\t\t\t\t\t}
\t\t\t\t\treturn aggregated;
\t\t\t\t};

\t\t\t\t// Alerts
\t\t\t\tif (resource === 'alerts') {
\t\t\t\t\tif (operation === 'list') {
\t\t\t\t\t\tconst returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
\t\t\t\t\t\tconst limit = this.getNodeParameter('limit', itemIndex, 20) as number;
\t\t\t\t\t\tconst options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
\t\t\t\t\t\tqs = {};
\t\t\t\t\t\tif (!returnAll) qs.limit = limit;
\t\t\t\t\t\tif (options?.startingAfter) qs['starting_after'] = options.startingAfter as string;
\t\t\t\t\t\tif (options?.endingBefore) qs['ending_before'] = options.endingBefore as string;
\t\t\t\t\t\tappendExtraQuery(qs, options);
\t\t\t\t\t\tif (returnAll) response = await fetchAllCursor('/alerts', qs, 100);
\t\t\t\t\t\telse response = await levelApiRequest.call(this, 'GET', '/alerts', {}, qs);
\t\t\t\t\t\treturnData.push(...asArray(response));
\t\t\t\t\t} else if (operation === 'get') {
\t\t\t\t\t\tconst id = this.getNodeParameter('id', itemIndex) as string;
\t\t\t\t\t\tqs = {};
\t\t\t\t\t\tresponse = await levelApiRequest.call(this, 'GET', `/alerts/${id}`, {}, qs);
\t\t\t\t\t\treturnData.push(...asArray(response));
\t\t\t\t\t} else {
\t\t\t\t\t\tthrow new NodeOperationError(this.getNode(), `Unsupported alerts operation: ${operation}`, { itemIndex });
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\t// Devices
\t\t\t\telse if (resource === 'devices') {
\t\t\t\t\tif (operation === 'list') {
\t\t\t\t\t\tconst returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
\t\t\t\t\t\tconst limit = this.getNodeParameter('limit', itemIndex, 20) as number;
\t\t\t\t\t\tconst options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
\t\t\t\t\t\tqs = {};
\t\t\t\t\t\tif (options?.groupId) qs['group_id'] = options.groupId as string;
\t\t\t\t\t\tif (options?.ancestorGroupId) qs['ancestor_group_id'] = options.ancestorGroupId as string;
\t\t\t\t\t\tif (options?.includeOperatingSystem) qs['include_operating_system'] = true;
\t\t\t\t\t\tif (options?.includeCpus) qs['include_cpus'] = true;
\t\t\t\t\t\tif (options?.includeMemory) qs['include_memory'] = true;
\t\t\t\t\t\tif (options?.includeDisks) qs['include_disks'] = true;
\t\t\t\t\t\tif (options?.includeNetworkInterfaces) qs['include_network_interfaces'] = true;
\t\t\t\t\t\tif (options?.startingAfter) qs['starting_after'] = options.startingAfter as string;
\t\t\t\t\t\tif (options?.endingBefore) qs['ending_before'] = options.endingBefore as string;
\t\t\t\t\t\tappendExtraQuery(qs, options);
\t\t\t\t\t\tif (!returnAll) {
\t\t\t\t\t\t\tqs.limit = limit;
\t\t\t\t\t\t\tresponse = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
\t\t\t\t\t\t\treturnData.push(...asArray(response));
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tconst itemsArr = await fetchAllCursor('/devices', qs, 100);
\t\t\t\t\t\t\treturnData.push(...itemsArr);
\t\t\t\t\t\t}
\t\t\t\t\t} else if (operation === 'get') {
\t\t\t\t\t\tconst id = this.getNodeParameter('id', itemIndex) as string;
\t\t\t\t\t\tconst options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
\t\t\t\t\t\tqs = {};
\t\t\t\t\t\tif (options?.includeOperatingSystem) qs['include_operating_system'] = true;
\t\t\t\t\t\tif (options?.includeCpus) qs['include_cpus'] = true;
\t\t\t\t\t\tif (options?.includeMemory) qs['include_memory'] = true;
\t\t\t\t\t\tif (options?.includeDisks) qs['include_disks'] = true;
\t\t\t\t\t\tif (options?.includeNetworkInterfaces) qs['include_network_interfaces'] = true;
\t\t\t\t\t\tappendExtraQuery(qs, options);
\t\t\t\t\t\tresponse = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, qs);
\t\t\t\t\t\treturnData.push(...asArray(response));
\t\t\t\t\t} else {
\t\t\t\t\t\tthrow new NodeOperationError(this.getNode(), `Unsupported devices operation: ${operation}`, { itemIndex });
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\t// Groups
\t\t\t\telse if (resource === 'groups') {
\t\t\t\t\tif (operation === 'list') {
\t\t\t\t\t\tconst returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
\t\t\t\t\t\tconst limit = this.getNodeParameter('limit', itemIndex, 20) as number;
\t\t\t\t\t\tconst options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
\t\t\t\t\t\tqs = {};
\t\t\t\t\t\tif (options?.parentId) qs['parent_id'] = options.parentId as string;
\t\t\t\t\t\tif (options?.startingAfter) qs['starting_after'] = options.startingAfter as string;
\t\t\t\t\t\tif (options?.endingBefore) qs['ending_before'] = options.endingBefore as string;
\t\t\t\t\t\tappendExtraQuery(qs, options);
\t\t\t\t\t\tif (!returnAll) {
\t\t\t\t\t\t\tqs.limit = limit;
\t\t\t\t\t\t\tresponse = await levelApiRequest.call(this, 'GET', '/groups', {}, qs);
\t\t\t\t\t\t\treturnData.push(...asArray(response));
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tconst itemsArr = await fetchAllCursor('/groups', qs, 100);
\t\t\t\t\t\t\treturnData.push(...itemsArr);
\t\t\t\t\t\t}
\t\t\t\t\t} else if (operation === 'get') {
\t\t\t\t\t\tconst id = this.getNodeParameter('id', itemIndex) as string;
\t\t\t\t\t\tresponse = await levelApiRequest.call(this, 'GET', `/groups/${id}`, {}, {});
\t\t\t\t\t\treturnData.push(...asArray(response));
\t\t\t\t\t} else {
\t\t\t\t\t\tthrow new NodeOperationError(this.getNode(), `Unsupported groups operation: ${operation}`, { itemIndex });
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\telse {
\t\t\t\t\tthrow new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`, { itemIndex });
\t\t\t\t}
\t\t\t} catch (error) {
\t\t\t\tif ((error as { context?: Record<string, unknown> }).context) {
\t\t\t\t\t(error as { context: Record<string, unknown> }).context.itemIndex = itemIndex;
\t\t\t\t\tthrow error;
\t\t\t\t}
\t\t\t\tthrow new NodeOperationError(this.getNode(), error as Error, { itemIndex });
\t\t\t}
\t\t}

\t\treturn [this.helpers.returnJsonArray(returnData)];
\t}
}