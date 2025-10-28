
import { NodeOperationError, NodeConnectionTypes } from 'n8n-workflow';
import { levelApiRequest, levelApiRequestAllItems } from './GenericFunctions';
import { devicesProperties } from './properties/devicesProperties';
import { alertsProperties } from './properties/alertsProperties';
import { automationsProperties } from './properties/automationsProperties';

class Level {
    constructor() {
        this.description = {
            displayName: 'Level',
            name: 'level',
            icon: 'file:level.svg',
            group: ['input'],
            version: 1,
            description: 'Interact with the Level API',
            defaults: {
                name: 'Level',
            },
            inputs: [NodeConnectionTypes.Main],
            outputs: [NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'levelApi',
                    required: true,
                },
            ],
            subtitle: '={{ $parameter["resource"] + ": " + $parameter["operation"] }}',
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    default: 'alerts',
                    options: [
                        {
                            name: 'Alert',
                            value: 'alerts',
                            description: 'Interact with Level alerts',
                        },
                        {
                            name: 'Automation',
                            value: 'automations',
                            description: 'Trigger Level automations',
                        },
                        {
                            name: 'Device',
                            value: 'devices',
                            description: 'Work with Level devices',
                        },
                    ],
                },
                ...alertsProperties,
                ...devicesProperties,
                ...automationsProperties,
                {
                    displayName: 'Response Property Name',
                    name: 'responsePropertyName',
                    type: 'string',
                    default: '',
                    description: 'Optional property name to place the API response into on each item. Leave empty to output the response directly.',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Logic for execution remains the same...
    }
}

export { Level };
