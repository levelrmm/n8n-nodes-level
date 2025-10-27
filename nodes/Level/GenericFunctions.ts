import type {
        IDataObject,
        IExecuteFunctions,
        IHookFunctions,
        ILoadOptionsFunctions,
        IHttpRequestOptions,
        IWebhookFunctions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.level.io/v1';

export async function levelApiRequest(
        this: IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions | IHookFunctions,
        method: string,
        endpoint: string,
        qs: IDataObject = {},
        body: IDataObject = {},
        option: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
        const credentials = await this.getCredentials('levelApi');

        const baseUrl = (credentials.baseUrl as string | undefined) || DEFAULT_BASE_URL;
        const apiKey = credentials.apiKey as string;

        const options: IHttpRequestOptions = {
                method,
                body,
                qs,
                url: `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
                json: true,
                headers: {
                        Authorization: `Bearer ${apiKey}`,
                },
                ...option,
        };

        if (Object.keys(body).length === 0) {
                delete options.body;
        }

        if (Object.keys(qs).length === 0) {
                delete options.qs;
        }

        try {
                return (await this.helpers.httpRequest(options)) as IDataObject | IDataObject[];
        } catch (error) {
                throw new NodeApiError(this.getNode(), error as IDataObject);
        }
}

export async function levelApiRequestAllItems(
        this: IExecuteFunctions | ILoadOptionsFunctions,
        method: string,
        endpoint: string,
        qs: IDataObject = {},
        body: IDataObject = {},
): Promise<IDataObject[]> {
        const returnData: IDataObject[] = [];
        let responseData: IDataObject | IDataObject[];
        let paginationToken: string | number | undefined;
        const query = { ...qs };

        do {
                if (paginationToken !== undefined) {
                        query.page = paginationToken;
                }

                responseData = await levelApiRequest.call(this, method, endpoint, query, body);

                if (Array.isArray(responseData)) {
                        returnData.push(...responseData);
                } else {
                        const arrayEntries = Object.entries(responseData).filter(([, value]) => Array.isArray(value));

                        const dataArray = (responseData.data as IDataObject[] | undefined) ?? undefined;
                        if (Array.isArray(dataArray)) {
                                returnData.push(...dataArray);
                        }

                        for (const [key, value] of arrayEntries) {
                                if (key === 'data') {
                                        continue;
                                }
                                returnData.push(...((value as IDataObject[]) ?? []));
                        }

                        const meta = responseData.meta as IDataObject | undefined;
                        paginationToken =
                                (meta?.next_page as string | number | undefined) ??
                                (meta?.nextPage as string | number | undefined) ??
                                (meta?.next as string | number | undefined);
                }
        } while (paginationToken !== undefined && paginationToken !== null && paginationToken !== '');

        return returnData;
}
