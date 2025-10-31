import type {
        IDataObject,
        IExecuteSingleFunctions,
        IHttpRequestOptions,
        IN8nHttpFullResponse,
        INodeExecutionData,
        INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
        asArray,
        buildKeyValueCollection,
        levelApiRequestAllCursor,
        sanitizeQuery,
} from '../helpers';

const GROUPS_LIST_PER_PAGE = 100;

const groupsListPreSend = async function (
        this: IExecuteSingleFunctions,
        requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
        const returnAll = this.getNodeParameter('returnAll', false) as boolean;
        const limit = this.getNodeParameter('limit', 50) as number;
        const parentId = this.getNodeParameter('groupParentId', '') as string;
        const startingAfter = this.getNodeParameter('groupStartingAfter', '') as string;
        const endingBefore = this.getNodeParameter('groupEndingBefore', '') as string;
        const extraQuery = this.getNodeParameter('groupExtraQuery', {}) as IDataObject;

        const qs = sanitizeQuery({
                limit: returnAll ? GROUPS_LIST_PER_PAGE : limit,
                parent_id: parentId || undefined,
                starting_after: startingAfter || undefined,
                ending_before: endingBefore || undefined,
                ...buildKeyValueCollection(extraQuery),
        });

        requestOptions.qs = qs;
        return requestOptions;
};

const groupsListPostReceive = async function (
        this: IExecuteSingleFunctions,
        _items: INodeExecutionData[],
        response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
        const explicitProperty = this.getNodeParameter('responsePropertyName', '') as string;
        const returnAll = this.getNodeParameter('returnAll', false) as boolean;
        const limit = this.getNodeParameter('limit', 50) as number;
        const parentId = this.getNodeParameter('groupParentId', '') as string;
        const startingAfter = this.getNodeParameter('groupStartingAfter', '') as string;
        const endingBefore = this.getNodeParameter('groupEndingBefore', '') as string;
        const extraQuery = this.getNodeParameter('groupExtraQuery', {}) as IDataObject;

        const firstPageItems = asArray(response.body, explicitProperty || undefined);
        let records = firstPageItems;

        if (returnAll) {
                const baseQuery = sanitizeQuery({
                        parent_id: parentId || undefined,
                        starting_after: startingAfter || undefined,
                        ending_before: endingBefore || undefined,
                        ...buildKeyValueCollection(extraQuery),
                });

                records = await levelApiRequestAllCursor.call(
                        this,
                        '/groups',
                        { ...baseQuery },
                        GROUPS_LIST_PER_PAGE,
                        explicitProperty || undefined,
                        firstPageItems,
                );
        }

        if (!returnAll) {
                records = records.slice(0, limit);
        }

        return records.map((entry) => ({ json: entry }));
};

const groupsGetPostReceive = async function (
        this: IExecuteSingleFunctions,
        _items: INodeExecutionData[],
        response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
        const explicitProperty = this.getNodeParameter('responsePropertyName', '') as string;
        const items = asArray(response.body, explicitProperty || undefined);
        if (!items.length) {
                throw new NodeOperationError(this.getNode(), 'Group not found.', {
                        itemIndex: 0,
                });
        }

        return items.map((entry) => ({ json: entry }));
};

export const groupOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['groups'],
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
                                        output: {
                                                postReceive: [groupsGetPostReceive],
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
                                        send: {
                                                preSend: [groupsListPreSend],
                                        },
                                        output: {
                                                postReceive: [groupsListPostReceive],
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
                                resource: ['groups'],
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
                                resource: ['groups'],
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
                                resource: ['groups'],
                                operation: ['list'],
                                returnAll: [false],
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
                                resource: ['groups'],
                                operation: ['list'],
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
                                resource: ['groups'],
                                operation: ['list'],
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
                                resource: ['groups'],
                                operation: ['list'],
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
                                resource: ['groups'],
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
        },
];
