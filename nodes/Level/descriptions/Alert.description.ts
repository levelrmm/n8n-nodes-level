import type { INodeProperties } from 'n8n-workflow';

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
                        { name: 'Get', value: 'get', action: 'Get an alert' },
                        { name: 'List', value: 'list', action: 'List alerts' },
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
        },
        {
                displayName: 'Optional Fields',
                name: 'alertListOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                description: 'Optional query parameters',
                displayOptions: {
                        show: {
                                resource: ['alert'],
                                operation: ['list'],
                        },
                },
                options: [
                        {
                                displayName: 'Starting After',
                                name: 'startingAfter',
                                type: 'string',
                                default: '',
                                description: 'Cursor for pagination (<code>starting_after</code>)',
                        },
                        {
                                displayName: 'Ending Before',
                                name: 'endingBefore',
                                type: 'string',
                                default: '',
                                description: 'Cursor for reverse pagination (<code>ending_before</code>)',
                        },
                        {
                                displayName: 'Additional Query Parameters',
                                name: 'extraQuery',
                                type: 'fixedCollection',
                                placeholder: 'Add Parameter',
                                typeOptions: { multipleValues: true },
                                default: {},
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
                                description: 'Additional query string parameters supported by the API',
                        },
                ],
        },
];
