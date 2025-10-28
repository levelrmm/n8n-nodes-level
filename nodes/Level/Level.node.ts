import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { levelApiRequest, levelApiRequestAllItems } from './GenericFunctions';

import { alertsFields, alertsOperations } from './descriptions/Alerts.description';
import { automationsFields, automationsOperations } from './descriptions/Automations.description';
import { devicesFields, devicesOperations } from './descriptions/Devices.description';
import { groupsFields, groupsOperations } from './descriptions/Groups.description';

export class Level implements INodeType {
	description: INodeTypeDescription = {
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
		usableAsTool: true,
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
					{
						name: 'Group',
						value: 'groups',
						description: 'Retrieve Level groups',
					},
				],
			},
			...alertsOperations,
			...alertsFields,
			...automationsOperations,
			...automationsFields,
			...devicesOperations,
			...devicesFields,
			...groupsOperations,
			...groupsFields,
			{
				displayName: 'Response Property Name',
				name: 'responsePropertyName',
				type: 'string',
				default: '',
				description:
					'Optional property name to place the API response into on each item. Leave empty to output the response directly.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const normalizeResponse = (response: unknown): unknown[] => {
			if (Array.isArray(response)) {
				return response;
			}

			if (typeof response === 'object' && response !== null) {
				const dataProperty = (response as IDataObject).data;
				if (Array.isArray(dataProperty)) {
					return dataProperty;
				}
				if (dataProperty !== undefined) {
					return [dataProperty];
				}
			}

			if (response === undefined || response === null) {
				return [];
			}

			return [response];
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				let response: unknown;

				// -------- Alerts --------
				if (resource === 'alerts') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const qs: IDataObject = {};
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', itemIndex) as number;
							qs.per_page = limit;
						}
						// Pagination & cursor params
						const pageNum = this.getNodeParameter('page', itemIndex, 0) as number;
						if (pageNum) { qs.page = pageNum; }
						const startingAfter = this.getNodeParameter('starting_after', itemIndex, '') as string;
						if (startingAfter) { qs.starting_after = startingAfter; }
						const endingBefore = this.getNodeParameter('ending_before', itemIndex, '') as string;
						if (endingBefore) { qs.ending_before = endingBefore; }

						// Additional arbitrary query string parameters
						const additionalQuery = this.getNodeParameter('additionalQuery', itemIndex, {}) as IDataObject;
						if (additionalQuery && (additionalQuery as IDataObject).parameters) {
							const params = (additionalQuery as IDataObject).parameters as IDataObject[];
							for (const p of params) {
								const key = (p.key as string) || '';
								if (key !== undefined && key !== '') {
									qs[key] = p.value as string;
								}
							}
						}


						if (returnAll) {
							response = await levelApiRequestAllItems.call(
								this,
								'alerts',
								'GET',
								'/alerts',
								{},
								qs,
							);
						} else {
							response = await levelApiRequest.call(this, 'GET', '/alerts', {}, qs);
							if (
								typeof response === 'object' &&
								response !== null &&
								Array.isArray((response as IDataObject).alerts)
							) {
								response = (response as IDataObject).alerts;
							}
						}
					} else if (operation === 'get') {
						const qs: IDataObject = {};
						const additionalQuery = this.getNodeParameter('additionalQuery', itemIndex, {}) as IDataObject;
						if (additionalQuery && (additionalQuery as IDataObject).parameters) {
							const params = (additionalQuery as IDataObject).parameters as IDataObject[];
							for (const p of params) {
								const key = (p.key as string) || '';
								if (key !== undefined && key !== '') {
									qs[key] = p.value as string;
								}
							}
						}

						const alertId = this.getNodeParameter('id', itemIndex) as string;
						response = await levelApiRequest.call(this, 'GET', `/alerts/${alertId}`, {}, qs);
						if (
							typeof response === 'object' &&
							response !== null &&
							(response as IDataObject).alert !== undefined
						) {
							response = (response as IDataObject).alert;
						}
					} else {
						throw new NodeOperationError(this.getNode(), `Unsupported alerts operation: ${operation}`, {
							itemIndex,
						});
					}

				// -------- Devices --------
				} else if (resource === 'devices') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const qs: IDataObject = {};
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', itemIndex) as number;
							qs.per_page = limit;
						}
						// Pagination & cursor params
						const pageNum = this.getNodeParameter('page', itemIndex, 0) as number;
						if (pageNum) { qs.page = pageNum; }
						const startingAfter = this.getNodeParameter('starting_after', itemIndex, '') as string;
						if (startingAfter) { qs.starting_after = startingAfter; }
						const endingBefore = this.getNodeParameter('ending_before', itemIndex, '') as string;
						if (endingBefore) { qs.ending_before = endingBefore; }

						// Additional arbitrary query string parameters
						const additionalQuery = this.getNodeParameter('additionalQuery', itemIndex, {}) as IDataObject;
						if (additionalQuery && (additionalQuery as IDataObject).parameters) {
							const params = (additionalQuery as IDataObject).parameters as IDataObject[];
							for (const p of params) {
								const key = (p.key as string) || '';
								if (key !== undefined && key !== '') {
									qs[key] = p.value as string;
								}
							}
						}


						if (returnAll) {
							response = await levelApiRequestAllItems.call(
								this,
								'devices',
								'GET',
								'/devices',
								{},
								qs,
							);
						} else {
							response = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
							if (
								typeof response === 'object' &&
								response !== null &&
								Array.isArray((response as IDataObject).devices)
							) {
								response = (response as IDataObject).devices;
							}
						}
					} else if (operation === 'get') {
						const qs: IDataObject = {};
						const additionalQuery = this.getNodeParameter('additionalQuery', itemIndex, {}) as IDataObject;
						if (additionalQuery && (additionalQuery as IDataObject).parameters) {
							const params = (additionalQuery as IDataObject).parameters as IDataObject[];
							for (const p of params) {
								const key = (p.key as string) || '';
								if (key !== undefined && key !== '') {
									qs[key] = p.value as string;
								}
							}
						}

						const deviceId = this.getNodeParameter('id', itemIndex) as string;
						response = await levelApiRequest.call(this, 'GET', `/devices/${deviceId}`, {}, qs);
						if (
							typeof response === 'object' &&
							response !== null &&
							(response as IDataObject).device !== undefined
						) {
							response = (response as IDataObject).device;
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported devices operation: ${operation}`,
							{ itemIndex },
						);
					}

				// -------- Groups --------
				} else if (resource === 'groups') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const qs: IDataObject = {};
						if (!returnAll) {
							const limit = this.getNodeParameter('limit', itemIndex) as number;
							qs.per_page = limit;
						}
						// Pagination & cursor params
						const pageNum = this.getNodeParameter('page', itemIndex, 0) as number;
						if (pageNum) { qs.page = pageNum; }
						const startingAfter = this.getNodeParameter('starting_after', itemIndex, '') as string;
						if (startingAfter) { qs.starting_after = startingAfter; }
						const endingBefore = this.getNodeParameter('ending_before', itemIndex, '') as string;
						if (endingBefore) { qs.ending_before = endingBefore; }

						// Group hierarchy filter
						const parentId = this.getNodeParameter('parent_id', itemIndex, '') as string;
						if (parentId) { qs.parent_id = parentId; }

						// Additional arbitrary query string parameters
						const additionalQuery = this.getNodeParameter('additionalQuery', itemIndex, {}) as IDataObject;
						if (additionalQuery && (additionalQuery as IDataObject).parameters) {
							const params = (additionalQuery as IDataObject).parameters as IDataObject[];
							for (const p of params) {
								const key = (p.key as string) || '';
								if (key !== undefined && key !== '') {
									qs[key] = p.value as string;
								}
							}
						}


						if (returnAll) {
							response = await levelApiRequestAllItems.call(
								this,
								'groups',
								'GET',
								'/groups',
								{},
								qs,
							);
						} else {
							response = await levelApiRequest.call(this, 'GET', '/groups', {}, qs);
							if (
								typeof response === 'object' &&
								response !== null &&
								Array.isArray((response as IDataObject).groups)
							) {
								response = (response as IDataObject).groups;
							}
						}
					} else if (operation === 'get') {
						const qs: IDataObject = {};
						const additionalQuery = this.getNodeParameter('additionalQuery', itemIndex, {}) as IDataObject;
						if (additionalQuery && (additionalQuery as IDataObject).parameters) {
							const params = (additionalQuery as IDataObject).parameters as IDataObject[];
							for (const p of params) {
								const key = (p.key as string) || '';
								if (key !== undefined && key !== '') {
									qs[key] = p.value as string;
								}
							}
						}

						const groupId = this.getNodeParameter('id', itemIndex) as string;
						response = await levelApiRequest.call(this, 'GET', `/groups/${groupId}`, {}, qs);
						if (
							typeof response === 'object' &&
							response !== null &&
							(response as IDataObject).group !== undefined
						) {
							response = (response as IDataObject).group;
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported groups operation: ${operation}`,
							{ itemIndex },
						);
					}

				// -------- Automations --------
				} else if (resource === 'automations') {
					if (operation === 'triggerWebhook') {
						const token = this.getNodeParameter('token', itemIndex) as string;
						const jsonParameters = this.getNodeParameter('jsonParameters', itemIndex) as boolean;

						let body: IDataObject = {};

						if (jsonParameters) {
							const payload = this.getNodeParameter('jsonPayload', itemIndex, '{}') as
								| IDataObject
								| string;

							if (typeof payload === 'string') {
								const trimmedPayload = payload.trim();
								if (trimmedPayload !== '') {
									try {
										const parsedPayload = JSON.parse(trimmedPayload);
										if (typeof parsedPayload !== 'object' || parsedPayload === null) {
											throw new NodeOperationError(
												this.getNode(),
												'JSON payload must be an object',
												{ itemIndex },
											);
										}
										body = parsedPayload as IDataObject;
									} catch (error) {
										if (error instanceof NodeOperationError) {
											throw error;
										}
										throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
									}
								}
							} else if (typeof payload === 'object' && payload !== null) {
								body = payload as IDataObject;
							}
						} else {
							const payloadCollection = this.getNodeParameter('payloadUi', itemIndex, {}) as IDataObject;
							const properties = (payloadCollection.property as IDataObject[]) ?? [];
							for (const property of properties) {
								const key = (property.key as string | undefined) ?? '';
								if (!key) continue;
								body[key] = (property.value as string | undefined) ?? '';
							}
						}

						response = await levelApiRequest.call(
							this,
							'POST',
							`/automations/webhooks/${token}`,
							body,
						);

						if (response === undefined || response === '') {
							response = { success: true };
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported automations operation: ${operation}`,
							{ itemIndex },
						);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`, {
						itemIndex,
					});
				}

				const responsePropertyName = this.getNodeParameter(
					'responsePropertyName',
					itemIndex,
					'',
				) as string;

				const processedResponses = normalizeResponse(response);

				if (processedResponses.length === 0) {
					returnData.push(
						responsePropertyName ? ({ [responsePropertyName]: response } as IDataObject) : { success: true },
					);
					continue;
				}

				for (const entry of processedResponses) {
					if (responsePropertyName) {
						returnData.push({ [responsePropertyName]: entry } as IDataObject);
						continue;
					}

					if (typeof entry === 'object' && entry !== null) {
						returnData.push(entry as IDataObject);
					} else {
						returnData.push({ value: entry } as IDataObject);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						error: (error as Error).message,
						itemIndex,
					});
					continue;
				}

				if ((error as { context?: Record<string, unknown> }).context) {
					(error as { context: Record<string, unknown> }).context.itemIndex = itemIndex;
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex,
				});
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
