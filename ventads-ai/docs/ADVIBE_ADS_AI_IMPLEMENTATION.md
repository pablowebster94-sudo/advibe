# AdVibe Ads AI — implementation plan

Private, single-operator advertising workspace for AdVibe Agencia. This is a SaleADS-inspired workflow, not a public SaaS and not a furniture-specific tool.

## Product promise

The operator supplies a business/product brief once. The system recommends a campaign strategy, generates ad creatives and copy, builds a Meta campaign draft, presents a complete preview, and publishes only after explicit approval. It then imports delivery/performance metrics and proposes optimizations.

## Reference workflow

Based on SaleADS public product/help documentation:
1. Connect advertising platforms and select the business/assets.
2. Configure brand/business profile and audience.
3. Create a strategy from the business goal and brief.
4. Generate creatives and ad copy.
5. Review/edit the campaign preview.
6. Launch to Meta.
7. Monitor performance and optimize.

References:
- https://saleads.ai/es
- https://help.saleads.ai/es
- https://help.saleads.ai/es/docs/estrategias/que-es-estrategia
- https://help.saleads.ai/es/docs/estrategias/configurar-estrategia
- https://help.saleads.ai/es/docs/primeros-pasos/navegacion-dashboard

## UX: one simple workflow

A single "Nueva campaña" flow:
- **Negocio:** choose an existing client/brand or create one.
- **Oferta:** explain in plain language what is being sold, price (optional), benefits, offer, destination (WhatsApp / website / instant form), and any restrictions.
- **Goal:** sales/messages/leads/traffic/awareness; AI may recommend a goal but the operator confirms.
- **Market:** country/city/radius, language, audience notes, placements.
- **Budget & duration:** daily/lifetime budget, currency, schedule.
- **Assets:** upload real product/service photos and video; preserve originals.
- **Strategy:** AI returns one recommended strategy plus alternatives, campaign structure, audience rationale, number of ads, and missing information.
- **Creatives & copy:** produce variants. Exact text/prices/logos are composed deterministically; AI must not invent offer facts.
- **Preview:** show campaign, ad set and each ad; allow edits.
- **Publish:** explicit approval and confirmation before any Meta write that creates/activates ads.

Avoid exposing Meta's technical complexity in the normal flow. Advanced settings are collapsible.

## Architecture boundaries

- Keep all changes inside `ventads-ai/`.
- Reuse the existing Product/Brand/Campaign/Concept/Creative models and creative renderer where possible.
- Keep provider keys server-side only.
- Preserve uploaded source assets unchanged.
- Add a Meta integration service abstraction; route handlers must not call Graph API directly.
- Meta publishing must default to PAUSED. A separate explicit approval action may activate it.
- Never automatically increase budgets, broaden targeting, or activate ads without explicit configured limits and user consent.
- Record Meta IDs, sync state, errors, timestamps, and an audit trail for every external mutation.
- Use least-privilege OAuth/token storage; do not store long-lived secrets in browser state or logs.

## Phased delivery

### Phase 0 — inspect and stabilize (required before feature work)
- Confirm current production deployment and health endpoint.
- Inspect existing campaign orchestration, auth, schema, migrations, storage and UI.
- Confirm the current branch and working tree; preserve existing work.

### Phase 1 — SaleADS-style campaign draft workflow
- Business/client profile and Meta asset connection status.
- Plain-language campaign brief.
- AI strategy recommendation with missing-info checks.
- Generate multiple ad copies and creatives through existing engines.
- Campaign preview/edit/approval state.
- Persist campaign brief, strategy, selected assets, copy and publication status.
- No live publishing until OAuth, Meta app permissions and account assets are configured and verified.

### Phase 2 — Meta publishing
- OAuth connection and asset picker (ad account, Page, Instagram account, WhatsApp destination).
- Create campaign, ad set, creative and ad through Meta Marketing API.
- Publish as PAUSED by default; explicit "Publish and activate" requires confirmation.
- Idempotency, retries, API version pinning and actionable error messages.
- Test against a dedicated test ad account before client accounts.

### Phase 3 — reporting and optimization
- Pull campaign/ad insights.
- Show spend, impressions, reach, CPM, CTR, CPC, leads/messages/conversions and CPA where available.
- AI recommendations grounded in actual metrics.
- Human-approved changes; no autonomous budget increases by default.

## Meta prerequisites / blockers

A working Meta integration requires:
- Meta developer app and Marketing API product.
- Business login/OAuth configuration and redirect URI.
- Appropriate permissions (commonly `ads_management`, `ads_read`, and business/page permissions depending on the assets and flow).
- App mode/access review where required for assets/users beyond app roles.
- A user-authorized token and an ad account with permission to advertise.
- Page/Instagram/WhatsApp assets selected and validated for the chosen destination.

No Meta token, app secret, or customer credential should be pasted into chat or committed. Configure secrets in Vercel environment variables.

## Acceptance criteria

- A single user can create a campaign brief for any industry without sector-specific code.
- AI proposes strategy and clearly marks assumptions/missing facts.
- Generated copy never invents prices, guarantees, stock, discounts, locations or claims.
- Original uploads remain immutable.
- Operator can edit and approve all copy/creative/configuration before publication.
- No ad is activated without explicit confirmation.
- Every Meta API mutation is auditable and safely retryable.
- If Meta is not configured, draft/creative generation still works and the UI explains exactly what connection is missing.
