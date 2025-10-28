import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.level.io/v2';

/**
 * Single request using the Level credential.
 */
export async function levelApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	option: Partial<IHttpRequestOptions> = {},
) {
	const creds = (await this.getCredentials('levelApi')) as { baseUrl?: string } | undefined;
	const baseUrl = (creds?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
	const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	const computedUrl = `${baseUrl}${path}`;

	// Avoid duplicate 'url' property errors if caller passes it in option
	const { url: _ignored, ...optionWithoutUrl } = option;

	const options: IHttpRequestOptions = {
		method,
		url: computedUrl,
		json: true,
		...(Object.keys(body).length ? { body } : {}),
		...(Object.keys(qs).length ? { qs } : {}),
		...optionWithoutUrl,
	};

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'levelApi',
			options,
		)) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Collect all items from a paginated endpoint.
 * Assumes page/per_page. If API returns a bare array, pass propertyName = ''.
 */
export async function levelApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions | IHookFunctions,
	propertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	option: Partial<IHttpRequestOptions> = {},
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let page = Number(qs.page ?? 1);
	const perPage = Number(qs.per_page ?? qs.limit ?? 100);

	for (;;) {
		const response = (await levelApiRequest.call(
			this,
			method,
			endpoint,
			body,
			{ ...qs, page, per_page: perPage },
			option,
		)) as IDataObject;

		const container = propertyName ? (response as any)[propertyName] : (response as any);
		const items: IDataObject[] = Array.isArray(container) ? container : [];
		results.push(...items);

		if (items.length < perPage) break;
		page += 1;
	}

	return results;
}
