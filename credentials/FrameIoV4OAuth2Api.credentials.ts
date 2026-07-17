import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class FrameIoV4OAuth2Api implements ICredentialType {
	name = 'frameIoV4OAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Frame.io V4 OAuth2 API';

	documentationUrl =
		'https://github.com/BenNotix/n8n-nodes-frameio-v4?tab=readme-ov-file#credentials';

	icon: Icon = { light: 'file:../icons/frameio.svg', dark: 'file:../icons/frameio.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://ims-na1.adobelogin.com/ims/authorize/v2',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://ims-na1.adobelogin.com/ims/token/v3',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'openid email profile offline_access additional_info.roles',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];
}
