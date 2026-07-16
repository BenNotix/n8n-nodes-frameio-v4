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

export const versionStackOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['versionStack'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a version stack from existing files',
				action: 'Create a version stack',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a version stack',
				action: 'Get a version stack',
			},
			{
				name: 'Get Children',
				value: 'getChildren',
				description: 'List the version files of a version stack',
				action: 'Get the children of a version stack',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the version stacks of a folder',
				action: 'Get many version stacks',
			},
		],
		default: 'create',
	},
];

export const versionStackFields: INodeProperties[] = [
	{
		displayName: 'Folder ID',
		name: 'folderId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the folder containing the files',
		displayOptions: {
			show: {
				resource: ['versionStack'],
				operation: ['create', 'getAll'],
			},
		},
	},
	{
		displayName: 'Version Stack ID',
		name: 'versionStackId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the version stack',
		displayOptions: {
			show: {
				resource: ['versionStack'],
				operation: ['get', 'getChildren'],
			},
		},
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		default: '',
		description:
			'Comma-separated list of 2 to 10 file IDs, ordered from oldest to newest version. All files must be in the given folder.',
		displayOptions: {
			show: {
				resource: ['versionStack'],
				operation: ['create'],
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
				resource: ['versionStack'],
				operation: ['getAll', 'getChildren'],
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
				resource: ['versionStack'],
				operation: ['getAll', 'getChildren'],
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
				resource: ['versionStack'],
				operation: ['get', 'getAll', 'getChildren'],
			},
		},
		options: [
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: includeOptions,
				default: [],
				description:
					'Related data to include in the response. Media links apply to the head version file.',
			},
		],
	},
];
