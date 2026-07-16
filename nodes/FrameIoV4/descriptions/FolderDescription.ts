import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const includeOptions: INodePropertyOptions[] = [
	{ name: 'Creator', value: 'creator' },
	{ name: 'Media Links: Efficient', value: 'media_links.efficient' },
	{ name: 'Media Links: High Quality', value: 'media_links.high_quality' },
	{ name: 'Media Links: Original', value: 'media_links.original' },
	{ name: 'Media Links: Scrub Sheet', value: 'media_links.scrub_sheet' },
	{ name: 'Media Links: Thumbnail', value: 'media_links.thumbnail' },
	{ name: 'Media Links: Thumbnail High Quality', value: 'media_links.thumbnail_high_quality' },
	{ name: 'Media Links: Video H264 180p', value: 'media_links.video_h264_180' },
	{ name: 'Metadata', value: 'metadata' },
	{ name: 'Project', value: 'project' },
];

export const folderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['folder'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a folder inside another folder',
				action: 'Create a folder',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a folder',
				action: 'Delete a folder',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a folder',
				action: 'Get a folder',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the contents (files, folders and version stacks) of a folder',
				action: 'Get many folder items',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Rename a folder',
				action: 'Update a folder',
			},
		],
		default: 'create',
	},
];

export const folderFields: INodeProperties[] = [
	{
		displayName: 'Parent Folder ID',
		name: 'folderId',
		type: 'string',
		required: true,
		default: '',
		description:
			'ID of the folder to create the new folder in. The root folder ID of a project is available as root_folder_id on Project > Get.',
		displayOptions: {
			show: {
				resource: ['folder'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Folder ID',
		name: 'folderId',
		type: 'string',
		required: true,
		default: '',
		description:
			'ID of the folder. The root folder ID of a project is available as root_folder_id on Project > Get.',
		displayOptions: {
			show: {
				resource: ['folder'],
				operation: ['delete', 'get', 'getAll', 'update'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the folder to create',
		displayOptions: {
			show: {
				resource: ['folder'],
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
		description: 'New name of the folder',
		displayOptions: {
			show: {
				resource: ['folder'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Types',
		name: 'types',
		type: 'multiOptions',
		options: [
			{ name: 'File', value: 'file' },
			{ name: 'Folder', value: 'folder' },
			{ name: 'Version Stack', value: 'version_stack' },
		],
		default: [],
		description: 'Only return items of these types',
		displayOptions: {
			show: {
				resource: ['folder'],
				operation: ['getAll'],
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
				resource: ['folder'],
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
				resource: ['folder'],
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
				resource: ['folder'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Creator', value: 'creator' },
					{ name: 'Metadata', value: 'metadata' },
					{ name: 'Project', value: 'project' },
				],
				default: [],
				description: 'Related data to include in the response',
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
				resource: ['folder'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: includeOptions,
				default: [],
				description: 'Related data to include in the response. Media links only apply to files.',
			},
		],
	},
];
