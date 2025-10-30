import type { IDataObject, INodeProperties } from 'n8n-workflow';

export const alertOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['alert'],
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
                                resource: ['alert'],
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
                                resource: ['alert'],
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
                                resource: ['alert'],
                                operation: ['list'],
                                returnAll: [false],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        limit: '={{$value}}',
                                },
                        },
                },
        },
        {
                displayName: 'Device ID',
                name: 'alertDeviceId',
                type: 'string',
                default: '',
                description: 'Filter alerts by device (<code>device_id</code>)',
                displayOptions: {
                        show: {
                                resource: ['alert'],
                                operation: ['list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        device_id: '={{$value}}',
                                },
                        },
                },
        },
        {
                displayName: 'Status',
                name: 'alertStatus',
                type: 'options',
                default: '',
                description: 'Filter alerts by current status (<code>status</code>)',
                displayOptions: {
                        show: {
                                resource: ['alert'],
                                operation: ['list'],
                        },
                },
                options: [
                        { name: 'All Statuses', value: '' },
                        { name: 'Active', value: 'active' },
                        { name: 'Resolved', value: 'resolved' },
                ],
                routing: {
                        request: {
                                qs: {
                                        status: '={{$value || undefined}}',
                                },
                        },
                },
        },
        {
                displayName: 'Starting After',
                name: 'alertStartingAfter',
                type: 'string',
                default: '',
                description: 'Cursor for pagination (<code>starting_after</code>)',
                displayOptions: {
                        show: {
                                resource: ['alert'],
                                operation: ['list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        starting_after: '={{$value}}',
                                },
                        },
                },
        },
        {
                displayName: 'Ending Before',
                name: 'alertEndingBefore',
                type: 'string',
                default: '',
                description: 'Cursor for reverse pagination (<code>ending_before</code>)',
                displayOptions: {
                        show: {
                                resource: ['alert'],
                                operation: ['list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        ending_before: '={{$value}}',
                                },
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
                                resource: ['alert'],
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
                routing: {
                        request: {
                                qs: '={{$value.parameter?.reduce((acc, cur) => cur?.key ? Object.assign(acc, { [cur.key]: cur.value ?? "" }) : acc, {}) || {}}}' as unknown as IDataObject,
                        },
                },
        },
];
