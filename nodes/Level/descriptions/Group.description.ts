import type { IDataObject, INodeProperties } from 'n8n-workflow';

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
                displayName: 'Parent Group ID',
                name: 'groupParentId',
                type: 'string',
                default: '',
                description:
                        "Filter to only include groups with the given parent ID. If not provided, all groups are returned. If 'null' is provided, only root groups are returned",
                displayOptions: {
                        show: {
                                resource: ['group'],
                                operation: ['list'],
                        },
                },
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
                name: 'groupStartingAfter',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>starting_after</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with ID '1234', your subsequent call can include 'starting_after=1234' in order to fetch the next page of the list",
                displayOptions: {
                        show: {
                                resource: ['group'],
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
                name: 'groupEndingBefore',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>ending_before</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with ID '1234', your subsequent call can include 'ending_before=1234' in order to fetch the previous page of the list",
                displayOptions: {
                        show: {
                                resource: ['group'],
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
                name: 'groupExtraQuery',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                typeOptions: { multipleValues: true },
                default: {},
                description: 'Additional query string parameters supported by the API',
                displayOptions: {
                        show: {
                                resource: ['group'],
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
