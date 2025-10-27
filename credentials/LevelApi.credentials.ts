import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class LevelApi implements ICredentialType {
        name = 'levelApi';

        displayName = 'Level API';

        icon = 'file:level.svg';

        documentationUrl = 'https://levelapi.readme.io/reference/getting-started-with-your-api';

        authenticate = {
                type: 'generic',
                properties: {
                        headers: {
                                Authorization: '={{ `Bearer ${$credentials.apiKey}` }}',
                        },
                },
        };

        test = {
                request: {
                        method: 'GET',
                        baseURL: '={{ $credentials.baseUrl }}',
                        url: '/alerts',
                },
        };

        properties: INodeProperties[] = [
                {
                        displayName: 'API Key',
                        name: 'apiKey',
                        type: 'string',
                        typeOptions: {
                                password: true,
                        },
                        default: '',
                        required: true,
                        description: 'API key generated from the Level dashboard',
                },
                {
                        displayName: 'Webhook Secret',
                        name: 'webhookSecret',
                        type: 'string',
                        typeOptions: {
                                password: true,
                        },
                        default: '',
                        description: 'Shared secret to verify Level webhook signatures',
                },
                {
                        displayName: 'Base URL',
                        name: 'baseUrl',
                        type: 'string',
                        default: 'https://api.level.io/v1',
                        description: 'Override the default Level API base URL if necessary',
                },
        ];
}
