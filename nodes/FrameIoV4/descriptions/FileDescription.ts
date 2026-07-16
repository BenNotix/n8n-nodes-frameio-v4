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

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Copy',
				value: 'copy',
				description: 'Copy a file to a folder',
				action: 'Copy a file',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a file',
				action: 'Delete a file',
			},
			{
				name: 'Download',
				value: 'download',
				description: 'Download the content of a file',
				action: 'Download a file',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a file',
				action: 'Get a file',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the files of a folder',
				action: 'Get many files',
			},
			{
				name: 'Get Upload Status',
				value: 'getUploadStatus',
				description: 'Get the upload status of a file',
				action: 'Get the upload status of a file',
			},
			{
				name: 'Move',
				value: 'move',
				description: 'Move a file to a folder or version stack',
				action: 'Move a file',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Rename a file',
				action: 'Update a file',
			},
			{
				name: 'Upload',
				value: 'upload',
				description: 'Upload a file from binary data or a URL',
				action: 'Upload a file',
			},
		],
		default: 'upload',
	},
];

export const fileFields: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the file',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['copy', 'delete', 'download', 'get', 'getUploadStatus', 'move', 'update'],
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
				resource: ['file'],
				operation: ['getAll', 'upload'],
			},
		},
	},
	// ----------------------------------------
	//              file: upload
	// ----------------------------------------
	{
		displayName: 'Upload From',
		name: 'uploadFrom',
		type: 'options',
		options: [
			{
				name: 'Binary Data',
				value: 'binaryData',
				description: 'Upload the file from binary data of the input item',
			},
			{
				name: 'URL',
				value: 'url',
				description: 'Let Frame.io download the file from a public URL (max 50 GB)',
			},
		],
		default: 'binaryData',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
			},
		},
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		hint: 'The name of the input binary field containing the file to be uploaded',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadFrom: ['binaryData'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		description:
			'Name of the file to create in Frame.io, including the extension. Leave empty to use the file name of the binary data.',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadFrom: ['binaryData'],
			},
		},
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		required: true,
		default: '',
		description:
			'Name of the file to create in Frame.io, including the extension (used to detect the media type)',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadFrom: ['url'],
			},
		},
	},
	{
		displayName: 'Source URL',
		name: 'sourceUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'Publicly accessible URL Frame.io will download the file from',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
				uploadFrom: ['url'],
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
				resource: ['file'],
				operation: ['upload'],
			},
		},
		options: [
			{
				displayName: 'Max Wait Time',
				name: 'maxWaitTime',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 120,
				description:
					'Maximum time in seconds to wait for the upload to complete (only used when waiting is enabled)',
			},
			{
				displayName: 'Wait for Upload',
				name: 'waitForUpload',
				type: 'boolean',
				default: false,
				description:
					'Whether to wait until Frame.io reports the upload as complete before continuing',
			},
		],
	},
	// ----------------------------------------
	//              file: download
	// ----------------------------------------
	{
		displayName: 'Rendition',
		name: 'rendition',
		type: 'options',
		options: [
			{
				name: 'Efficient',
				value: 'efficient',
				description: 'Compressed transcoded rendition optimized for size',
			},
			{
				name: 'High Quality',
				value: 'high_quality',
				description: 'High-quality transcoded rendition',
			},
			{
				name: 'Original',
				value: 'original',
				description: 'The originally uploaded file',
			},
			{
				name: 'Scrub Sheet',
				value: 'scrub_sheet',
				description: 'Scrub sheet image generated for video files',
			},
			{
				name: 'Thumbnail',
				value: 'thumbnail',
				description: 'Thumbnail image',
			},
			{
				name: 'Thumbnail High Quality',
				value: 'thumbnail_high_quality',
				description: 'High-quality thumbnail image',
			},
			{
				name: 'Video H264 180p',
				value: 'video_h264_180',
				description: 'Low-resolution H.264 video rendition',
			},
		],
		default: 'original',
		description:
			'Which rendition of the file to download. Transcoded renditions are only available once the file has been fully processed.',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['download'],
			},
		},
	},
	{
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		hint: 'The name of the output binary field to put the file in',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['download'],
			},
		},
	},
	// ----------------------------------------
	//              file: get
	// ----------------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['get'],
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
					'Related data to include in the response. Media links are pre-signed download/streaming URLs.',
			},
		],
	},
	// ----------------------------------------
	//              file: getAll
	// ----------------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['file'],
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
				resource: ['file'],
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
				resource: ['file'],
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
				description:
					'Related data to include in the response. Media links are pre-signed download/streaming URLs.',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Created At Ascending', value: 'created_at_asc' },
					{ name: 'Created At Descending', value: 'created_at_desc' },
					{ name: 'File Size Ascending', value: 'file_size_asc' },
					{ name: 'File Size Descending', value: 'file_size_desc' },
					{ name: 'Name Ascending', value: 'name_asc' },
					{ name: 'Name Descending', value: 'name_desc' },
					{ name: 'Updated At Ascending', value: 'updated_at_asc' },
					{ name: 'Updated At Descending', value: 'updated_at_desc' },
				],
				default: 'name_asc',
				description: 'Order in which to return the files',
			},
		],
	},
	// ----------------------------------------
	//              file: move
	// ----------------------------------------
	{
		displayName: 'Destination ID',
		name: 'targetFolderId',
		type: 'string',
		required: true,
		default: '',
		description:
			'ID of the destination folder or version stack. Moving a file into a version stack adds it as a new version.',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['move'],
			},
		},
	},
	// ----------------------------------------
	//              file: copy
	// ----------------------------------------
	{
		displayName: 'Destination Folder ID',
		name: 'targetFolderId',
		type: 'string',
		default: '',
		description:
			'ID of the folder to copy the file into. Leave empty to copy into the same folder.',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['copy'],
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
				resource: ['file'],
				operation: ['copy'],
			},
		},
		options: [
			{
				displayName: 'Copy Comments',
				name: 'copyComments',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Internal', value: 'internal' },
					{ name: 'None', value: 'none' },
					{ name: 'Public', value: 'public' },
				],
				default: 'none',
				description: 'Which comments to copy along with the file',
			},
			{
				displayName: 'Copy Metadata',
				name: 'copyMetadata',
				type: 'boolean',
				default: false,
				description: 'Whether to copy the metadata of the file',
			},
		],
	},
	// ----------------------------------------
	//              file: update
	// ----------------------------------------
	{
		displayName: 'New Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'New name of the file, including the extension',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['update'],
			},
		},
	},
];
