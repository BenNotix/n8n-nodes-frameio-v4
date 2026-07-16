import type { INodeProperties } from 'n8n-workflow';

export const workspaceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a workspace in an account',
				action: 'Create a workspace',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a workspace',
				action: 'Delete a workspace',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a workspace',
				action: 'Get a workspace',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the workspaces of an account',
				action: 'Get many workspaces',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Rename a workspace',
				action: 'Update a workspace',
			},
		],
		default: 'create',
	},
];

export const workspaceFields: INodeProperties[] = [
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
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['delete', 'get', 'update'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the workspace to create',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'New Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'New name of the workspace',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'Include Creator',
				name: 'includeCreator',
				type: 'boolean',
				default: false,
				description: 'Whether to include the creator of the workspace in the response',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Include Creator',
				name: 'includeCreator',
				type: 'boolean',
				default: false,
				description: 'Whether to include the creator of the workspace in the response',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Created At Ascending', value: 'created_at_asc' },
					{ name: 'Created At Descending', value: 'created_at_desc' },
					{ name: 'Name Ascending', value: 'name_asc' },
					{ name: 'Name Descending', value: 'name_desc' },
				],
				default: 'name_asc',
				description: 'Order in which to return the workspaces',
			},
		],
	},
];
