import type { INodeProperties } from 'n8n-workflow';

export const groupsOperations: INodeProperties[] = [
	{ displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, displayOptions: { show: { resource: ['groups'] } }, options: [
		{ name: 'List', value: 'list', action: 'List groups' },
		{ name: 'Get', value: 'get', action: 'Get a group' },
	], default: 'list' },
];

export const groupsFields: INodeProperties[] = [
	{ displayName: 'Group ID', name: 'id', type: 'string', required: true, default: '', description: 'The ID of the group to retrieve.', displayOptions: { show: { resource: ['groups'], operation: ['get'] } } },
	{ displayName: 'Return All', name: 'returnAll', type: 'boolean', default: false, description: 'Fetch all pages automatically using cursor pagination (starting_after).', displayOptions: { show: { resource: ['groups'], operation: ['list'] } } },
	{ displayName: 'Limit', name: 'limit', type: 'number', default: 20, typeOptions: { minValue: 1, maxValue: 100 }, description: 'A limit on the number of objects to be returned. Range 1 to 100. Default is 20.', displayOptions: { show: { resource: ['groups'], operation: ['list'], returnAll: [false] } } },
	{ displayName: 'Options', name: 'options', type: 'collection', placeholder: 'Add Option', default: {}, displayOptions: { show: { resource: ['groups'], operation: ['list'] } }, options: [
		{ displayName: 'Parent Group ID', name: 'parentId', type: 'string', default: '', description: "Filter to only include groups with the given parent group ID (parent_id). If 'null' is provided, only groups without a parent are returned." },
		{ displayName: 'Starting After', name: 'startingAfter', type: 'string', default: '', description: 'Cursor for pagination (starting_after).' },
		{ displayName: 'Ending Before', name: 'endingBefore', type: 'string', default: '', description: 'Cursor for reverse pagination (ending_before).' },
		{ displayName: 'Additional Query Parameters', name: 'extraQuery', type: 'fixedCollection', placeholder: 'Add Parameter', typeOptions: { multipleValues: true }, default: {}, options: [ { displayName: 'Parameter', name: 'parameter', values: [ { displayName: 'Key', name: 'key', type: 'string', default: '' }, { displayName: 'Value', name: 'value', type: 'string', default: '' } ] } ], description: 'Any additional query string parameters supported by the API.' },
	] },
];
