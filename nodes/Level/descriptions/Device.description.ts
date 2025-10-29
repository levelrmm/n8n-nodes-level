import type { INodeProperties } from 'n8n-workflow';

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
			{ name: 'List', value: 'list', action: 'List devices' },
			{ name: 'Get', value: 'get', action: 'Get a device' },
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
                displayName: 'Optional Fields',
                name: 'getOptions',
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
                        },
                        {
                                displayName: 'Include CPUs',
                                name: 'includeCpus',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed CPU information in the response (<code>include_cpus</code>)',
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
                        },
                        {
                                displayName: 'Include Network Interfaces',
                                name: 'includeNetworkInterfaces',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed network interface information in the response (<code>include_network_interfaces</code>)',
                        },
                        {
                                displayName: 'Include Operating System',
                                name: 'includeOperatingSystem',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed operating system information in the response (<code>include_operating_system</code>)',
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
        },
        {
                displayName: 'Additional Fields',
                name: 'additionalFields',
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
                        },
                        {
                                displayName: 'Ancestor Group ID',
                                name: 'ancestorGroupId',
                                type: 'string',
                                default: '',
                                description: 'Filter by ancestor group ID (<code>ancestor_group_id</code>)',
                        },
                        {
                                displayName: 'Ending Before',
                                name: 'endingBefore',
                                type: 'string',
                                default: '',
                                description: 'Cursor for reverse pagination (<code>ending_before</code>)',
                        },
                        {
                                displayName: 'Group ID',
                                name: 'groupId',
                                type: 'string',
                                default: '',
                                description: 'Filter by parent group ID (<code>group_id</code>)',
                        },
                        {
                                displayName: 'Include CPUs',
                                name: 'includeCpus',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed CPU information in the response (<code>include_cpus</code>)',
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
                        },
                        {
                                displayName: 'Include Network Interfaces',
                                name: 'includeNetworkInterfaces',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed network interface information in the response (<code>include_network_interfaces</code>)',
                        },
                        {
                                displayName: 'Include Operating System',
                                name: 'includeOperatingSystem',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to include detailed operating system information in the response (<code>include_operating_system</code>)',
                        },
                        {
                                displayName: 'Starting After',
                                name: 'startingAfter',
                                type: 'string',
                                default: '',
                                description: 'Cursor for pagination (<code>starting_after</code>)',
                        },
                ],
        },
];
