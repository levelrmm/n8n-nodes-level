// nodes/Level/GenericFunctions.ts
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

export async function levelApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	option: IHttpRequestOptions = {},
) {
	// read the credential just to get baseUrl; auth will be applied by httpRequestWithAuthentication
	const creds = (await this.getCredentials('levelApi')) as { baseUrl?: string };
	const baseUrl = (creds?.baseUrl as string | undefined) ?? DEFAULT_BASE_URL;

	const url =
		`${baseUrl.replace(/\/$/, '')}` +
		`${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

	const options: IHttpRequestOptions = {
		method,
		json: true,
		url,
		body,
		qs,
		...option,
	};

	if (!Object.keys(body).length) delete options.body;
	if (!Object.keys(qs).length) delete options.qs;

	try {
		// uses credential’s authenticate block (Authorization: <API_KEY>)
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'levelApi',
			options,
		)) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
