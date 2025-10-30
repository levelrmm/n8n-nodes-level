/* eslint-disable @n8n/community-nodes/credential-test-required, n8n-nodes-base/cred-class-name-unsuffixed, n8n-nodes-base/cred-class-field-name-unsuffixed, n8n-nodes-base/cred-class-field-display-name-missing-api */
import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class LevelWebhookSecret implements ICredentialType {
        name = 'levelWebhookSecret';
        displayName = 'Level Webhook Secret';
        documentationUrl = 'https://levelapi.readme.io/reference/about-webhooks';
        icon: Icon = {
                light: 'file:../nodes/Level/level.svg',
                dark: 'file:../nodes/Level/level.dark.svg',
        };
        testedBy = 'levelTrigger';

        properties: INodeProperties[] = [
                {
                        displayName: 'Webhook Secret',
                        name: 'webhookSecret',
                        type: 'string',
                        typeOptions: { password: true },
                        default: '',
                },
        ];
}
