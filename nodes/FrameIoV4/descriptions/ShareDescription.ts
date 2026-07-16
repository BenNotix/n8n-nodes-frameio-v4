import type { INodeProperties } from 'n8n-workflow';

export const shareOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['share'],
			},
		},
		options: [
			{
				name: 'Add Asset',
				value: 'addAsset',
				description: 'Add a file, folder or version stack to a share',
				action: 'Add an asset to a share',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a share in a project',
				action: 'Create a share',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a share',
				action: 'Delete a share',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a share',
				action: 'Get a share',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the shares of a project',
				action: 'Get many shares',
			},
			{
				name: 'Remove Asset',
				value: 'removeAsset',
				description: 'Remove an asset from a share',
				action: 'Remove an asset from a share',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a share',
				action: 'Update a share',
			},
		],
		default: 'create',
	},
];

export const shareFields: INodeProperties[] = [
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
				resource: ['share'],
				operation: ['create', 'getAll'],
			},
		},
	},
	{
		displayName: 'Project Name or ID',
		name: 'projectId',
		type: 'options',
		typeOptions: {
			loadOptionsDependsOn: ['accountId', 'workspaceId'],
			loadOptionsMethod: 'getProjects',
		},
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['create', 'getAll'],
			},
		},
	},
	{
		displayName: 'Share ID',
		name: 'shareId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the share',
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['addAsset', 'delete', 'get', 'removeAsset', 'update'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the share',
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Access',
		name: 'access',
		type: 'options',
		options: [
			{
				name: 'Public',
				value: 'public',
				description: 'Anyone with the link can view',
			},
			{
				name: 'Secure',
				value: 'secure',
				description: 'Only invited reviewers can view',
			},
		],
		default: 'public',
		description: 'Access level of the share',
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the file, folder or version stack',
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['addAsset', 'removeAsset'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Asset IDs',
				name: 'assetIds',
				type: 'string',
				default: '',
				description:
					'Comma-separated list of file, folder or version stack IDs to add to the share',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the share. Requires the custom branded shares feature.',
			},
			{
				displayName: 'Downloading Enabled',
				name: 'downloadingEnabled',
				type: 'boolean',
				default: false,
				description: 'Whether viewers can download the shared assets',
			},
			{
				displayName: 'Expiration',
				name: 'expiration',
				type: 'dateTime',
				default: '',
				description: 'Date and time at which the share expires',
			},
			{
				displayName: 'Passphrase',
				name: 'passphrase',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description:
					'Passphrase protecting the share. Only used when access is Secure-like; if a passphrase is required and not given, Frame.io generates one.',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['share'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Access',
				name: 'access',
				type: 'options',
				options: [
					{ name: 'Public', value: 'public' },
					{ name: 'Secure', value: 'secure' },
				],
				default: 'public',
				description: 'Access level of the share',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the share. Requires the custom branded shares feature.',
			},
			{
				displayName: 'Downloading Enabled',
				name: 'downloadingEnabled',
				type: 'boolean',
				default: false,
				description: 'Whether viewers can download the shared assets',
			},
			{
				displayName: 'Expiration',
				name: 'expiration',
				type: 'dateTime',
				default: '',
				description: 'Date and time at which the share expires',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name of the share',
			},
			{
				displayName: 'Passphrase',
				name: 'passphrase',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description:
					'Passphrase protecting the share. Only used when access is Secure-like; if a passphrase is required and not given, Frame.io generates one.',
			},
		],
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['share'],
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
				resource: ['share'],
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
				resource: ['share'],
				operation: ['getAll'],
			},
		},
		options: [
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
				description: 'Order in which to return the shares',
			},
		],
	},
];
