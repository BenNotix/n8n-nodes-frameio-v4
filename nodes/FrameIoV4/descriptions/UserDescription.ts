import type { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Get Current User',
				value: 'getCurrentUser',
				description: 'Get the user associated with the credentials',
				action: 'Get the current user',
			},
		],
		default: 'getCurrentUser',
	},
];

export const userFields: INodeProperties[] = [];
