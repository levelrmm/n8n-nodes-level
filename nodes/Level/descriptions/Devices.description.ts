import type { INodeProperties } from 'n8n-workflow';

export const devicesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['devices'] } },
		options: [
			{ name: 'List', value: 'list', action: 'List devices' },
			{ name: 'Get', value: 'get', action: 'Get a device' },
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
		description: 'The ID of the device to retrieve.',
		displayOptions: { show: { resource: ['devices'], operation: ['get'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional query parameters for the request.',
		displayOptions: { show: { resource: ['devices'], operation: ['get'] } },
		options: [
			{ displayName: 'Include Operating System', name: 'includeOperatingSystem', type: 'boolean', default: false, description: 'Include detailed operating system information in the response (include_operating_system).' },
			{ displayName: 'Include CPUs', name: 'includeCpus', type: 'boolean', default: false, description: 'Include detailed CPU information in the response (include_cpus).' },
			{ displayName: 'Include Memory', name: 'includeMemory', type: 'boolean', default: false, description: 'Include detailed memory information in the response (include_memory).' },
			{ displayName: 'Include Disks', name: 'includeDisks', type: 'boolean', default: false, description: 'Include detailed disk and disk partition information in the response (include_disks).' },
			{ displayName: 'Include Network Interfaces', name: 'includeNetworkInterfaces', type: 'boolean', default: false, description: 'Include detailed network interface information in the response (include_network_interfaces).' },
			{ displayName: 'Additional Query Parameters', name: 'extraQuery', type: 'fixedCollection', placeholder: 'Add Parameter', typeOptions: { multipleValues: true }, default: {}, options: [ { displayName: 'Parameter', name: 'parameter', values: [ { displayName: 'Key', name: 'key', type: 'string', default: '' }, { displayName: 'Value', name: 'value', type: 'string', default: '' } ] } ], description: 'Any additional query string parameters supported by the API.' },
		],
	},
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', default: false, description: 'Fetch all pages automatically using cursor pagination (starting_after).', displayOptions: { show: { resource: ['devices'], operation: ['list'] } } },
	{ displayName: 'Limit', name: 'limit', type: 'number', default: 20, typeOptions: { minValue: 1, maxValue: 100 }, description: 'A limit on the number of objects to be returned. Range 1 to 100. Default is 20.', displayOptions: { show: { resource: ['devices'], operation: ['list'], returnAll: [false] } } },
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['devices'], operation: ['list'] } },
		options: [
			{ displayName: 'Group ID', name: 'groupId', type: 'string', default: '', description: "Filter to only include devices with the given parent group ID (group_id). If 'null' is provided, only devices without a parent group are returned." },
			{ displayName: 'Ancestor Group ID', name: 'ancestorGroupId', type: 'string', default: '', description: 'Filter to only include devices with the given group ID as an ancestor (ancestor_group_id).' },
			{ displayName: 'Include Operating System', name: 'includeOperatingSystem', type: 'boolean', default: false, description: 'Include detailed operating system information in the response (include_operating_system).' },
			{ displayName: 'Include CPUs', name: 'includeCpus', type: 'boolean', default: false, description: 'Include detailed CPU information in the response (include_cpus).' },
			{ displayName: 'Include Memory', name: 'includeMemory', type: 'boolean', default: false, description: 'Include detailed memory information in the response (include_memory).' },
			{ displayName: 'Include Disks', name: 'includeDisks', type: 'boolean', default: false, description: 'Include detailed disk and disk partition information in the response (include_disks).' },
			{ displayName: 'Include Network Interfaces', name: 'includeNetworkInterfaces', type: 'boolean', default: false, description: 'Include detailed network interface information in the response (include_network_interfaces).' },
			{ displayName: 'Starting After', name: 'startingAfter', type: 'string', default: '', description: 'Cursor for pagination (starting_after).' },
			{ displayName: 'Ending Before', name: 'endingBefore', type: 'string', default: '', description: 'Cursor for reverse pagination (ending_before).' },
			{ displayName: 'Additional Query Parameters', name: 'extraQuery', type: 'fixedCollection', placeholder: 'Add Parameter', typeOptions: { multipleValues: true }, default: {}, options: [ { displayName: 'Parameter', name: 'parameter', values: [ { displayName: 'Key', name: 'key', type: 'string', default: '' }, { displayName: 'Value', name: 'value', type: 'string', default: '' } ] } ], description: 'Any additional query string parameters supported by the API.' },
		],
	},
];
