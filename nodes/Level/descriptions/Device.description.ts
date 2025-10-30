import type { IDataObject, INodeProperties } from 'n8n-workflow';

export const deviceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['device'],
			},
		},
                options: [
                        {
                                name: 'List',
                                value: 'list',
                                action: 'List devices',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '/devices',
                                        },
                                },
                        },
                        {
                                name: 'Get',
                                value: 'get',
                                action: 'Get a device',
                                routing: {
                                        request: {
                                                method: 'GET',
                                                url: '=/devices/{{$parameter["id"]}}',
                                        },
                                },
                        },
                ],
		default: 'list',
	},
];

export const deviceFields: INodeProperties[] = [
        // ---------- Device -> Get ----------
        {
                displayName: 'Device ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'The ID of the device to retrieve.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get'],
                        },
                },
        },
        {
                displayName: 'Include CPUs',
                name: 'deviceIncludeCpus',
                type: 'boolean',
                default: false,
                description: 'Include detailed CPU information in the response.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get', 'list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        include_cpus: '={{$value ? true : undefined}}',
                                },
                        },
                },
        },
        {
                displayName: 'Include Disks',
                name: 'deviceIncludeDisks',
                type: 'boolean',
                default: false,
                description: 'Include detailed disk and disk partition information in the response.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get', 'list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        include_disks: '={{$value ? true : undefined}}',
                                },
                        },
                },
        },
        {
                displayName: 'Include Memory',
                name: 'deviceIncludeMemory',
                type: 'boolean',
                default: false,
                description: 'Include detailed memory information in the response.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get', 'list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        include_memory: '={{$value ? true : undefined}}',
                                },
                        },
                },
        },
        {
                displayName: 'Include Network Interfaces',
                name: 'deviceIncludeNetworkInterfaces',
                type: 'boolean',
                default: false,
                description: 'Include detailed network interface information in the response.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get', 'list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        include_network_interfaces: '={{$value ? true : undefined}}',
                                },
                        },
                },
        },
        {
                displayName: 'Include Operating System',
                name: 'deviceIncludeOperatingSystem',
                type: 'boolean',
                default: false,
                description: 'Include detailed operating system information in the response.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get', 'list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        include_operating_system: '={{$value ? true : undefined}}',
                                },
                        },
                },
        },
        {
                displayName: 'Additional Query Parameters',
                name: 'deviceExtraQuery',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                typeOptions: { multipleValues: true },
                default: {},
                description: 'Additional query string parameters supported by the API.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get', 'list'],
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

        // ---------- Device -> List ----------
        {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                default: false,
                description: 'Whether to return all results or only up to a given limit',
                displayOptions: {
                        show: {
                                resource: ['device'],
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
                description:
                        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 20.',
                displayOptions: {
                        show: {
                                resource: ['device'],
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
                displayName: 'Group ID',
                name: 'deviceGroupId',
                type: 'string',
                default: '',
                description:
                        "Filter to only include devices with the given parent group ID. If not provided, all devices are returned. If 'null' is provided, only devices without a parent group are returned.",
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        group_id: '={{$value}}',
                                },
                        },
                },
        },
        {
                displayName: 'Ancestor Group ID',
                name: 'deviceAncestorGroupId',
                type: 'string',
                default: '',
                description: 'Filter to only include devices with the given group ID as an ancestor.',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['list'],
                        },
                },
                routing: {
                        request: {
                                qs: {
                                        ancestor_group_id: '={{$value}}',
                                },
                        },
                },
        },
        {
                displayName: 'Starting After',
                name: 'deviceStartingAfter',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>starting_after</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with ID '1234', your subsequent call can include 'starting_after=1234' in order to fetch the next page of the list.",
                displayOptions: {
                        show: {
                                resource: ['device'],
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
                name: 'deviceEndingBefore',
                type: 'string',
                default: '',
                description:
                        "A cursor for use in pagination. <code>ending_before</code> is an ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with ID '1234', your subsequent call can include 'ending_before=1234' in order to fetch the previous page of the list.",
                displayOptions: {
                        show: {
                                resource: ['device'],
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
];
