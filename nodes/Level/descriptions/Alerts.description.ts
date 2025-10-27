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
];
