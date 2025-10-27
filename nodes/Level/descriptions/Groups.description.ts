import type { INodeProperties } from 'n8n-workflow';

export const groupsOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['groups'],
                        },
                },
                options: [
                        {
                                name: 'Get',
                                value: 'get',
                                action: 'Get a group',
                                description: 'Retrieve a specific group by ID',
                        },
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List groups',
                                description: 'Retrieve groups with optional pagination',
                        },
                ],
                default: 'list',
        },
];

export const groupsFields: INodeProperties[] = [
        {
                displayName: 'Group ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'The unique identifier of the group',
                displayOptions: {
                        show: {
                                resource: ['groups'],
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
                                resource: ['groups'],
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
                                resource: ['groups'],
                                operation: ['list'],
                                returnAll: [false],
                        },
                },
        },
];
