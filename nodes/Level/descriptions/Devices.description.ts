import type { INodeProperties } from 'n8n-workflow';

export const devicesOperations: INodeProperties[] = [
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
                                name: 'Get',
                                value: 'get',
                                action: 'Get a device',
                                description: 'Retrieve a specific device by ID',
                        },
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List devices',
                                description: 'Retrieve devices with optional pagination',
                        },
                ],
                default: 'list',
        },
];

export const devicesFields: INodeProperties[] = [
        {
                displayName: 'Device ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'The unique identifier of the device',
                displayOptions: {
                        show: {
                                resource: ['devices'],
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
                                resource: ['devices'],
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
                                resource: ['devices'],
                                operation: ['list'],
                                returnAll: [false],
                        },
                },
        },
];
