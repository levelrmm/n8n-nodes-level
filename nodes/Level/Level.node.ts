import type { ILoadOptionsFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import {
        alertFields,
        alertOperations,
} from './descriptions/Alerts.description';
import {
        automationFields,
        automationOperations,
} from './descriptions/Automation.description';
import {
        deviceFields,
        deviceOperations,
} from './descriptions/Devices.description';
import {
        groupFields,
        groupOperations,
} from './descriptions/Groups.description';
import { searchDevicesByHostname } from './helpers';

export class Level implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'Level',
                name: 'level',
                icon: 'file:level.svg',
                group: ['input'],
                version: 1,
                description: 'Interact with the Level API',
                defaults: { name: 'Level' },
                inputs: [NodeConnectionTypes.Main],
                outputs: [NodeConnectionTypes.Main],
                usableAsTool: true,
                requestDefaults: {
                        baseURL: '={{$credentials.baseUrl || "https://api.level.io/v2"}}',
                        headers: {
                                Accept: 'application/json',
                        },
                        json: true,
                },
                credentials: [{ name: 'levelApi', required: true }],
                properties: [
                        {
                                displayName: 'Resource',
                                name: 'resource',
                                type: 'options',
                                noDataExpression: true,
                                options: [
                                        { name: 'Alert', value: 'alerts' },
                                        { name: 'Automation', value: 'automation' },
                                        { name: 'Device', value: 'devices' },
                                        { name: 'Group', value: 'groups' },
                                ],
                                default: 'devices',
                        },
                        // Alerts
                        ...alertOperations,
                        ...alertFields,
                        // Automations
                        ...automationOperations,
                        ...automationFields,
                        // Devices
                        ...deviceOperations,
                        ...deviceFields,
                        // Groups
                        ...groupOperations,
                        ...groupFields,
                        {
                                displayName: 'Response Property Name',
                                name: 'responsePropertyName',
                                type: 'string',
                                default: '',
                                placeholder: 'Leave empty to return the whole response',
                                description:
                                        'If the API response wraps the array in a property (e.g. <code>devices</code>), set that property name. If left empty, the node attempts to auto-detect and returns the raw response if needed.',
                        },
                ],
        };

        methods = {
                listSearch: {
                        async searchDevicesByHostname(
                                this: ILoadOptionsFunctions,
                                filter?: string,
                                paginationToken?: string,
                        ) {
                                return searchDevicesByHostname.call(this, filter, paginationToken);
                        },
                },
        };
}
