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
        levelApiRequestAllCursor,
        parseDeviceIdFromInput,
        sanitizeQuery,
} from '../helpers';

const ALERTS_LIST_PER_PAGE = 100;

const alertsListPreSend = async function (
        this: IExecuteSingleFunctions,
        requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
        const returnAll = this.getNodeParameter('returnAll', false) as boolean;
        const limit = this.getNodeParameter('limit', 50) as number;
        const deviceId = parseDeviceIdFromInput(this.getNodeParameter('alertDeviceId', '') as unknown);
        const status = this.getNodeParameter('alertStatus', '') as string;
        const startingAfter = this.getNodeParameter('alertStartingAfter', '') as string;
        const endingBefore = this.getNodeParameter('alertEndingBefore', '') as string;
        const extraQuery = this.getNodeParameter('alertExtraQuery', {}) as IDataObject;

        const qs = sanitizeQuery({
                limit: returnAll ? ALERTS_LIST_PER_PAGE : limit,
                device_id: deviceId || undefined,
                status: status || undefined,
                starting_after: startingAfter || undefined,
                ending_before: endingBefore || undefined,
                ...buildKeyValueCollection(extraQuery),
        });

        requestOptions.qs = qs;
        return requestOptions;
};

const alertsListPostReceive = async function (
        this: IExecuteSingleFunctions,
        _items: INodeExecutionData[],
        response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
        const explicitProperty = this.getNodeParameter('responsePropertyName', '') as string;
        const returnAll = this.getNodeParameter('returnAll', false) as boolean;
        const limit = this.getNodeParameter('limit', 50) as number;
        const status = this.getNodeParameter('alertStatus', '') as string;
        const startingAfter = this.getNodeParameter('alertStartingAfter', '') as string;
        const endingBefore = this.getNodeParameter('alertEndingBefore', '') as string;
        const deviceId = parseDeviceIdFromInput(this.getNodeParameter('alertDeviceId', '') as unknown);
        const extraQuery = this.getNodeParameter('alertExtraQuery', {}) as IDataObject;

        const firstPageItems = asArray(response.body, explicitProperty || undefined);

        let records = firstPageItems;

        if (returnAll) {
                const baseQuery = sanitizeQuery({
                        status: status || undefined,
                        starting_after: startingAfter || undefined,
                        ending_before: endingBefore || undefined,
                        device_id: deviceId || undefined,
                        ...buildKeyValueCollection(extraQuery),
                });

                records = await levelApiRequestAllCursor.call(
                        this,
                        '/alerts',
                        { ...baseQuery },
                        ALERTS_LIST_PER_PAGE,
                        explicitProperty || undefined,
                        firstPageItems,
                );
        }

        if (!returnAll) {
                records = records.slice(0, limit);
        }

        return records.map((entry) => ({ json: entry }));
};

const alertsGetPostReceive = async function (
        this: IExecuteSingleFunctions,
        _items: INodeExecutionData[],
        response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
        const explicitProperty = this.getNodeParameter('responsePropertyName', '') as string;
        const items = asArray(response.body, explicitProperty || undefined);
        if (!items.length) {
                throw new NodeOperationError(this.getNode(), 'Alert not found.', {
                        itemIndex: 0,
                });
        }

        return items.map((entry) => ({ json: entry }));
};

export const alertOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                        },
                },
                options: [
                        {
                                name: 'Get',
                                value: 'get',
                                action: 'Get an alert',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '=/alerts/{{$parameter["id"]}}',
                                        },
                                        output: {
                                                postReceive: [alertsGetPostReceive],
                                        },
                                },
                        },
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List alerts',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '/alerts',
                                        },
                                        send: {
                                                preSend: [alertsListPreSend],
                                        },
                                        output: {
                                                postReceive: [alertsListPostReceive],
                                        },
                                },
                        },
                ],
                default: 'list',
        },
];

export const alertFields: INodeProperties[] = [
        {
                displayName: 'Alert ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'ID of the alert to retrieve',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['get'],
                        },
                },
        },
        {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                default: false,
                description: 'Whether to return all results or only up to a given limit',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
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
                                resource: ['alerts'],
                                operation: ['list'],
                                returnAll: [false],
                        },
                },
        },
        {
                displayName: 'Device ID',
                name: 'alertDeviceId',
                type: 'string',
                default: '',
                description: 'Filter to only include alerts for the specified <code>device_id</code>',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Status',
                name: 'alertStatus',
                type: 'options',
                default: 'active',
                description: 'Filter to only include alerts with the given status',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
                options: [
                        { name: 'All Statuses', value: '' },
                        { name: 'Active', value: 'active' },
                        { name: 'Resolved', value: 'resolved' },
                ],
        },
        {
                displayName: 'Starting After',
                name: 'alertStartingAfter',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>starting_after</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with ID '1234', your subsequent call can include 'starting_after=1234' in order to fetch the next page of the list",
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Ending Before',
                name: 'alertEndingBefore',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>ending_before</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with ID '1234', your subsequent call can include 'ending_before=1234' in order to fetch the previous page of the list",
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },
        {
                displayName: 'Additional Query Parameters',
                name: 'alertExtraQuery',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                typeOptions: { multipleValues: true },
                default: {},
                description: 'Additional query string parameters supported by the API',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
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
];
