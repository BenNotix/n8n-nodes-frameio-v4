import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const FRAME_IO_BASE_URL = 'https://api.frame.io';

export type FrameIoContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export function getCredentialTypeName(authentication: string): string {
	if (authentication === 'serverToServer') {
		return 'frameIoV4ServerToServerApi';
	}
	if (authentication === 'legacyToken') {
		return 'frameIoV4LegacyTokenApi';
	}
	return 'frameIoV4OAuth2Api';
}

/**
 * Make an authenticated request against the Frame.io V4 API.
 * The endpoint must include the /v4 prefix, e.g. `/v4/accounts`.
 */
export async function frameIoApiRequest(
	this: FrameIoContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	options: Partial<IHttpRequestOptions> = {},
): Promise<IDataObject> {
	const authentication = this.getNodeParameter('authentication', 0) as string;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${FRAME_IO_BASE_URL}${endpoint}`,
		json: true,
		...options,
	};

	if (body !== undefined && Object.keys(body).length > 0) {
		requestOptions.body = body;
	}
	if (qs !== undefined && Object.keys(qs).length > 0) {
		requestOptions.qs = qs;
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			getCredentialTypeName(authentication),
			requestOptions,
		);
		// DELETE endpoints return 204 with an empty body
		return (response ?? {}) as IDataObject;
	} catch (error) {
		if (error instanceof NodeApiError) {
			const alreadyWrapped = error;
			throw alreadyWrapped;
		}
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Fetch all items of a cursor-paginated Frame.io V4 list endpoint.
 * Follows the `after` cursor from `links.next` while preserving the
 * original query parameters (includes, filters, sort).
 */
export async function frameIoApiRequestAllItems(
	this: FrameIoContext,
	endpoint: string,
	qs: IDataObject = {},
	limit?: number,
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	const baseQuery: IDataObject = { ...qs };
	if (baseQuery.page_size === undefined) {
		// 100 is accepted by every V4 list endpoint (asset lists allow up to 500)
		baseQuery.page_size = 100;
	}

	let after: string | undefined;

	do {
		const query: IDataObject = { ...baseQuery };
		if (after !== undefined) {
			query.after = after;
		}

		const response = await frameIoApiRequest.call(this, 'GET', endpoint, undefined, query);
		const items = (response.data as IDataObject[]) ?? [];
		returnData.push(...items);

		after = undefined;
		const links = response.links as IDataObject | undefined;
		const next = links?.next as string | undefined | null;
		if (next && items.length > 0) {
			try {
				const nextUrl = new URL(next, FRAME_IO_BASE_URL);
				after = nextUrl.searchParams.get('after') ?? undefined;
			} catch {
				after = undefined;
			}
		}

		if (limit !== undefined && returnData.length >= limit) {
			return returnData.slice(0, limit);
		}
	} while (after !== undefined);

	return returnData;
}

/**
 * Run a list operation honoring the standard returnAll/limit parameters.
 */
export async function frameIoApiListRequest(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	if (returnAll) {
		return await frameIoApiRequestAllItems.call(this, endpoint, qs);
	}
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	return await frameIoApiRequestAllItems.call(this, endpoint, qs, limit);
}

/**
 * Upload a file's bytes to the presigned part URLs returned by the
 * local-upload endpoint. Each part must be PUT with the file's media type
 * and `x-amz-acl: private` (both are part of the presigned signature).
 */
export async function uploadFileParts(
	this: IExecuteFunctions,
	uploadUrls: Array<{ size: number; url: string }>,
	buffer: Buffer,
	mediaType: string,
): Promise<void> {
	let offset = 0;
	for (const part of uploadUrls) {
		const chunk = buffer.subarray(offset, offset + part.size);
		offset += part.size;
		try {
			await this.helpers.httpRequest({
				method: 'PUT',
				url: part.url,
				body: chunk,
				headers: {
					'Content-Type': mediaType,
					'x-amz-acl': 'private',
				},
			});
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject, {
				message: 'Uploading a file part to Frame.io storage failed',
			});
		}
	}
}

function toSortedOptions(entries: Array<{ name: string; value: string }>): INodePropertyOptions[] {
	return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const accounts = await frameIoApiRequestAllItems.call(this, '/v4/accounts');
	return toSortedOptions(
		accounts.map((account) => ({
			name: (account.display_name as string) ?? (account.id as string),
			value: account.id as string,
		})),
	);
}

export async function getWorkspaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const accountId = this.getNodeParameter('accountId', '') as string;
	if (!accountId) {
		return [];
	}
	const workspaces = await frameIoApiRequestAllItems.call(
		this,
		`/v4/accounts/${accountId}/workspaces`,
	);
	return toSortedOptions(
		workspaces.map((workspace) => ({
			name: (workspace.name as string) ?? (workspace.id as string),
			value: workspace.id as string,
		})),
	);
}

export async function getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const accountId = this.getNodeParameter('accountId', '') as string;
	const workspaceId = this.getNodeParameter('workspaceId', '') as string;
	if (!accountId || !workspaceId) {
		return [];
	}
	const projects = await frameIoApiRequestAllItems.call(
		this,
		`/v4/accounts/${accountId}/workspaces/${workspaceId}/projects`,
	);
	return toSortedOptions(
		projects.map((project) => ({
			name: (project.name as string) ?? (project.id as string),
			value: project.id as string,
		})),
	);
}
