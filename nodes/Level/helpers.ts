import type {
        IDataObject,
        IExecuteSingleFunctions,
        ILoadOptionsFunctions,
        IHttpRequestMethods,
        IHttpRequestOptions,
        INodeListSearchResult,
        INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.level.io/v2';

const DEVICE_URL_REGEX = /\/devices?\/([^/?#]+)/i;

function extractDeviceIdFromPath(pathname: string): string | undefined {
        const segments = pathname
                .split('/')
                .map((segment) => segment.trim())
                .filter((segment) => segment.length > 0);

        for (let index = 0; index < segments.length; index++) {
                const segment = segments[index];
                if (segment.toLowerCase() === 'device' || segment.toLowerCase() === 'devices') {
                        const candidate = segments[index + 1];
                        if (candidate) {
                                return candidate;
                        }
                }
        }

        return undefined;
}

export function parseDeviceIdFromInput(raw: unknown): string {
        const value =
                typeof raw === 'string'
                        ? raw
                        : raw && typeof raw === 'object' && !Array.isArray(raw)
                        ? String((raw as IDataObject).value ?? '')
                        : '';

        const trimmed = value.trim();
        if (!trimmed) {
                return '';
        }

        try {
                const url = new URL(trimmed);
                const candidateFromPath = extractDeviceIdFromPath(url.pathname);
                if (candidateFromPath) {
                        return decodeURIComponent(candidateFromPath.replace(/\/+$/, ''));
                }
        } catch {
                // Ignore URL parsing errors and fall back to regex handling below.
        }

        const match = trimmed.match(DEVICE_URL_REGEX);
        if (!match) {
                return trimmed;
        }

        const segment = match[1].replace(/\/+$/, '');

        try {
                return decodeURIComponent(segment);
        } catch {
                return segment;
        }
}

export function encodeDeviceIdForPath(deviceId: string): string {
        if (!deviceId) {
                return deviceId;
        }

        try {
                return encodeURIComponent(decodeURIComponent(deviceId));
        } catch {
                return encodeURIComponent(deviceId);
        }
}

export function buildKeyValueCollection(collection: IDataObject | undefined): IDataObject {
        if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
                return {};
        }

        const parameter = collection.parameter;

        if (!Array.isArray(parameter)) {
                return {};
        }

        return (parameter as Array<IDataObject | undefined>).reduce<IDataObject>((acc, entry) => {
                const key = typeof entry?.key === 'string' ? entry.key.trim() : '';
                if (!key) {
                        return acc;
                }

                acc[key] = entry?.value ?? '';
                return acc;
        }, {});
}


export function sanitizeQuery(query: IDataObject): IDataObject {
        return Object.entries(query).reduce<IDataObject>((acc, [key, value]) => {
                if (value === undefined || value === null || value === '') {
                        return acc;
                }

                acc[key] = value as IDataObject[keyof IDataObject];
                return acc;
        }, {});
}
export function asArray(response: unknown, explicitProperty?: string): IDataObject[] {
        if (Array.isArray(response)) {
                return response as IDataObject[];
        }

        if (response && typeof response === 'object') {
                const container = response as IDataObject;

                if (explicitProperty) {
                        const value = container[explicitProperty];
                        if (Array.isArray(value)) {
                                return value as IDataObject[];
                        }
                }

                for (const key of ['device', 'devices', 'group', 'groups', 'alert', 'alerts', 'data', 'items']) {
                        const value = container[key];
                        if (Array.isArray(value)) {
                                return value as IDataObject[];
                        }
                }

                return [container];
        }

        return [];
}

async function requestWithLevelCredential(
        context: IExecuteSingleFunctions | ILoadOptionsFunctions,
        options: IHttpRequestOptions,
): Promise<IDataObject | IDataObject[]> {
        const credentials = (await context.getCredentials('levelApi')) as { baseUrl?: string } | undefined;
        const baseUrl = (credentials?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');

        const requestOptions: IHttpRequestOptions = {
                ...options,
                baseURL: baseUrl,
                json: true,
        };

        return (await context.helpers.httpRequestWithAuthentication.call(
                context,
                'levelApi',
                requestOptions,
        )) as IDataObject | IDataObject[];
}

export async function levelApiRequest(
        this: IExecuteSingleFunctions | ILoadOptionsFunctions,
        method: IHttpRequestMethods,
        endpoint: string,
        body: IDataObject = {},
        qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
        const options: IHttpRequestOptions = {
                method,
                url: endpoint,
        };

        if (Object.keys(body).length) {
                options.body = body;
        }

        if (Object.keys(qs).length) {
                options.qs = qs;
        }

        try {
                return await requestWithLevelCredential(this, options);
        } catch (error) {
                throw new NodeOperationError(this.getNode(), error as Error);
        }
}

export async function levelApiRequestAllCursor(
        this: IExecuteSingleFunctions,
        endpoint: string,
        baseQuery: IDataObject,
        perPage: number,
        explicitProperty: string | undefined,
        seedItems: IDataObject[],
): Promise<IDataObject[]> {
        const aggregated = [...seedItems];

        if (!baseQuery.starting_after && seedItems.length < perPage) {
                return seedItems;
        }

        let cursor: string | undefined;
        if (typeof baseQuery.starting_after === 'string' && baseQuery.starting_after.trim()) {
                        cursor = baseQuery.starting_after.trim();
        }

        if (aggregated.length > 0) {
                const last = aggregated[aggregated.length - 1];
                const lastId = last?.id;
                if (typeof lastId === 'string' && lastId) {
                        cursor = lastId;
                } else if (typeof lastId === 'number') {
                        cursor = String(lastId);
                }
        }

        const staticQuery: IDataObject = { ...baseQuery };
        delete staticQuery.starting_after;

        while (cursor) {
                const qs: IDataObject = { ...staticQuery, starting_after: cursor, limit: perPage };

                const response = await levelApiRequest.call(this, 'GET', endpoint, {}, qs);
                const items = asArray(response, explicitProperty);
                if (!items.length) {
                        break;
                }

                aggregated.push(...items);

                if (items.length < perPage) {
                        break;
                }

                const last = items[items.length - 1];
                const lastId = last?.id;

                if (typeof lastId === 'string' && lastId) {
                        cursor = lastId;
                } else if (typeof lastId === 'number') {
                        cursor = String(lastId);
                } else {
                        break;
                }
        }

        return aggregated;
}

export async function searchDevicesByHostname(
        this: ILoadOptionsFunctions,
        filter?: string,
        paginationToken?: string,
): Promise<INodeListSearchResult> {
        const q = (filter ?? '').toLowerCase().trim();
        if (!q) {
                return { results: [] };
        }

        const options: INodePropertyOptions[] = [];
        let currentToken = paginationToken ? String(paginationToken) : undefined;
        let nextToken: string | undefined;
        let hasMore = true;

        while (options.length < 50 && hasMore) {
                const qs: IDataObject = { limit: 100 };
                if (currentToken) {
                        qs.starting_after = currentToken;
                }

                const response = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
                const items = asArray(response);

                if (!items.length) {
                        nextToken = undefined;
                        hasMore = false;
                        break;
                }

                for (const device of items) {
                        const id = device?.id;
                        if (typeof id !== 'string' && typeof id !== 'number') {
                                continue;
                        }

                        const hostname = String(device?.hostname ?? '').toLowerCase();
                        if (hostname.includes(q)) {
                                const name = `${(device?.hostname as string | undefined) || (device?.nickname as string | undefined) || String(id)}${
                                        device?.group_name ? ` — ${device.group_name as string}` : ''
                                }`;

                                options.push({
                                        name,
                                        value: String(id),
                                });
                        }
                }

                const last = items[items.length - 1];
                const lastId = last?.id;
                nextToken =
                        typeof lastId === 'string' || typeof lastId === 'number'
                                ? String(lastId)
                                : undefined;

                const receivedFullPage = items.length === 100 && nextToken !== undefined;
                currentToken = nextToken;
                hasMore = receivedFullPage;
        }

        const results = options.slice(0, 50);
        const result: INodeListSearchResult = { results };
        if (hasMore && nextToken) {
                result.paginationToken = nextToken;
        }

        return result;
}
