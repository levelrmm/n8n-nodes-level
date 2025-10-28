import type { INodeProperties } from 'n8n-workflow';

export const alertsOperations: INodeProperties[] = [
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
                                description: 'Retrieve a specific alert by ID',
                        },
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List alerts',
                                description: 'Retrieve alerts with optional pagination',
                        },
                ],
                default: 'list',
        },
];

export const alertsFields: INodeProperties[] = [
        {
                displayName: 'Alert ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'The unique identifier of the alert',
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
                typeOptions: {
                        minValue: 1,
                        maxValue: 100,
                },
                default: 50,
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
                displayName: 'Page',
                name: 'page',
                type: 'number',
                default: 1,
                description: 'Page number for pagination when using page/per_page style pagination',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },

        {
                displayName: 'Starting After',
                name: 'starting_after',
                type: 'string',
                default: '',
                description: 'A cursor for use in pagination. Provide the ID of the last object from the previous page to fetch the next page of results.',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },

        {
                displayName: 'Ending Before',
                name: 'ending_before',
                type: 'string',
                default: '',
                description: 'A cursor for use in pagination. Provide the ID of the first object from the current page to fetch the previous page of results.',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },

        {
                displayName: 'Additional Query Parameters',
                name: 'additionalQuery',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                default: {},
                options: [
                        {
                                name: 'parameters',
                                displayName: 'Parameters',
                                values: [
                                        {
                                                displayName: 'Key',
                                                name: 'key',
                                                type: 'string',
                                                default: '',
                                                description: 'Query string parameter name as accepted by the Level API for this endpoint',
                                        },
                                        {
                                                displayName: 'Value',
                                                name: 'value',
                                                type: 'string',
                                                default: '',
                                                description: 'Value to send for this parameter',
                                        },
                                ],
                        },
                ],
                description: 'Pass any additional query parameters supported by this endpoint.',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['list'],
                        },
                },
        },

        {
                displayName: 'Additional Query Parameters',
                name: 'additionalQuery',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                default: {},
                options: [
                        {
                                name: 'parameters',
                                displayName: 'Parameters',
                                values: [
                                        {
                                                displayName: 'Key',
                                                name: 'key',
                                                type: 'string',
                                                default: '',
                                                description: 'Query string parameter name as accepted by the Level API for this endpoint',
                                        },
                                        {
                                                displayName: 'Value',
                                                name: 'value',
                                                type: 'string',
                                                default: '',
                                                description: 'Value to send for this parameter',
                                        },
                                ],
                        },
                ],
                description: 'Pass any additional query parameters supported by this endpoint.',
                displayOptions: {
                        show: {
                                resource: ['alerts'],
                                operation: ['get'],
                        },
                },
        },
];
