/* eslint-disable n8n-nodes-base/node-filename-against-convention */
/*
 * The filename-convention lint rules strip a trailing "V<digits>" from the file
 * basename (meant for versioned node files like GithubV2.node.ts). The "V4" in
 * FrameIoV4 is part of the product name (Frame.io V4 API) and matches
 * description.name "frameIoV4", so these reports are false positives.
 */
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';

import { accountFields, accountOperations } from './descriptions/AccountDescription';
import { commentFields, commentOperations } from './descriptions/CommentDescription';
import { fileFields, fileOperations } from './descriptions/FileDescription';
import { folderFields, folderOperations } from './descriptions/FolderDescription';
import { projectFields, projectOperations } from './descriptions/ProjectDescription';
import { shareFields, shareOperations } from './descriptions/ShareDescription';
import { userFields, userOperations } from './descriptions/UserDescription';
import {
	versionStackFields,
	versionStackOperations,
} from './descriptions/VersionStackDescription';
import { workspaceFields, workspaceOperations } from './descriptions/WorkspaceDescription';
import {
	frameIoApiListRequest,
	frameIoApiRequest,
	getAccounts,
	getProjects,
	getWorkspaces,
	uploadFileParts,
} from './GenericFunctions';

function buildCommentBody(target: IDataObject, fields: IDataObject): void {
	if (fields.annotation !== undefined && fields.annotation !== '') {
		target.annotation = fields.annotation;
	}
	if (fields.completed !== undefined) {
		target.completed = fields.completed;
	}
	if (fields.duration !== undefined && fields.duration !== '') {
		target.duration = fields.duration;
	}
	if (fields.page !== undefined && fields.page !== '') {
		target.page = fields.page;
	}
	if (fields.timestamp !== undefined && fields.timestamp !== '') {
		const timestamp = String(fields.timestamp);
		target.timestamp = /^\d+$/.test(timestamp) ? Number.parseInt(timestamp, 10) : timestamp;
	}
}

function splitIds(value: string): string[] {
	return value
		.split(',')
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
}

function includeToQs(qs: IDataObject, include: unknown): void {
	if (Array.isArray(include) && include.length > 0) {
		qs.include = include.join(',');
	}
}

async function waitForUploadCompletion(
	this: IExecuteFunctions,
	accountId: string,
	fileId: string,
	maxWaitTime: number,
	itemIndex: number,
): Promise<void> {
	const deadline = Date.now() + maxWaitTime * 1000;
	for (;;) {
		const response = await frameIoApiRequest.call(
			this,
			'GET',
			`/v4/accounts/${accountId}/files/${fileId}/status`,
		);
		const status = (response.data ?? {}) as IDataObject;
		if (status.upload_failed === true) {
			throw new NodeOperationError(this.getNode(), 'Frame.io reported the file upload as failed', {
				itemIndex,
			});
		}
		if (status.upload_complete === true) {
			return;
		}
		if (Date.now() >= deadline) {
			throw new NodeOperationError(
				this.getNode(),
				`The file upload did not complete within ${maxWaitTime} seconds`,
				{ itemIndex },
			);
		}
		await sleep(3000);
	}
}

export class FrameIoV4 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Frame.io V4',
		// eslint-disable-next-line @n8n/community-nodes/node-filename-against-convention
		name: 'frameIoV4',
		icon: { light: 'file:../../icons/frameio.svg', dark: 'file:../../icons/frameio.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Frame.io V4 API (Adobe)',
		defaults: {
			name: 'Frame.io V4',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Comment', value: 'comment' },
					{ name: 'File', value: 'file' },
					{ name: 'Folder', value: 'folder' },
					{ name: 'Project', value: 'project' },
					{ name: 'Share', value: 'share' },
					{ name: 'User', value: 'user' },
					{ name: 'Version Stack', value: 'versionStack' },
					{ name: 'Workspace', value: 'workspace' },
				],
				default: 'file',
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
				displayOptions: {
					hide: {
						resource: ['account', 'user'],
					},
				},
			},
			...accountOperations,
			...accountFields,
			...commentOperations,
			...commentFields,
			...fileOperations,
			...fileFields,
			...folderOperations,
			...folderFields,
			...projectOperations,
			...projectFields,
			...shareOperations,
			...shareFields,
			...userOperations,
			...userFields,
			...versionStackOperations,
			...versionStackFields,
			...workspaceOperations,
			...workspaceFields,
		],
	};

	methods = {
		loadOptions: {
			getAccounts,
			getWorkspaces,
			getProjects,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] | undefined;

				if (resource === 'account') {
					if (operation === 'getAll') {
						const options = this.getNodeParameter('options', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (options.sort) {
							qs.sort = options.sort;
						}
						responseData = await frameIoApiListRequest.call(this, i, '/v4/accounts', qs);
					}
				} else if (resource === 'user') {
					if (operation === 'getCurrentUser') {
						const response = await frameIoApiRequest.call(this, 'GET', '/v4/me');
						responseData = response.data as IDataObject;
					}
				} else {
					const accountId = this.getNodeParameter('accountId', i) as string;

					if (resource === 'workspace') {
						if (operation === 'create') {
							const name = this.getNodeParameter('name', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/workspaces`,
								{ data: { name } },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'delete') {
							const workspaceId = this.getNodeParameter('workspaceId', i) as string;
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/workspaces/${workspaceId}`,
							);
							responseData = { success: true };
						} else if (operation === 'get') {
							const workspaceId = this.getNodeParameter('workspaceId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.includeCreator === true) {
								qs.include = 'creator';
							}
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/workspaces/${workspaceId}`,
								undefined,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getAll') {
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.includeCreator === true) {
								qs.include = 'creator';
							}
							if (options.sort) {
								qs.sort = options.sort;
							}
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/workspaces`,
								qs,
							);
						} else if (operation === 'update') {
							const workspaceId = this.getNodeParameter('workspaceId', i) as string;
							const name = this.getNodeParameter('name', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/workspaces/${workspaceId}`,
								{ data: { name } },
							);
							responseData = response.data as IDataObject;
						}
					} else if (resource === 'project') {
						if (operation === 'create') {
							const workspaceId = this.getNodeParameter('workspaceId', i) as string;
							const name = this.getNodeParameter('name', i) as string;
							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
								{},
							) as IDataObject;
							const data: IDataObject = { name };
							if (additionalFields.restricted !== undefined) {
								data.restricted = additionalFields.restricted;
							}
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/workspaces/${workspaceId}/projects`,
								{ data },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'delete') {
							const projectId = this.getNodeParameter('projectId', i) as string;
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/projects/${projectId}`,
							);
							responseData = { success: true };
						} else if (operation === 'get') {
							const projectId = this.getNodeParameter('projectId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.includeOwner === true) {
								qs.include = 'owner';
							}
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/projects/${projectId}`,
								undefined,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getAll') {
							const workspaceId = this.getNodeParameter('workspaceId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.includeOwner === true) {
								qs.include = 'owner';
							}
							if (options.sort) {
								qs.sort = options.sort;
							}
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/workspaces/${workspaceId}/projects`,
								qs,
							);
						} else if (operation === 'update') {
							const projectId = this.getNodeParameter('projectId', i) as string;
							const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
							const data: IDataObject = {};
							if (updateFields.name) {
								data.name = updateFields.name;
							}
							if (updateFields.restricted !== undefined) {
								data.restricted = updateFields.restricted;
							}
							if (updateFields.status) {
								data.status = updateFields.status;
							}
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/projects/${projectId}`,
								{ data },
							);
							responseData = response.data as IDataObject;
						}
					} else if (resource === 'folder') {
						if (operation === 'create') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const name = this.getNodeParameter('name', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/folders/${folderId}/folders`,
								{ data: { name } },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'delete') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/folders/${folderId}`,
							);
							responseData = { success: true };
						} else if (operation === 'get') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/folders/${folderId}`,
								undefined,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getAll') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const types = this.getNodeParameter('types', i, []) as string[];
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (types.length > 0) {
								qs.type = types.join(',');
							}
							includeToQs(qs, options.include);
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/folders/${folderId}/children`,
								qs,
							);
						} else if (operation === 'update') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const name = this.getNodeParameter('name', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/folders/${folderId}`,
								{ data: { name } },
							);
							responseData = response.data as IDataObject;
						}
					} else if (resource === 'file') {
						if (operation === 'copy') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const targetFolderId = this.getNodeParameter('targetFolderId', i, '') as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.copyComments && options.copyComments !== 'none') {
								qs.copy_comments = options.copyComments;
							}
							if (options.copyMetadata === true) {
								qs.copy_metadata = true;
							}
							const body = targetFolderId ? { data: { parent_id: targetFolderId } } : undefined;
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/files/${fileId}/copy`,
								body,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'delete') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/files/${fileId}`,
							);
							responseData = { success: true };
						} else if (operation === 'download') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const rendition = this.getNodeParameter('rendition', i) as string;
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/files/${fileId}`,
								undefined,
								{ include: `media_links.${rendition}` },
							);
							const file = (response.data ?? {}) as IDataObject;
							const mediaLinks = (file.media_links ?? {}) as IDataObject;
							const link = (mediaLinks[rendition] ?? {}) as IDataObject;
							const downloadUrl = (link.download_url ?? link.url) as string | null | undefined;
							if (!downloadUrl) {
								throw new NodeOperationError(
									this.getNode(),
									`The "${rendition}" rendition is not available for this file (file status: ${
										(file.status as string) ?? 'unknown'
									}). Transcoded renditions require the file to be fully processed, and some renditions do not exist for every media type.`,
									{ itemIndex: i },
								);
							}
							const downloadResponse = await this.helpers.httpRequest({
								method: 'GET',
								url: downloadUrl,
								encoding: 'arraybuffer',
								returnFullResponse: true,
							});
							const responseHeaders = (downloadResponse.headers ?? {}) as IDataObject;
							const contentType =
								(responseHeaders['content-type'] as string) ??
								(file.media_type as string) ??
								undefined;
							let fileName = (file.name as string) ?? 'file';
							if (rendition !== 'original') {
								const dotIndex = fileName.lastIndexOf('.');
								const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
								fileName = `${baseName}_${rendition}`;
							}
							const binaryData = await this.helpers.prepareBinaryData(
								Buffer.from(downloadResponse.body as Buffer),
								fileName,
								contentType,
							);
							returnData.push({
								json: file,
								binary: { [binaryPropertyName]: binaryData },
								pairedItem: { item: i },
							});
							continue;
						} else if (operation === 'get') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/files/${fileId}`,
								undefined,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getAll') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							if (options.sort) {
								qs.sort = options.sort;
							}
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/folders/${folderId}/files`,
								qs,
							);
						} else if (operation === 'getUploadStatus') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/files/${fileId}/status`,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'move') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const targetFolderId = this.getNodeParameter('targetFolderId', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/files/${fileId}/move`,
								{ data: { parent_id: targetFolderId } },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'update') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const name = this.getNodeParameter('name', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/files/${fileId}`,
								{ data: { name } },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'upload') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const uploadFrom = this.getNodeParameter('uploadFrom', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;

							let file: IDataObject;
							if (uploadFrom === 'url') {
								const name = this.getNodeParameter('fileName', i) as string;
								const sourceUrl = this.getNodeParameter('sourceUrl', i) as string;
								const response = await frameIoApiRequest.call(
									this,
									'POST',
									`/v4/accounts/${accountId}/folders/${folderId}/files/remote_upload`,
									{ data: { name, source_url: sourceUrl } },
								);
								file = (response.data ?? {}) as IDataObject;
							} else {
								const binaryPropertyName = this.getNodeParameter(
									'binaryPropertyName',
									i,
								) as string;
								const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
								const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
								const name =
									(this.getNodeParameter('fileName', i, '') as string) ||
									binaryData.fileName ||
									'unnamed';
								const response = await frameIoApiRequest.call(
									this,
									'POST',
									`/v4/accounts/${accountId}/folders/${folderId}/files/local_upload`,
									{ data: { name, file_size: buffer.length } },
								);
								file = (response.data ?? {}) as IDataObject;
								const uploadUrls = (file.upload_urls ?? []) as Array<{
									size: number;
									url: string;
								}>;
								if (uploadUrls.length === 0) {
									throw new NodeOperationError(
										this.getNode(),
										'Frame.io did not return any upload URLs for the file',
										{ itemIndex: i },
									);
								}
								await uploadFileParts.call(
									this,
									uploadUrls,
									buffer,
									(file.media_type as string) ?? 'application/octet-stream',
								);
							}

							if (options.waitForUpload === true) {
								const maxWaitTime = (options.maxWaitTime as number) ?? 120;
								await waitForUploadCompletion.call(
									this,
									accountId,
									file.id as string,
									maxWaitTime,
									i,
								);
								const response = await frameIoApiRequest.call(
									this,
									'GET',
									`/v4/accounts/${accountId}/files/${file.id}`,
								);
								responseData = response.data as IDataObject;
							} else {
								responseData = file;
							}
						}
					} else if (resource === 'comment') {
						if (operation === 'create') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const text = this.getNodeParameter('text', i) as string;
							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
								{},
							) as IDataObject;
							const data: IDataObject = { text };
							buildCommentBody(data, additionalFields);
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/files/${fileId}/comments`,
								{ data },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'delete') {
							const commentId = this.getNodeParameter('commentId', i) as string;
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/comments/${commentId}`,
							);
							responseData = { success: true };
						} else if (operation === 'get') {
							const commentId = this.getNodeParameter('commentId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							if (options.timestampAsTimecode === true) {
								qs.timestamp_as_timecode = true;
							}
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/comments/${commentId}`,
								undefined,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getAll') {
							const fileId = this.getNodeParameter('fileId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							if (options.sort) {
								qs.sort = options.sort;
							}
							if (options.timestampAsTimecode === true) {
								qs.timestamp_as_timecode = true;
							}
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/files/${fileId}/comments`,
								qs,
							);
						} else if (operation === 'update') {
							const commentId = this.getNodeParameter('commentId', i) as string;
							const text = this.getNodeParameter('text', i) as string;
							const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
							const data: IDataObject = { text };
							buildCommentBody(data, updateFields);
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/comments/${commentId}`,
								{ data },
							);
							responseData = response.data as IDataObject;
						}
					} else if (resource === 'share') {
						if (operation === 'addAsset') {
							const shareId = this.getNodeParameter('shareId', i) as string;
							const assetId = this.getNodeParameter('assetId', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/shares/${shareId}/assets`,
								{ data: { asset_id: assetId } },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'create') {
							const projectId = this.getNodeParameter('projectId', i) as string;
							const name = this.getNodeParameter('name', i) as string;
							const access = this.getNodeParameter('access', i) as string;
							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
								{},
							) as IDataObject;
							const data: IDataObject = { type: 'asset', name, access };
							if (additionalFields.assetIds) {
								data.asset_ids = splitIds(additionalFields.assetIds as string);
							}
							if (additionalFields.description) {
								data.description = additionalFields.description;
							}
							if (additionalFields.downloadingEnabled !== undefined) {
								data.downloading_enabled = additionalFields.downloadingEnabled;
							}
							if (additionalFields.expiration) {
								data.expiration = additionalFields.expiration;
							}
							if (additionalFields.passphrase) {
								data.passphrase = additionalFields.passphrase;
							}
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/projects/${projectId}/shares`,
								{ data },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'delete') {
							const shareId = this.getNodeParameter('shareId', i) as string;
							await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/shares/${shareId}`,
							);
							responseData = { success: true };
						} else if (operation === 'get') {
							const shareId = this.getNodeParameter('shareId', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/shares/${shareId}`,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getAll') {
							const projectId = this.getNodeParameter('projectId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							if (options.sort) {
								qs.sort = options.sort;
							}
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/projects/${projectId}/shares`,
								qs,
							);
						} else if (operation === 'removeAsset') {
							const shareId = this.getNodeParameter('shareId', i) as string;
							const assetId = this.getNodeParameter('assetId', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'DELETE',
								`/v4/accounts/${accountId}/shares/${shareId}/assets/${assetId}`,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'update') {
							const shareId = this.getNodeParameter('shareId', i) as string;
							const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
							const data: IDataObject = {};
							if (updateFields.access) {
								data.access = updateFields.access;
							}
							if (updateFields.description) {
								data.description = updateFields.description;
							}
							if (updateFields.downloadingEnabled !== undefined) {
								data.downloading_enabled = updateFields.downloadingEnabled;
							}
							if (updateFields.expiration) {
								data.expiration = updateFields.expiration;
							}
							if (updateFields.name) {
								data.name = updateFields.name;
							}
							if (updateFields.passphrase) {
								data.passphrase = updateFields.passphrase;
							}
							// The API rejects an empty update (minProperties: 1)
							if (Object.keys(data).length === 0) {
								throw new NodeOperationError(
									this.getNode(),
									'Please add at least one field to update',
									{ itemIndex: i },
								);
							}
							const response = await frameIoApiRequest.call(
								this,
								'PATCH',
								`/v4/accounts/${accountId}/shares/${shareId}`,
								{ data },
							);
							responseData = response.data as IDataObject;
						}
					} else if (resource === 'versionStack') {
						if (operation === 'create') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const fileIds = this.getNodeParameter('fileIds', i) as string;
							const response = await frameIoApiRequest.call(
								this,
								'POST',
								`/v4/accounts/${accountId}/folders/${folderId}/version_stacks`,
								{ data: { file_ids: splitIds(fileIds) } },
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'get') {
							const versionStackId = this.getNodeParameter('versionStackId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							const response = await frameIoApiRequest.call(
								this,
								'GET',
								`/v4/accounts/${accountId}/version_stacks/${versionStackId}`,
								undefined,
								qs,
							);
							responseData = response.data as IDataObject;
						} else if (operation === 'getChildren') {
							const versionStackId = this.getNodeParameter('versionStackId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/version_stacks/${versionStackId}/children`,
								qs,
							);
						} else if (operation === 'getAll') {
							const folderId = this.getNodeParameter('folderId', i) as string;
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const qs: IDataObject = {};
							includeToQs(qs, options.include);
							responseData = await frameIoApiListRequest.call(
								this,
								i,
								`/v4/accounts/${accountId}/folders/${folderId}/version_stacks`,
								qs,
							);
						}
					}
				}

				if (responseData === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					const alreadyWrapped = error;
					throw alreadyWrapped;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
