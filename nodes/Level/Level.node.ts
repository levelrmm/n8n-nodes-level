import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
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
			{ displayName: 'Resource', name: 'resource', type: 'options', noDataExpression: true, options: [
				{ name: 'Alert', value: 'alerts' },
				{ name: 'Device', value: 'devices' },
				{ name: 'Group', value: 'groups' },
			], default: 'devices' },
			...alertsOperations,
			...alertsFields,
			...devicesOperations,
			...devicesFields,
			...groupsOperations,
			...groupsFields,
			{ displayName: 'Response Property Name', name: 'responsePropertyName', type: 'string', default: '', placeholder: 'Leave empty to return the whole response', description: 'If the API response wraps the array in a property (e.g. devices), set that property name. If left empty, the node attempts to auto-detect and returns the raw response if needed.' },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: IDataObject[] = [];

		const asArray = (res: unknown, propName: string): IDataObject[] => {
			if (Array.isArray(res)) return res as IDataObject[];
			if (res && typeof res === 'object') {
				const obj = res as IDataObject;
				if (propName && Array.isArray((obj as any)[propName])) return (obj as any)[propName] as IDataObject[];
				for (const k of ['devices','groups','alerts','data','items']) {
					if (Array.isArray((obj as any)[k])) return (obj as any)[k] as IDataObject[];
				}
				return [obj];
			}
			return [];
		};

		const fetchAllCursor = async (that: IExecuteFunctions, endpoint: string, baseQuery: IDataObject, perPage: number) => {
			const acc: IDataObject[] = [];
			let cursor = baseQuery['starting_after'] as string | undefined;
			const q: IDataObject = { ...baseQuery };
			delete q['starting_after'];
			while (true) {
				const pageQs: IDataObject = { ...q, limit: perPage };
				if (cursor) (pageQs as any)['starting_after'] = cursor;
				const page = await levelApiRequest.call(that, 'GET', endpoint, {}, pageQs);
				const arr = asArray(page, '');
				if (!arr.length) break;
				acc.push(...arr);
				if (arr.length < perPage) break;
				const last = arr[arr.length - 1];
				const lastId = (last && typeof last === 'object') ? (last as any).id as string : undefined;
				if (!lastId) break;
				cursor = lastId;
			}
			return acc;
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			const responseProp = this.getNodeParameter('responsePropertyName', i, '') as string;

			try {
				let qs: IDataObject = {};
				let resp: unknown;

				if (resource === 'alerts') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 20) as number;
						const options = this.getNodeParameter('alertsListOptions', i, {}) as IDataObject;
						if (!returnAll) qs.limit = limit;
						if ((options as any).startingAfter) qs['starting_after'] = (options as any).startingAfter as string;
						if ((options as any).endingBefore) qs['ending_before'] = (options as any).endingBefore as string;
						const kv = (((options as any).extraQuery || {}) as any).parameter as IDataObject[] | undefined;
						if (Array.isArray(kv)) for (const p of kv) if (p.key) qs[p.key as string] = p.value as string;
						if (returnAll) resp = await fetchAllCursor(this, '/alerts', qs, 100);
						else resp = await levelApiRequest.call(this, 'GET', '/alerts', {}, qs);
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', i) as string;
						resp = await levelApiRequest.call(this, 'GET', `/alerts/${id}`, {}, {});
					} else {
						throw new Error('Unsupported alerts operation: ' + operation);
					}
				}
				else if (resource === 'devices') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 20) as number;
						const options = this.getNodeParameter('devicesListOptions', i, {}) as IDataObject;
						if ((options as any).groupId) qs['group_id'] = (options as any).groupId as string;
						if ((options as any).ancestorGroupId) qs['ancestor_group_id'] = (options as any).ancestorGroupId as string;
						if ((options as any).includeOperatingSystem) qs['include_operating_system'] = true;
						if ((options as any).includeCpus) qs['include_cpus'] = true;
						if ((options as any).includeMemory) qs['include_memory'] = true;
						if ((options as any).includeDisks) qs['include_disks'] = true;
						if ((options as any).includeNetworkInterfaces) qs['include_network_interfaces'] = true;
						if ((options as any).startingAfter) qs['starting_after'] = (options as any).startingAfter as string;
						if ((options as any).endingBefore) qs['ending_before'] = (options as any).endingBefore as string;
						const kv = (((options as any).extraQuery || {}) as any).parameter as IDataObject[] | undefined;
						if (Array.isArray(kv)) for (const p of kv) if (p.key) qs[p.key as string] = p.value as string;
						if (!returnAll) {
							qs.limit = limit;
							resp = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
						} else {
							resp = await fetchAllCursor(this, '/devices', qs, 100);
						}
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', i) as string;
						const options = this.getNodeParameter('devicesGetOptions', i, {}) as IDataObject;
						if ((options as any).includeOperatingSystem) qs['include_operating_system'] = true;
						if ((options as any).includeCpus) qs['include_cpus'] = true;
						if ((options as any).includeMemory) qs['include_memory'] = true;
						if ((options as any).includeDisks) qs['include_disks'] = true;
						if ((options as any).includeNetworkInterfaces) qs['include_network_interfaces'] = true;
						const kv = (((options as any).extraQuery || {}) as any).parameter as IDataObject[] | undefined;
						if (Array.isArray(kv)) for (const p of kv) if (p.key) qs[p.key as string] = p.value as string;
						resp = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, qs);
					} else {
						throw new Error('Unsupported devices operation: ' + operation);
					}
				}
				else if (resource === 'groups') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 20) as number;
						const options = this.getNodeParameter('groupsListOptions', i, {}) as IDataObject;
						if ((options as any).parentId) qs['parent_id'] = (options as any).parentId as string;
						if ((options as any).startingAfter) qs['starting_after'] = (options as any).startingAfter as string;
						if ((options as any).endingBefore) qs['ending_before'] = (options as any).endingBefore as string;
						const kv = (((options as any).extraQuery || {}) as any).parameter as IDataObject[] | undefined;
						if (Array.isArray(kv)) for (const p of kv) if (p.key) qs[p.key as string] = p.value as string;
						if (!returnAll) {
							qs.limit = limit;
							resp = await levelApiRequest.call(this, 'GET', '/groups', {}, qs);
						} else {
							resp = await fetchAllCursor(this, '/groups', qs, 100);
						}
					} else if (operation === 'get') {
						const id = this.getNodeParameter('id', i) as string;
						resp = await levelApiRequest.call(this, 'GET', `/groups/${id}`, {}, {});
					} else {
						throw new Error('Unsupported groups operation: ' + operation);
					}
				}
				else {
					throw new Error('Unsupported resource: ' + resource);
				}
				out.push(...asArray(resp, responseProp));
			} catch (err) {
				if ((err as any)?.context) (err as any).context.itemIndex = i;
				throw new NodeOperationError(this.getNode(), err as Error, { itemIndex: i });
			}
		}

		return [this.helpers.returnJsonArray(out)];
	}
}
