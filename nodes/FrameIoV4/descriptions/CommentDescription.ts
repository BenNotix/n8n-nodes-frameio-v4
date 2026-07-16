import type { INodeProperties } from 'n8n-workflow';

export const commentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['comment'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Add a comment to a file',
				action: 'Create a comment',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a comment',
				action: 'Delete a comment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a comment',
				action: 'Get a comment',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List the comments of a file',
				action: 'Get many comments',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a comment',
				action: 'Update a comment',
			},
		],
		default: 'create',
	},
];

export const commentFields: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the file',
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['create', 'getAll'],
			},
		},
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the comment',
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['delete', 'get', 'update'],
			},
		},
	},
	// ----------------------------------------
	//             comment: create
	// ----------------------------------------
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		required: true,
		default: '',
		description: 'Text of the comment',
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['create'],
			},
		},
	},
	// ----------------------------------------
	//             comment: update
	// ----------------------------------------
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		required: true,
		default: '',
		description:
			'New text of the comment. The Frame.io API requires the text on every update, even when only changing other fields.',
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['update'],
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
				resource: ['comment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Annotation',
				name: 'annotation',
				type: 'string',
				default: '',
				description:
					'Stringified JSON geometry describing an on-screen drawing. Allowed for document, image, video and stream files.',
			},
			{
				displayName: 'Completed',
				name: 'completed',
				type: 'boolean',
				default: false,
				description: 'Whether the comment is marked as completed',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Duration of the comment in frames. Requires a timestamp.',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Document page the comment is placed on. Only allowed for PDF files.',
			},
			{
				displayName: 'Timestamp',
				name: 'timestamp',
				type: 'string',
				default: '',
				description:
					'Frame the comment is placed on: an integer frame number (e.g. 120) or an HH:MM:SS:FF timecode (e.g. 00:00:05:00). Only allowed for audio, video and stream files.',
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
				resource: ['comment'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Annotation',
				name: 'annotation',
				type: 'string',
				default: '',
				description:
					'Stringified JSON geometry describing an on-screen drawing. Allowed for document, image, video and stream files.',
			},
			{
				displayName: 'Completed',
				name: 'completed',
				type: 'boolean',
				default: false,
				description: 'Whether the comment is marked as completed',
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Duration of the comment in frames. Requires a timestamp.',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Document page the comment is placed on. Only allowed for PDF files.',
			},
			{
				displayName: 'Timestamp',
				name: 'timestamp',
				type: 'string',
				default: '',
				description:
					'Frame the comment is placed on: an integer frame number (e.g. 120) or an HH:MM:SS:FF timecode (e.g. 00:00:05:00). Only allowed for audio, video and stream files.',
			},
		],
	},
	// ----------------------------------------
	//             comment: getAll
	// ----------------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['comment'],
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
				resource: ['comment'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	// ----------------------------------------
	//              comment: get
	// ----------------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Owner', value: 'owner' },
					{ name: 'Replies', value: 'replies' },
				],
				default: [],
				description: 'Related data to include in the response',
			},
			{
				displayName: 'Timestamp as Timecode',
				name: 'timestampAsTimecode',
				type: 'boolean',
				default: false,
				description:
					'Whether to return comment timestamps as HH:MM:SS:FF timecodes instead of frame numbers',
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
				resource: ['comment'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Owner', value: 'owner' },
					{ name: 'Replies', value: 'replies' },
				],
				default: [],
				description: 'Related data to include in the response',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Completed At Ascending', value: 'completed_at_asc' },
					{ name: 'Completed At Descending', value: 'completed_at_desc' },
					{ name: 'Created At Ascending', value: 'created_at_asc' },
					{ name: 'Created At Descending', value: 'created_at_desc' },
					{ name: 'Owner Ascending', value: 'owner_asc' },
					{ name: 'Owner Descending', value: 'owner_desc' },
				],
				default: 'created_at_asc',
				description:
					'Order in which to return the comments. Sorting by owner requires including the owner.',
			},
			{
				displayName: 'Timestamp as Timecode',
				name: 'timestampAsTimecode',
				type: 'boolean',
				default: false,
				description:
					'Whether to return comment timestamps as HH:MM:SS:FF timecodes instead of frame numbers',
			},
		],
	},
];
