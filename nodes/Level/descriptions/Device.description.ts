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
                description: 'ID of the device to retrieve',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get'],
                        },
                },
        },
        {
                displayName: 'Get Options',
                name: 'deviceGetOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                description: 'Optional query parameters',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['get'],
                        },
                },
                options: [
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
                                                qs: '={{$value.parameter?.reduce((acc, cur) => cur?.key ? Object.assign(acc, { [cur.key]: cur.value ?? "" }) : acc, {} as Record<string, string>) || {}}}' as unknown as IDataObject,
                                        },
                                },
                        },
                        {
                                displayName: 'Include CPUs',
                                name: 'includeCpus',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed CPU information in the response (<code>include_cpus</code>)',
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
                                name: 'includeDisks',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed disk information in the response (<code>include_disks</code>)',
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
                                name: 'includeMemory',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed memory information in the response (<code>include_memory</code>)',
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
                                name: 'includeNetworkInterfaces',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed network interface information in the response (<code>include_network_interfaces</code>)',
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
                                name: 'includeOperatingSystem',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed operating system information in the response (<code>include_operating_system</code>)',
                                routing: {
                                        request: {
                                                qs: {
                                                        include_operating_system: '={{$value ? true : undefined}}',
                                                },
                                        },
                                },
                        },
                ],
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
                description: 'Max number of results to return',
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
                displayName: 'List Options',
                name: 'deviceListOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                description: 'Optional query parameters',
                displayOptions: {
                        show: {
                                resource: ['device'],
                                operation: ['list'],
                        },
                },
                options: [
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
                                                qs: '={{$value.parameter?.reduce((acc, cur) => cur?.key ? Object.assign(acc, { [cur.key]: cur.value ?? "" }) : acc, {} as Record<string, string>) || {}}}' as unknown as IDataObject,
                                        },
                                },
                        },
                        {
                                displayName: 'Ancestor Group ID',
                                name: 'ancestorGroupId',
                                type: 'string',
                                default: '',
                                description: 'Filter by ancestor group ID (<code>ancestor_group_id</code>)',
                                routing: {
                                        request: {
                                                qs: {
                                                        ancestor_group_id: '={{$value}}',
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
                                displayName: 'Group ID',
                                name: 'groupId',
                                type: 'string',
                                default: '',
                                description: 'Filter by parent group ID (<code>group_id</code>)',
                                routing: {
                                        request: {
                                                qs: {
                                                        group_id: '={{$value}}',
                                                },
                                        },
                                },
                        },
                        {
                                displayName: 'Include CPUs',
                                name: 'includeCpus',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed CPU information in the response (<code>include_cpus</code>)',
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
                                name: 'includeDisks',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed disk information in the response (<code>include_disks</code>)',
                        },
                        {
                                displayName: 'Include Memory',
                                name: 'includeMemory',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed memory information in the response (<code>include_memory</code>)',
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
                                name: 'includeNetworkInterfaces',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed network interface information in the response (<code>include_network_interfaces</code>)',
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
                                name: 'includeOperatingSystem',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed operating system information in the response (<code>include_operating_system</code>)',
                                routing: {
                                        request: {
                                                qs: {
                                                        include_operating_system: '={{$value ? true : undefined}}',
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
                ],
        },
];
