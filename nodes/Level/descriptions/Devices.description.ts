import type { INodeProperties } from 'n8n-workflow';

export const devicesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['device'] } },
		options: [
			{ name: 'List', value: 'list', action: 'List devices' },
			{ name: 'Get', value: 'get', action: 'Get a device' },
		],
		default: 'list',
	},
];

export const devicesFields: INodeProperties[] = [
	// ---------- Device -> Get ----------
	{
		displayName: 'Device ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the device to retrieve.',
		displayOptions: { show: { resource: ['device'], operation: ['get'] } },
	},
	{
		displayName: 'Optional Fields',
		name: 'deviceGetOptions',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Optional query parameters.',
		displayOptions: { show: { resource: ['device'], operation: ['get'] } },
		options: [
			{ displayName: 'Include Operating System', name: 'includeOperatingSystem', type: 'boolean', default: false, description: 'Include detailed operating system information in the response (<code>include_operating_system</code>).' },
			{ displayName: 'Include CPUs', name: 'includeCpus', type: 'boolean', default: false, description: 'Include detailed CPU information in the response (<code>include_cpus</code>).' },
			{ displayName: 'Include Memory', name: 'includeMemory', type: 'boolean', default: false, description: 'Include detailed memory information in the response (<code>include_memory</code>).' },
			{ displayName: 'Include Disks', name: 'includeDisks', type: 'boolean', default: false, description: 'Include detailed disk and disk partition information in the response (<code>include_disks</code>).' },
			{ displayName: 'Include Network Interfaces', name: 'includeNetworkInterfaces', type: 'boolean', default: false, description: 'Include detailed network interface information in the response (<code>include_network_interfaces</code>).' },
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
				description: 'Any additional query string parameters supported by the API.',
			},
		],
	},

	// ---------- Device -> List ----------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Fetch all pages automatically using cursor pagination (<code>starting_after</code>).',
		displayOptions: { show: { resource: ['device'], operation: ['list'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 20,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'A limit on the number of objects to be returned. Range 1–100. Default is 20.',
		displayOptions: { show: { resource: ['device'], operation: ['list'], returnAll: [false] } },
	},
	{
		displayName: 'Optional Fields',
		name: 'deviceListOptions',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['device'], operation: ['list'] } },
		options: [
			{ displayName: 'Group ID', name: 'groupId', type: 'string', default: '', description: "Filter to only include devices with the given parent group ID (<code>group_id</code>). If 'null' is provided, only devices without a parent group are returned." },
			{ displayName: 'Ancestor Group ID', name: 'ancestorGroupId', type: 'string', default: '', description: 'Filter to only include devices with the given group ID as an ancestor (<code>ancestor_group_id</code>).' },
			{ displayName: 'Include Operating System', name: 'includeOperatingSystem', type: 'boolean', default: false, description: 'Include detailed operating system information in the response (<code>include_operating_system</code>).' },
			{ displayName: 'Include CPUs', name: 'includeCpus', type: 'boolean', default: false, description: 'Include detailed CPU information in the response (<code>include_cpus</code>).' },
			{ displayName: 'Include Memory', name: 'includeMemory', type: 'boolean', default: false, description: 'Include detailed memory information in the response (<code>include_memory</code>).' },
			{ displayName: 'Include Disks', name: 'includeDisks', type: 'boolean', default: false, description: 'Include detailed disk and disk partition information in the response (<code>include_disks</code>).' },
			{ displayName: 'Include Network Interfaces', name: 'includeNetworkInterfaces', type: 'boolean', default: false, description: 'Include detailed network interface information in the response (<code>include_network_interfaces</code>).' },
			{ displayName: 'Starting After', name: 'startingAfter', type: 'string', default: '', description: "A cursor for use in pagination (<code>starting_after</code>)." },
			{ displayName: 'Ending Before', name: 'endingBefore', type: 'string', default: '', description: "A cursor for use in pagination (<code>ending_before</code>)." },
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
				description: 'Any additional query string parameters supported by the API.',
			},
		],
	},
];
