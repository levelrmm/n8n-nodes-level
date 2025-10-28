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

        {
                displayName: 'Page',
                name: 'page',
                type: 'number',
                default: 1,
                description: 'Page number for pagination when using page/per_page style pagination',
                displayOptions: {
                        show: {
                                resource: ['groups'],
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
                                resource: ['groups'],
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
                                resource: ['groups'],
                                operation: ['list'],
                        },
                },
        },

        {
                displayName: 'Parent Group ID',
                name: 'parent_id',
                type: 'string',
                default: '',
                description: 'Filter to only include groups with the given parent group ID. If not provided, all groups are returned.  ',
                displayOptions: {
                        show: {
                                resource: ['groups'],
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
                                resource: ['groups'],
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
                                resource: ['groups'],
                                operation: ['get'],
                        },
                },
        },
];
