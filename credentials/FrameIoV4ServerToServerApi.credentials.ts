import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class FrameIoV4ServerToServerApi implements ICredentialType {
	name = 'frameIoV4ServerToServerApi';

	displayName = 'Frame.io V4 Server-to-Server API';

	documentationUrl =
		'https://github.com/picture-element/n8n-nodes-frameio-v4?tab=readme-ov-file#credentials';

	icon: Icon = { light: 'file:../icons/frameio.svg', dark: 'file:../icons/frameio.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Server-to-Server authentication is only available for Frame.io V4 accounts administered via the Adobe Admin Console (Enterprise). Create a Server-to-Server credential in the Adobe Developer Console with the Frame.io API added to the project.',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'openid,AdobeID,frame.s2s.all',
			description: 'Comma-separated list of Adobe IMS scopes requested for the access token',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const body = new URLSearchParams({
			client_id: credentials.clientId as string,
			client_secret: credentials.clientSecret as string,
			grant_type: 'client_credentials',
			scope: (credentials.scope as string) || 'openid,AdobeID,frame.s2s.all',
		});
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://ims-na1.adobelogin.com/ims/token/v3',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		})) as { access_token: string };
		return { sessionToken: response.access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.frame.io',
			url: '/v4/me',
		},
	};
}
