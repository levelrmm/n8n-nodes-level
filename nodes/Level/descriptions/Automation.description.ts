import type {
        IDataObject,
        IExecuteSingleFunctions,
        IHttpRequestOptions,
        INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { buildKeyValueCollection, parseDeviceIdFromInput } from '../helpers';

const automationTriggerPreSend = async function (
        this: IExecuteSingleFunctions,
        requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
        const jsonParameters = this.getNodeParameter('jsonParameters', false) as boolean;

        if (jsonParameters) {
                const rawPayload = this.getNodeParameter('jsonPayload') as string | IDataObject;
                let payload: IDataObject;

                if (typeof rawPayload === 'string') {
                        let parsed: unknown;
                        try {
                                parsed = rawPayload ? (JSON.parse(rawPayload) as unknown) : {};
                        } catch {
                                throw new NodeOperationError(this.getNode(), 'Invalid JSON payload.');
                        }

                        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                                throw new NodeOperationError(this.getNode(), 'JSON payload must resolve to an object.');
                        }

                        payload = parsed as IDataObject;
                } else if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
                        payload = rawPayload as IDataObject;
                } else {
                        throw new NodeOperationError(this.getNode(), 'JSON payload must resolve to an object.');
                }

                requestOptions.body = payload;
                return requestOptions;
        }

        const deviceIdsValue = this.getNodeParameter('automationDeviceIds', []) as string | string[];
        const rawValues = Array.isArray(deviceIdsValue)
                ? (deviceIdsValue as string[])
                : deviceIdsValue
                ? [deviceIdsValue]
                : [];

        const normalizedDeviceIds = rawValues
                .map((entry) => parseDeviceIdFromInput(entry))
                .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

        const customParameterCollection = this.getNodeParameter('automationCustomParameters', {}) as IDataObject;
        const customParameters = buildKeyValueCollection(customParameterCollection);

        const body: IDataObject = {};

        if (normalizedDeviceIds.length) {
                body.device_ids = normalizedDeviceIds;
        }

        for (const [key, value] of Object.entries(customParameters)) {
                if (key === 'device_ids') {
                        continue;
                }

                body[key] = value as IDataObject[keyof IDataObject];
        }

        requestOptions.body = body;
        return requestOptions;
};

export const automationOperations: INodeProperties[] = [
        {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                        show: {
                                resource: ['automation'],
                        },
                },
                options: [
                        {
                                name: 'Trigger Webhook',
                                value: 'triggerWebhook',
                                action: 'Trigger a webhook automation',
                                description: 'Invoke a Level automation webhook by token',
                                routing: {
                                        request: {
                                                method: 'POST',
                                                url: '=/automations/webhooks/{{$parameter["token"]}}',
                                        },
                                        send: {
                                                preSend: [automationTriggerPreSend],
                                        },
                                },
                        },
                ],
                default: 'triggerWebhook',
        },
];

export const automationFields: INodeProperties[] = [
        {
                displayName: 'Webhook Token',
                name: 'token',
                type: 'string',
                required: true,
                default: '',
                typeOptions: {
                        password: true,
                },
                description: 'Webhook token to trigger',
                displayOptions: {
                        show: {
                                resource: ['automation'],
                                operation: ['triggerWebhook'],
                        },
                },
        },
        {
                displayName: 'JSON Parameters',
                name: 'jsonParameters',
                type: 'boolean',
                default: false,
                description: 'Whether to define the payload body as JSON or via UI parameters',
                displayOptions: {
                        show: {
                                resource: ['automation'],
                                operation: ['triggerWebhook'],
                        },
                },
        },
        {
                displayName: 'Payload (JSON)',
                name: 'jsonPayload',
                type: 'json',
                default: '{}',
                description: 'JSON payload to send in the webhook request',
                displayOptions: {
                        show: {
                                resource: ['automation'],
                                operation: ['triggerWebhook'],
                                jsonParameters: [true],
                        },
                },
        },
        {
                displayName: 'Device IDs',
                name: 'automationDeviceIds',
                type: 'string',
                typeOptions: {
                        multipleValues: true,
                },
                default: [],
                description: 'Trigger the automation for the specified devices while still applying trigger conditions',
                displayOptions: {
                        show: {
                                resource: ['automation'],
                                operation: ['triggerWebhook'],
                                jsonParameters: [false],
                        },
                },
        },
        {
                displayName: 'Custom Parameters',
                name: 'automationCustomParameters',
                type: 'fixedCollection',
                placeholder: 'Add Parameter',
                typeOptions: {
                        multipleValues: true,
                },
                default: {},
                description:
                        'Additional parameters can be mapped to variables if configured on the webhook trigger',
                displayOptions: {
                        show: {
                                resource: ['automation'],
                                operation: ['triggerWebhook'],
                                jsonParameters: [false],
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
