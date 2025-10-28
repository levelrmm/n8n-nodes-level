import type { INodeProperties } from 'n8n-workflow';

export const alertsOperations: INodeProperties[] = [
	{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, displayOptions: { show: { resource: ['alert'] } }, options: [
		{ name: 'List', value: 'list', action: 'List alerts' },
		{ name: 'Get', value: 'get', action: 'Get an alert' },
	], default: 'list' },
];

export const alertsFields: INodeProperties[] = [
	{ displayName: 'Alert ID', name: 'id', type: 'string', required: true, default: '', description: 'The ID of the alert to retrieve.', displayOptions: { show: { resource: ['alert'], operation: ['get'] } } },
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', default: false, description: 'Fetch all pages automatically using cursor pagination (<code>starting_after</code>).', displayOptions: { show: { resource: ['alert'], operation: ['list'] } } },
	{ displayName: 'Limit', name: 'limit', type: 'number', default: 20, typeOptions: { minValue: 1, maxValue: 100 }, description: 'A limit on the number of objects to be returned. Range 1–100. Default is 20.', displayOptions: { show: { resource: ['alert'], operation: ['list'], returnAll: [false] } } },
	{ displayName: 'Optional Fields', name: 'alertListOptions', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['alert'], operation: ['list'] } }, options: [
		{ displayName: 'Starting After', name: 'startingAfter', type: 'string', default: '', description: 'Cursor for pagination (<code>starting_after</code>).' },
		{ displayName: 'Ending Before', name: 'endingBefore', type: 'string', default: '', description: 'Cursor for reverse pagination (<code>ending_before</code>).' },
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
	] },
];
