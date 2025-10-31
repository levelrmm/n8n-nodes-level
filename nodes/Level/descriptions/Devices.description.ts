import type {
        IDataObject,
        IExecuteSingleFunctions,
        IHttpRequestOptions,
        IN8nHttpFullResponse,
        INodeExecutionData,
        INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
        asArray,
        buildKeyValueCollection,
        encodeDeviceIdForPath,
        levelApiRequestAllCursor,
        parseDeviceIdFromInput,
        sanitizeQuery,
} from '../helpers';

const DEVICES_LIST_PER_PAGE = 100;

const getDeviceExtraQuery = (context: IExecuteSingleFunctions): IDataObject => {
        const extraCollection = context.getNodeParameter('deviceExtraQuery', {}) as IDataObject;
        return buildKeyValueCollection(extraCollection);
};

const getDeviceIncludeQuery = (context: IExecuteSingleFunctions): IDataObject => {
        const includeOperatingSystem = context.getNodeParameter('deviceIncludeOperatingSystem', false) as boolean;
        const includeCpus = context.getNodeParameter('deviceIncludeCpus', false) as boolean;
        const includeMemory = context.getNodeParameter('deviceIncludeMemory', false) as boolean;
        const includeDisks = context.getNodeParameter('deviceIncludeDisks', false) as boolean;
        const includeNetworkInterfaces = context.getNodeParameter('deviceIncludeNetworkInterfaces', false) as boolean;

        return sanitizeQuery({
                include_operating_system: includeOperatingSystem ? true : undefined,
                include_cpus: includeCpus ? true : undefined,
                include_memory: includeMemory ? true : undefined,
                include_disks: includeDisks ? true : undefined,
                include_network_interfaces: includeNetworkInterfaces ? true : undefined,
        });
};

const buildDeviceListQuery = (
        context: IExecuteSingleFunctions,
        returnAll: boolean,
        limit: number,
): IDataObject => {
        const groupId = context.getNodeParameter('deviceGroupId', '') as string;
        const ancestorGroupId = context.getNodeParameter('deviceAncestorGroupId', '') as string;
        const startingAfter = context.getNodeParameter('deviceStartingAfter', '') as string;
        const endingBefore = context.getNodeParameter('deviceEndingBefore', '') as string;

        const baseQuery: IDataObject = {
                ...getDeviceIncludeQuery(context),
                ...getDeviceExtraQuery(context),
                group_id: groupId || undefined,
                ancestor_group_id: ancestorGroupId || undefined,
                starting_after: startingAfter || undefined,
                ending_before: endingBefore || undefined,
                limit: returnAll ? DEVICES_LIST_PER_PAGE : limit,
        };

        return sanitizeQuery(baseQuery);
};

const buildDeviceGetQuery = (context: IExecuteSingleFunctions): IDataObject => {
        const baseQuery: IDataObject = {
                ...getDeviceIncludeQuery(context),
                ...getDeviceExtraQuery(context),
        };

        return sanitizeQuery(baseQuery);
};

const devicesListPreSend = async function (
        this: IExecuteSingleFunctions,
        requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
        const returnAll = this.getNodeParameter('returnAll', false) as boolean;
        const limit = this.getNodeParameter('limit', 50) as number;
        requestOptions.qs = buildDeviceListQuery(this, returnAll, limit);
        return requestOptions;
};

const devicesListPostReceive = async function (
        this: IExecuteSingleFunctions,
        _items: INodeExecutionData[],
        response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
        const explicitProperty = this.getNodeParameter('responsePropertyName', '') as string;
        const returnAll = this.getNodeParameter('returnAll', false) as boolean;
        const limit = this.getNodeParameter('limit', 50) as number;

        const firstPageItems = asArray(response.body, explicitProperty || undefined);
        let records = firstPageItems;

        if (returnAll) {
                const baseQuery = buildDeviceListQuery(this, true, DEVICES_LIST_PER_PAGE);
                records = await levelApiRequestAllCursor.call(
                        this,
                        '/devices',
                        { ...baseQuery },
                        DEVICES_LIST_PER_PAGE,
                        explicitProperty || undefined,
                        firstPageItems,
                );
        }

        if (!returnAll) {
                records = records.slice(0, limit);
        }

        return records.map((entry) => ({ json: entry }));
};

const devicesGetPreSend = async function (
        this: IExecuteSingleFunctions,
        requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
        const deviceParameter = this.getNodeParameter('device', '', {
                extractValue: true,
        }) as unknown;
        const deviceId = parseDeviceIdFromInput(deviceParameter);

        if (!deviceId) {
                        throw new NodeOperationError(this.getNode(), 'Device identifier is required.');
        }

        requestOptions.url = `/devices/${encodeDeviceIdForPath(deviceId)}`;
        requestOptions.qs = buildDeviceGetQuery(this);

        return requestOptions;
};

const devicesGetPostReceive = async function (
        this: IExecuteSingleFunctions,
        _items: INodeExecutionData[],
        response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
        const explicitProperty = this.getNodeParameter('responsePropertyName', '') as string;
        const items = asArray(response.body, explicitProperty || undefined);
        if (!items.length) {
                throw new NodeOperationError(this.getNode(), 'Device not found.', {
                        itemIndex: 0,
                });
        }

        return items.map((entry) => ({ json: entry }));
};

export const deviceOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['devices'],
                        },
                },
                options: [
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List devices',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '/devices',
                                        },
                                        send: {
                                                preSend: [devicesListPreSend],
                                        },
                                        output: {
                                                postReceive: [devicesListPostReceive],
                                        },
                                },
                        },
                        {
                                name: 'Get',
                                value: 'get',
                                action: 'Get a device',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '/devices',
                                        },
                                        send: {
                                                preSend: [devicesGetPreSend],
                                        },
                                        output: {
                                                postReceive: [devicesGetPostReceive],
                                        },
                                },
                        },
                ],
                default: 'list',
        },
];

export const deviceFields: INodeProperties[] = [
        {
                displayName: 'Device',
                name: 'device',
                type: 'resourceLocator',
                default: { mode: 'id', value: '' },
                description: 'Select or enter the device to retrieve',
                required: true,
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get'],
                        },
                },
                modes: [
                        {
                                displayName: 'ID',
                                name: 'id',
                                type: 'string',
                                placeholder: 'Z2lkOi8v...',
                        },
                        {
                                displayName: 'URL',
                                name: 'url',
                                type: 'string',
                                placeholder: 'https://app.level.io/devices/<ID>',
                        },
                        {
                                displayName: 'List',
                                name: 'list',
                                type: 'list',
                                typeOptions: {
                                        searchListMethod: 'searchDevicesByHostname',
                                        searchable: true,
                                        searchFilterRequired: true,
                                },
                        },
                ],
        },
        {
                displayName: 'Include CPUs',
                name: 'deviceIncludeCpus',
                type: 'boolean',
                default: false,
                description: 'Whether to include detailed CPU information in the response',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get', 'list'],
                        },
                },
        },
        {
                displayName: 'Include Disks',
                name: 'deviceIncludeDisks',
                type: 'boolean',
                default: false,
                description: 'Whether to include detailed disk and disk partition information in the response',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get', 'list'],
                        },
                },
        },
        {
                displayName: 'Include Memory',
                name: 'deviceIncludeMemory',
                type: 'boolean',
                default: false,
                description: 'Whether to include detailed memory information in the response',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get', 'list'],
                        },
                },
        },
        {
                displayName: 'Include Network Interfaces',
                name: 'deviceIncludeNetworkInterfaces',
                type: 'boolean',
                default: false,
                description: 'Whether to include detailed network interface information in the response',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get', 'list'],
                        },
                },
        },
        {
                displayName: 'Include Operating System',
                name: 'deviceIncludeOperatingSystem',
                type: 'boolean',
                default: false,
                description: 'Whether to include detailed operating system information in the response',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get', 'list'],
                        },
                },
        },
        {
                displayName: 'Additional Query Parameters',
                name: 'deviceExtraQuery',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                typeOptions: { multipleValues: true },
                default: {},
                description: 'Additional query string parameters supported by the API',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['get', 'list'],
                        },
                },
                options: [
                        {
                                displayName: 'Parameter',
                                name: 'parameter',
                                values: [
                                        { displayName: 'Key', name: 'key', type: 'string', default: '' },
                                        { displayName: 'Value', name: 'value', type: 'string', default: '' },
                                ],
                        },
                ],
        },
        {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                default: false,
                description: 'Whether to return all results or only up to a given limit',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                typeOptions: { minValue: 1, maxValue: 100 },
                description: 'Max number of results to return',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['list'],
                                returnAll: [false],
                        },
                },
        },
        {
                displayName: 'Group ID',
                name: 'deviceGroupId',
                type: 'string',
                default: '',
                description:
                        "Filter to only include devices with the given parent group ID. If not provided, all devices are returned. If 'null' is provided, only devices without a parent group are returned",
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Ancestor Group ID',
                name: 'deviceAncestorGroupId',
                type: 'string',
                default: '',
                description: 'Filter to only include devices with the given group ID as an ancestor',
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Starting After',
                name: 'deviceStartingAfter',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>starting_after</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with ID '1234', your subsequent call can include 'starting_after=1234' in order to fetch the next page of the list",
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Ending Before',
                name: 'deviceEndingBefore',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>ending_before</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with ID '1234', your subsequent call can include 'ending_before=1234' in order to fetch the previous page of the list",
                displayOptions: {
                        show: {
                                resource: ['devices'],
                                operation: ['list'],
                        },
                },
        },
];
