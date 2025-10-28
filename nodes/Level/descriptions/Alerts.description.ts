import type { INodeProperties } from 'n8n-workflow';

/**
 * Alerts
 * Exposes documented query parameters for:
 * https://levelapi.readme.io/reference/listalerts
 */
export const alertsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['alerts'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List alerts',
				routing: {
					request: {
						method: 'GET',
						url: '/alerts',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an alert',
				routing: {
					request: {
						method: 'GET',
						url: '=/alerts/{{$parameter["id"]}}',
					},
				},
			},
		],
		default: 'list',
	},
];

export const alertsFields: INodeProperties[] = [
	// ----------------------------------------
	// alerts: get
	// ----------------------------------------
	{
		displayName: 'Alert ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the alert to retrieve.',
		displayOptions: {
			show: {
				resource: ['alerts'],
				operation: ['get'],
			},
		},
	},

	// ----------------------------------------
	// alerts: list
	// ----------------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Fetch all pages automatically using cursor pagination (uses <code>starting_after</code> under the hood).',
		displayOptions: {
			show: {
				resource: ['alerts'],
				operation: ['list'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 20,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		description: 'A limit on the number of objects to be returned. Range 1–100. Default is 20.',
		displayOptions: {
			show: {
				resource: ['alerts'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['alerts'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'Starting After',
				name: 'startingAfter',
				type: 'string',
				default: '',
				description: "A cursor for use in pagination. Provide the ID of the last object from the previous page to fetch the next page (<code>starting_after</code>).",
			},
			{
				displayName: 'Ending Before',
				name: 'endingBefore',
				type: 'string',
				default: '',
				description: "A cursor for use in pagination. Provide the ID of the first object from the previous page to fetch the previous page (<code>ending_before</code>).",
			},
			{
				displayName: 'Additional Query Parameters',
				name: 'extraQuery',
				type: 'fixedCollection',
				placeholder: 'Add Parameter',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Parameter',
						name: 'parameter',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
				description: 'Any additional query string parameters supported by the API.',
			},
		],
	},
];