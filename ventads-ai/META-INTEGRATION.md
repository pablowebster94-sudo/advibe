# Meta Marketing API integration scaffold

This branch adds server-side API routes without modifying the existing creative generator.

## Environment
- `META_SYSTEM_USER_TOKEN`: server-only system user token with required ads permissions
- `META_GRAPH_API_VERSION`: optional, defaults to `v27.0`

## Routes
- `GET /api/meta-marketing/status`: checks token and returns profile/account summary
- `GET /api/meta-marketing/accounts`: returns available ad accounts
- `POST /api/meta-marketing/campaigns`: creates a campaign in **PAUSED** state only

The API endpoints are a backend scaffold, not yet wired into the UI or verified against a real Meta account. Ad-set/ad creation, creative upload, OAuth/account connection UI, publication flow, insights reporting, and live credential testing remain follow-up work. Never place Meta tokens in client code.
