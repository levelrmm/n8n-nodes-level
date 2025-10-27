import { createHmac } from 'crypto';

import type {
        IDataObject,
        INodeType,
        INodeTypeDescription,
        IWebhookFunctions,
        IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const EVENT_TYPES = [
        'alert_active',
        'alert_resolved',
        'device_created',
        'device_updated',
        'device_deleted',
        'group_created',
        'group_updated',
        'group_deleted',
] as const;

function timingSafeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) {
                return false;
        }

        let result = 0;

        for (let index = 0; index < a.length; index++) {
                result |= a.charCodeAt(index) ^ b.charCodeAt(index);
        }

        return result === 0;
}

export class LevelTrigger implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'Level Trigger',
                name: 'levelTrigger',
                icon: 'file:level.svg',
                group: ['trigger'],
                version: 1,
                description:
                        'Handle incoming webhooks from Level to react to alerts, devices, groups, and automation events. Configure the webhook URL in Level under Settings → Webhooks and reuse the same secret in the Level API credential for signature verification.',
                defaults: {
                        name: 'Level Trigger',
                },
                inputs: [],
                outputs: ['main'],
                usableAsTool: true,
                credentials: [
                        {
                                name: 'levelApi',
                                required: true,
                        },
                ],
                webhooks: [
                        {
                                name: 'default',
                                path: 'webhook',
                                httpMethod: 'POST',
                                responseMode: 'onReceived',
                                responseData: '={{ { "received": true } }}',
                        },
                ],
                properties: [
                        {
                                displayName: 'Event Types',
                                name: 'eventTypes',
                                type: 'multiOptions',
                                default: [...EVENT_TYPES],
                                options: EVENT_TYPES.map((event) => ({
                                        name: event
                                                .split('_')
                                                .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                                                .join(' '),
                                        value: event,
                                })),
                                description:
                                        'Select specific Level event types to emit. Clear the selection to receive all events.',
                        },
                        {
                                displayName: 'Output Raw Body',
                                name: 'rawBody',
                                type: 'boolean',
                                default: false,
                                description: 'Whether to emit the raw JSON payload instead of the parsed event object.',
                        },
                ],
        };

        async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
                const req = this.getRequestObject();
                const res = this.getResponseObject();
                const bodyData = this.getBodyData();
                const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(bodyData ?? {});
                const signatureHeader = req.headers['x-level-signature'];

                const credentials = await this.getCredentials('levelApi');
                const webhookSecret = (credentials.webhookSecret as string | undefined) || undefined;

                if (webhookSecret) {
                        if (typeof signatureHeader !== 'string' || !signatureHeader.startsWith('sha256=')) {
                                res.status(401).json({ message: 'Missing or invalid Level signature header.' });
                                return {
                                        noWebhookResponse: true,
                                };
                        }

                        const expectedSignature = `sha256=${createHmac('sha256', webhookSecret)
                                .update(rawBody)
                                .digest('hex')}`;

                        if (!timingSafeCompare(expectedSignature, signatureHeader)) {
                                res.status(401).json({ message: 'Invalid Level webhook signature.' });
                                return {
                                        noWebhookResponse: true,
                                };
                        }
                }

                let event: IDataObject;

                try {
                        event =
                                typeof bodyData === 'object' && bodyData !== null
                                        ? (bodyData as IDataObject)
                                        : (JSON.parse(rawBody) as IDataObject);
                } catch (error) {
                        throw new NodeOperationError(this.getNode(), error as Error);
                }

                const eventType = (event.event_type as string | undefined) ?? '';
                const selectedEventTypes = this.getNodeParameter('eventTypes', 0) as string[];

                if (
                        selectedEventTypes.length > 0 &&
                        eventType &&
                        !selectedEventTypes.includes(eventType)
                ) {
                        res.status(200).json({ received: true });
                        return {
                                noWebhookResponse: true,
                        };
                }

                const rawBodyRequested = this.getNodeParameter('rawBody', 0) as boolean;

                return {
                        workflowData: [
                                [
                                        {
                                                json: rawBodyRequested
                                                        ? ({ rawBody } as IDataObject)
                                                        : event,
                                        },
                                ],
                        ],
                };
        }
}
