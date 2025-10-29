import type { INodeProperties } from 'n8n-workflow';

export const groupOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['group'],
                        },
                },
                options: [
                        {
                                name: 'Get',
                                value: 'get',
                                action: 'Get a group',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '=/groups/{{$parameter["id"]}}',
                                        },
                                },
                        },
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List groups',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '/groups',
                                        },
                                },
                        },
                ],
                default: 'list',
        },
];

export const groupFields: INodeProperties[] = [
        {
                displayName: 'Group ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'ID of the group to retrieve',
                displayOptions: {
                        show: {
                                resource: ['group'],
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
                                resource: ['group'],
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
                                resource: ['group'],
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
                displayName: 'Optional Fields',
                name: 'groupListOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                description: 'Optional query parameters',
                displayOptions: {
                        show: {
                                resource: ['group'],
                                operation: ['list'],
                        },
                },
                options: [
                        {
                                displayName: 'Parent Group ID',
                                name: 'parentId',
                                type: 'string',
                                default: '',
                                description: 'Filter by parent group ID (<code>parent_id</code>)',
                                routing: {
                                        request: {
                                                qs: {
                                                        parent_id: '={{$value}}',
                                                },
                                        },
                                },
                        },
                        {
                                displayName: 'Starting After',
                                name: 'startingAfter',
                                type: 'string',
                                default: '',
                                description: 'Cursor for pagination (<code>starting_after</code>)',
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
                                name: 'endingBefore',
                                type: 'string',
                                default: '',
                                description: 'Cursor for reverse pagination (<code>ending_before</code>)',
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
                                routing: {
                                        request: {
                                                qs: '={{$value.parameter?.reduce((acc, cur) => cur?.key ? Object.assign(acc, { [cur.key]: cur.value ?? "" }) : acc, {} as Record<string, string>) || {}}}',
                                        },
                                },
                        },
                ],
        },
];
