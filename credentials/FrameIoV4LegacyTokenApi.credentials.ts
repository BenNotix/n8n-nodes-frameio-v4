import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class FrameIoV4LegacyTokenApi implements ICredentialType {
	name = 'frameIoV4LegacyTokenApi';

	displayName = 'Frame.io V4 Legacy Token API';

	documentationUrl =
		'https://github.com/picture-element/n8n-nodes-frameio-v4?tab=readme-ov-file#credentials';

	icon: Icon = { light: 'file:../icons/frameio.svg', dark: 'file:../icons/frameio.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Legacy developer tokens only work for V4-migrated Frame.io accounts that are not yet administered via the Adobe Admin Console. They are a transitional mechanism — prefer OAuth2 when possible.',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Developer Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Legacy developer token created at https://developer.frame.io/app/tokens',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
				'x-frameio-legacy-token-auth': 'true',
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
