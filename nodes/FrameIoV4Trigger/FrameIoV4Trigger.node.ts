import { createHmac, timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	frameIoApiRequest,
	frameIoApiRequestAllItems,
	getAccounts,
	getWorkspaces,
} from '../FrameIoV4/GenericFunctions';

// Maps webhook payload resource types to the API path segment used to fetch them
const RESOURCE_ENDPOINTS: Record<string, string> = {
	collection: 'collections',
	comment: 'comments',
	file: 'files',
	folder: 'folders',
	project: 'projects',
	share: 'shares',
	version_stack: 'version_stacks',
	workspace: 'workspaces',
};

function isSignatureValid(secret: string, timestamp: string, rawBody: string, signature: string): boolean {
	// Reject deliveries older than 5 minutes to prevent replay attacks
	const age = Math.abs(Date.now() / 1000 - Number(timestamp));
	if (!Number.isFinite(age) || age > 300) {
		return false;
	}
	const expected =
		'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex');
	const expectedBuffer = Buffer.from(expected);
	const signatureBuffer = Buffer.from(signature);
	if (expectedBuffer.length !== signatureBuffer.length) {
		return false;
	}
	return timingSafeEqual(expectedBuffer, signatureBuffer);
}

// Trigger nodes cannot be used as AI tools and `usableAsTool` only accepts `true`,
// so the property is intentionally absent here.
// eslint-disable-next-line @n8n/community-nodes/node-usable-as-tool
export class FrameIoV4Trigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Frame.io V4 Trigger',
		name: 'frameIoV4Trigger',
		icon: { light: 'file:../../icons/frameio.svg', dark: 'file:../../icons/frameio.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Frame.io V4 events occur',
		defaults: {
			name: 'Frame.io V4 Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'frameIoV4OAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
			{
				name: 'frameIoV4ServerToServerApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['serverToServer'],
					},
				},
			},
			{
				name: 'frameIoV4LegacyTokenApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['legacyToken'],
					},
				},
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'Legacy Developer Token',
						value: 'legacyToken',
						description:
							'Transitional option for V4-migrated accounts not yet administered via the Adobe Admin Console',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
						description: 'OAuth2 user authentication via Adobe IMS (recommended)',
					},
					{
						name: 'Server-to-Server',
						value: 'serverToServer',
						description:
							'Adobe IMS client credentials — only for accounts administered via the Adobe Admin Console',
					},
				],
				default: 'oAuth2',
			},
			{
				displayName: 'Account Name or ID',
				name: 'accountId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAccounts',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Workspace Name or ID',
				name: 'workspaceId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['accountId'],
					loadOptionsMethod: 'getWorkspaces',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description:
					'The Frame.io events to listen to. Events fire for all projects of the selected workspace.',
				options: [
					{ name: 'Collection Created', value: 'collection.created' },
					{ name: 'Collection Deleted', value: 'collection.deleted' },
					{ name: 'Collection Updated', value: 'collection.updated' },
					{ name: 'Comment Completed', value: 'comment.completed' },
					{ name: 'Comment Created', value: 'comment.created' },
					{ name: 'Comment Deleted', value: 'comment.deleted' },
					{ name: 'Comment Uncompleted', value: 'comment.uncompleted' },
					{ name: 'Comment Updated', value: 'comment.updated' },
					{ name: 'Custom Field Created', value: 'customfield.created' },
					{ name: 'Custom Field Deleted', value: 'customfield.deleted' },
					{ name: 'Custom Field Updated', value: 'customfield.updated' },
					{ name: 'File Copied', value: 'file.copied' },
					{
						name: 'File Created',
						value: 'file.created',
						description: 'Fires when a file is first created, before it is uploaded and processed',
					},
					{ name: 'File Deleted', value: 'file.deleted' },
					{
						name: 'File Ready',
						value: 'file.ready',
						description: 'Fires when an uploaded file has been fully processed (all transcodes done)',
					},
					{ name: 'File Updated', value: 'file.updated' },
					{
						name: 'File Upload Completed',
						value: 'file.upload.completed',
						description: 'Fires when a file has been fully uploaded and is ready for processing',
					},
					{ name: 'File Versioned', value: 'file.versioned' },
					{ name: 'Folder Copied', value: 'folder.copied' },
					{ name: 'Folder Created', value: 'folder.created' },
					{ name: 'Folder Deleted', value: 'folder.deleted' },
					{ name: 'Folder Updated', value: 'folder.updated' },
					{ name: 'Metadata Value Updated', value: 'metadata.value.updated' },
					{ name: 'Project Created', value: 'project.created' },
					{ name: 'Project Deleted', value: 'project.deleted' },
					{ name: 'Project Updated', value: 'project.updated' },
					{ name: 'Share Created', value: 'share.created' },
					{ name: 'Share Deleted', value: 'share.deleted' },
					{ name: 'Share Updated', value: 'share.updated' },
					{ name: 'Share Viewed', value: 'share.viewed' },
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Resolve Data',
						name: 'resolveData',
						type: 'boolean',
						default: true,
						description:
							'Whether to fetch the full resource that triggered the event. The webhook payload itself only contains IDs.',
					},
					{
						displayName: 'Verify Signature',
						name: 'verifySignature',
						type: 'boolean',
						default: true,
						description:
							'Whether to verify the HMAC signature of incoming webhook deliveries before running the workflow',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			getAccounts,
			getWorkspaces,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const accountId = this.getNodeParameter('accountId') as string;
				const workspaceId = this.getNodeParameter('workspaceId') as string;

				if (webhookData.webhookId !== undefined) {
					try {
						const response = await frameIoApiRequest.call(
							this,
							'GET',
							`/v4/accounts/${accountId}/webhooks/${webhookData.webhookId}`,
						);
						const webhook = (response.data ?? {}) as IDataObject;
						if (webhook.url === webhookUrl) {
							return true;
						}
						// The n8n webhook URL changed (e.g. domain migration) — remove the
						// stale registration so create() registers the current URL.
						await frameIoApiRequest.call(
							this,
							'DELETE',
							`/v4/accounts/${accountId}/webhooks/${webhookData.webhookId}`,
						);
					} catch {
						// Webhook is gone on the Frame.io side — re-register below
					}
					delete webhookData.webhookId;
					delete webhookData.secret;
				}

				// Look for a stale webhook pointing at this n8n URL. Its signing
				// secret is unrecoverable (only returned at creation), so remove
				// it and let create() register a fresh one.
				try {
					const webhooks = await frameIoApiRequestAllItems.call(
						this,
						`/v4/accounts/${accountId}/workspaces/${workspaceId}/webhooks`,
					);
					for (const webhook of webhooks) {
						if (webhook.url === webhookUrl) {
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/webhooks/${webhook.id}`,
							);
						}
					}
				} catch {
					// Listing may fail on restricted permissions — create() will surface real errors
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const accountId = this.getNodeParameter('accountId') as string;
				const workspaceId = this.getNodeParameter('workspaceId') as string;
				const events = this.getNodeParameter('events') as string[];

				if (webhookUrl.includes('//localhost')) {
					throw new NodeOperationError(
						this.getNode(),
						'The webhook cannot work on "localhost". Please set up n8n on a custom domain or start with "--tunnel"!',
					);
				}
				if (events.length === 0) {
					throw new NodeOperationError(this.getNode(), 'Please select at least one event');
				}

				const response = await frameIoApiRequest.call(
					this,
					'POST',
					`/v4/accounts/${accountId}/workspaces/${workspaceId}/webhooks`,
					{
						data: {
							name: `n8n Trigger (${this.getWorkflow().id ?? 'workflow'})`,
							url: webhookUrl,
							events,
						},
					},
				);

				const webhook = (response.data ?? {}) as IDataObject;
				if (webhook.id === undefined || webhook.secret === undefined) {
					throw new NodeApiError(this.getNode(), response as JsonObject, {
						message:
							'Frame.io webhook creation response did not contain an ID and a signing secret',
					});
				}

				webhookData.webhookId = webhook.id as string;
				webhookData.secret = webhook.secret as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const accountId = this.getNodeParameter('accountId') as string;

				if (webhookData.webhookId !== undefined) {
					try {
						await frameIoApiRequest.call(
							this,
							'DELETE',
							`/v4/accounts/${accountId}/webhooks/${webhookData.webhookId}`,
						);
					} catch {
						return false;
					}
					delete webhookData.webhookId;
					delete webhookData.secret;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const webhookData = this.getWorkflowStaticData('node');
		const options = this.getNodeParameter('options', {}) as IDataObject;
		const headers = this.getHeaderData() as IDataObject;
		const bodyData = this.getBodyData() as IDataObject;
		const req = this.getRequestObject() as unknown as { rawBody?: Buffer };

		if (options.verifySignature !== false) {
			const secret = webhookData.secret as string | undefined;
			const timestamp = headers['x-frameio-request-timestamp'] as string | undefined;
			const signature = headers['x-frameio-signature'] as string | undefined;
			// Frame.io signs the raw request body. n8n exposes it as req.rawBody;
			// the JSON.stringify fallback is best-effort canonicalization (Frame.io
			// sends minified JSON) for deployments where rawBody is unavailable.
			const rawBody =
				req.rawBody !== undefined ? req.rawBody.toString() : JSON.stringify(bodyData);

			// Fail closed: a missing secret (e.g. partially lost static data) must
			// not silently disable verification.
			if (
				secret === undefined ||
				timestamp === undefined ||
				signature === undefined ||
				!isSignatureValid(secret, timestamp, rawBody, signature)
			) {
				const res = this.getResponseObject();
				res.status(401).send('Unauthorized').end();
				return { noWebhookResponse: true };
			}
		}

		let returnItem: IDataObject = bodyData;

		if (options.resolveData !== false) {
			const resourceInfo = bodyData.resource as IDataObject | undefined;
			const accountRef = (bodyData.account as IDataObject | undefined)?.id as string | undefined;
			const endpoint = RESOURCE_ENDPOINTS[(resourceInfo?.type as string) ?? ''];
			if (resourceInfo?.id !== undefined && accountRef !== undefined && endpoint !== undefined) {
				try {
					const response = await frameIoApiRequest.call(
						this,
						'GET',
						`/v4/accounts/${accountRef}/${endpoint}/${resourceInfo.id}`,
					);
					returnItem = { ...bodyData, resource_data: response.data as IDataObject };
				} catch {
					// The resource may already be deleted (e.g. *.deleted events) — emit the skinny payload
				}
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray([returnItem])],
		};
	}
}
