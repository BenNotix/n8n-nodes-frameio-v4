# n8n-nodes-frameio-v4

[![npm version](https://img.shields.io/npm/v/n8n-nodes-frameio-v4.svg)](https://www.npmjs.com/package/n8n-nodes-frameio-v4)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-frameio-v4.svg)](https://www.npmjs.com/package/n8n-nodes-frameio-v4)
[![License: MIT](https://img.shields.io/npm/l/n8n-nodes-frameio-v4.svg)](LICENSE.md)

This is an n8n community node package for the **[Frame.io](https://frame.io) V4 API** (Adobe). It lets you automate Frame.io — the cloud-based video review and collaboration platform — natively from your [n8n](https://n8n.io) workflows, similar to the official Frame.io V4 apps for Zapier and Make.

It ships two nodes:

- **Frame.io V4** — actions on accounts, workspaces, projects, folders, files (including uploads and downloads), comments, shares and version stacks
- **Frame.io V4 Trigger** — starts workflows on any of the 30 Frame.io V4 webhook events, with HMAC signature verification

> ⚠️ This package targets the **V4 API** (`api.frame.io/v4`) used by Frame.io V4 accounts signed in with an Adobe ID. It does not work with legacy Frame.io (V2/V3 API) accounts.

[Installation](#installation) · [Credentials](#credentials) · [Nodes & operations](#nodes--operations) · [Usage examples](#usage-examples) · [Limitations](#known-limitations) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

**Self-hosted n8n:** go to **Settings > Community Nodes > Install**, enter `n8n-nodes-frameio-v4` and confirm.

**Requirements:** n8n version 1.0 or above. To use the action node as a tool for AI Agents on self-hosted n8n, set the environment variable `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`.

## Credentials

The nodes support three authentication methods. **OAuth2** is the right choice for most users.

### 1. OAuth2 (recommended)

Frame.io V4 authenticates through Adobe IMS. You need a (free) integration in the Adobe Developer Console:

1. Go to the [Adobe Developer Console](https://developer.adobe.com/console) and sign in with the Adobe ID linked to your Frame.io V4 account.
2. Create a new **Project**.
3. **Add API** → select the **Frame.io API**.
4. Choose the **OAuth Web App** credential type.
5. Set the **Default Redirect URI** and **Redirect URI pattern** to your n8n OAuth callback URL, shown in the n8n credential dialog (e.g. `https://<your-n8n-host>/rest/oauth2-credential/callback`). Adobe requires HTTPS.
6. Copy the **Client ID** and **Client Secret** into a new **Frame.io V4 OAuth2 API** credential in n8n, then click **Connect my account**.

Notes:

- The default scopes (`openid email profile offline_access additional_info.roles`) are pre-configured; `offline_access` is required so n8n can refresh tokens automatically.
- Adobe refresh tokens expire after ~14 days of inactivity; n8n refreshes them on use, so regularly running workflows stay connected.

### 2. Server-to-Server (Enterprise)

For Frame.io V4 accounts **administered via the Adobe Admin Console** (Enterprise), you can use Adobe IMS client credentials — no user login, tokens are fetched automatically:

1. In the [Adobe Admin Console](https://adminconsole.adobe.com), make sure your user has a Developer role and the **Frame.io S2S API** product assigned.
2. In the Adobe Developer Console, create a **new** project → Add API → Frame.io API → **Server-to-Server Authentication**. (S2S cannot be added to an existing project — create a fresh one.)
3. Copy the Client ID and Client Secret into a **Frame.io V4 Server-to-Server API** credential in n8n.

The connection acts as a "Service Account User" in Frame.io.

### 3. Legacy Developer Token (transitional)

V4-migrated accounts that are **not yet** administered via the Adobe Admin Console can use a legacy developer token from [developer.frame.io/app/tokens](https://developer.frame.io/app/tokens). Create a **Frame.io V4 Legacy Token API** credential with the token. This is a transitional mechanism — prefer OAuth2.

> 💡 All three credentials can also be used with n8n's generic **HTTP Request** node (predefined credential type) to call any Frame.io V4 endpoint this package doesn't cover.

## Nodes & operations

### Frame.io V4 (actions)

| Resource | Operations |
|---|---|
| Account | Get Many |
| Comment | Create, Delete, Get, Get Many, Update |
| File | Copy, Delete, Download, Get, Get Many, Get Upload Status, Move, Update, Upload |
| Folder | Create, Delete, Get, Get Many (list contents), Update |
| Project | Create, Delete, Get, Get Many, Update |
| Share | Add Asset, Create, Delete, Get, Get Many, Remove Asset, Update |
| User | Get Current User |
| Version Stack | Create, Get, Get Children, Get Many |
| Workspace | Create, Delete, Get, Get Many, Update |

Highlights:

- **File > Upload** supports both **binary data** from a previous node (multi-part upload to Frame.io storage) and **from URL** (Frame.io downloads it server-side, max 50 GB). An option lets you wait until the upload is fully processed.
- **File > Download** outputs binary data and lets you pick the rendition: original, high quality, efficient, thumbnails, H.264 180p or scrub sheet.
- **File > Move** into a version stack adds the file as a new version.
- **Comment > Create/Update** support timestamps as frame numbers or `HH:MM:SS:FF` timecodes, annotations, durations and PDF pages.
- Account, workspace and project pickers are searchable dropdowns (with expression support for dynamic IDs).
- The folder hierarchy starts at a project's `root_folder_id`, returned by **Project > Get**.

### Frame.io V4 Trigger

Registers a webhook on the selected **workspace** and fires on the events you choose — all 30 V4 events are available, including:

`file.created`, `file.ready`, `file.upload.completed`, `file.versioned`, `comment.created`, `comment.completed`, `project.created`, `share.viewed`, `metadata.value.updated`, …

Options:

- **Resolve Data** (default on): Frame.io webhook payloads only contain IDs; the trigger automatically fetches the full resource (file, comment, project, …) and adds it as `resource_data`.
- **Verify Signature** (default on): validates the `X-Frameio-Signature` HMAC-SHA256 header and rejects deliveries older than 5 minutes.

## Usage examples

**Post to Slack when a video is ready for review**

1. *Frame.io V4 Trigger* — event `file.ready`, Resolve Data on
2. *Slack* — post `{{$json.resource_data.name}}` and `{{$json.resource_data.view_url}}`

**Upload render outputs and share them**

1. *(any node producing binary data, e.g. HTTP Request / FTP)*
2. *Frame.io V4* — File > Upload (Binary Data, Wait for Upload on)
3. *Frame.io V4* — Share > Create with `asset_ids` = `{{$json.id}}`

**Log every new comment to a Google Sheet**

1. *Frame.io V4 Trigger* — event `comment.created`
2. *Google Sheets* — append `{{$json.resource_data.text}}`, `{{$json.resource_data.timestamp}}`

## Known limitations

- **Comment replies cannot be created** — the V4 API doesn't expose reply creation yet (replies are readable via the *Include > Replies* option on Comment > Get/Get Many).
- Shares only support the V4 `asset` type with `public`/`secure` access (V2-style review links/presentations don't exist in V4).
- Some write endpoints are rate-limited by Frame.io to 10 calls/min per user — large loops may hit HTTP 429.
- Webhook events fire for **all projects of the selected workspace**; filter by `project.id` in your workflow if needed.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Frame.io V4 developer documentation](https://next.developer.frame.io/)
- [Frame.io V4 API reference](https://next.developer.frame.io/platform/api-reference)
- [Adobe Developer Console](https://developer.adobe.com/console)

## License

[MIT](LICENSE.md)
