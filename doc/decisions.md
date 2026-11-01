# Architecture Decision Records

Status values: Proposed, Accepted, Superseded. Superseded records stay for
history; the replacement is linked and is the source of truth.

## ADR-001: Next.js App Router instead of Vite

**Status:** Accepted (supersedes the earlier Vite decision)
**Date:** 2026-10-20

**Context:** The product became a public, authenticated, multi-tenant app with
a landing page, admin area and server-side authorization. The earlier plan
assumed a local-only Vite control panel.

**Decision:** Use Next.js (App Router) with Server Components, Server Actions
and Route Handlers.

**Consequences:** SSR/SEO for the landing page and one deployable unit; more
framework surface to learn; local mode still runs with `next dev` next to
`opencode serve`.

## ADR-002: Plain JavaScript with JSDoc

**Status:** Accepted
**Date:** 2026-10-20

**Context:** The user requested JavaScript, not TypeScript. UI libraries and
starters are TypeScript-first.

**Decision:** All app code is `.js`/`.jsx`; JSDoc supplies editor hints where
useful; Zod validates every boundary (forms, route handlers, provider
payloads). shadcn runs with `"tsx": false`.

**Consequences:** Lower entry barrier; no compile-time types; stricter review
and tests are required around data shapes.

## ADR-003: Neon stores only identity and access data

**Status:** Superseded by ADR-011
**Date:** 2026-10-20

**Context:** Media is large, private and expensive to store; the product must
stay viable on free tiers. An earlier requirement limited the database to login
information and kept images/videos on the client.

**Decision (historical):** Neon held Better Auth tables plus organizations,
members and invitations. No prompts, generation history or provider keys were
stored server-side.

**Superseded because:** The requirement changed. The database may store all
structured product data (chats, prompts, agents, skills, contexts, generation
metadata). Only media bytes stay out. See ADR-011.

## ADR-004: Self-hosted Better Auth

**Status:** Accepted
**Date:** 2026-10-20

**Context:** Need email/password, organizations, roles, invitations and platform
admin. Options: Better Auth self-hosted, Neon Managed Better Auth, Clerk,
Auth0, custom.

**Decision:** Use Better Auth with the Drizzle adapter, `organization` and
`admin` plugins.

**Consequences:** One schema, no per-MAU fee, full control over roles and
flows; we own migrations, email delivery and security updates. Managed Neon
Auth remains a future option if operational load grows.

## ADR-005: Shared schema tenancy, client data namespaced

**Status:** Superseded by ADR-014
**Date:** 2026-10-20

**Context:** Multi-tenant access must be simple and cheap; the original scope
had almost no tenant-owned business data.

**Decision (historical):** Shared schema with `organization_id` on access rows
and local data namespaced by `userId/orgId` in IndexedDB and OPFS. RLS was
deemed unnecessary for the small auth surface.

**Superseded because:** Chats, agents, skills, contexts and generations are now
tenant-owned database rows. RLS and a strict tenant-scoping helper are required.
See ADR-014.

## ADR-006: Media bytes in OPFS, metadata in Neon

**Status:** Accepted (revised 2026-10-20)
**Date:** 2026-10-20

**Context:** Videos can be hundreds of megabytes. The requirement is to keep
image, audio and video bytes on the client while making all other data
available across devices.

**Decision:** Store media bytes only in OPFS. Store asset metadata (id, owner,
tenant, kind, mime, size, dimensions, duration, provider, model, `storage_key`,
checksum, status) in Neon. IndexedDB holds caches, drafts and the outbox, never
durable media blobs.

**Consequences:** Zero media storage cost and reduced breach impact; browser
quota and eviction remain real risks; media does not follow the user across
devices, so the UI must show device availability and offer download or
regeneration. A PWA/service worker is optional.

## ADR-007: Tailwind CSS v4 + shadcn/ui in JSX

**Status:** Accepted
**Date:** 2026-10-20

**Context:** Need a modern, accessible, developer-oriented design system
quickly, without a locked component library.

**Decision:** Tailwind v4 with CSS variables and shadcn/ui copy-in components
(`style: new-york`, `tsx: false`), Radix primitives and Lucide icons.

**Consequences:** Full ownership of components and tokens; upgrades are manual;
generated components must not be edited without a reason. See
[design-system.md](./design-system.md).

## ADR-008: Geist + Geist Mono from Google Fonts

**Status:** Accepted
**Date:** 2026-10-20

**Context:** The product should feel modern and developer-focused, with
first-class code and data typography.

**Decision:** Load Geist and Geist Mono with `next/font/google`, exposed as
`--font-geist-sans` and `--font-geist-mono`.

**Consequences:** Self-hosted, optimized fonts with no layout shift; Geist from
Google Fonts lacks some advanced features of the npm package, acceptable for
this UI.

## ADR-009: Browser-orchestrated generation, no server queue

**Status:** Superseded by ADR-012
**Date:** 2026-10-20

**Context:** A server queue that receives and stores media would violate the
data boundary and free-tier limits.

**Decision (historical):** The browser submitted jobs, polled providers,
downloaded results and persisted them locally. No server-side job state.

**Superseded because:** Jobs must survive a closed tab and be retryable, but
media still cannot be stored server-side. A server-dispatched job table solves
both without moving media. See ADR-012.

## ADR-010: Stateless proxies with strict SSRF controls

**Status:** Accepted (revised 2026-10-20)
**Date:** 2026-10-20

**Context:** Some providers and local OpenCode endpoints do not allow CORS, but
we do not persist media server-side.

**Decision:** Provide `api/opencode/[...path]` and `api/proxy/fetch` as
forwarders. They use credentials from the authenticated tenant connection
(decrypted in memory only), or per-request credentials for local mode. They
forward allowlisted paths/hosts, follow no redirects, impose timeouts and size
limits, log no bodies or headers, and block private/link-local/cloud metadata
addresses. Media responses are streamed to the client and never written to
disk. BYO OpenCode proxying is disabled on public hosted deployments unless a
platform admin enables it.

**Consequences:** Works with CORS-restricted endpoints; residual SSRF risk is
contained but not zero; tokens never reach the client and are never logged.

## ADR-011: Neon stores all structured data; never media bytes

**Status:** Accepted (supersedes ADR-003)
**Date:** 2026-10-20

**Context:** The product needs cross-device continuity, search, collaboration,
usage accounting and context for RAG. Keeping chats, prompts, agents, skills
and contexts only in the browser makes those impossible. Media remains too
large and too expensive to store in Postgres.

**Decision:** Neon is the source of truth for all structured product data:
Better Auth tables, organizations, members, invitations, chats, messages,
prompts, agents, skills, contexts and chunks, projects, generations and inputs,
asset metadata, device associations, provider/OpenCode connections, usage
events, audit logs, feature flags and preferences. Media bytes (image, audio,
video) are stored only in OPFS on the client.

**Consequences:**

- Cross-device continuity, server-side search, RAG and analytics become possible.
- Database growth must be managed with quotas, retention policies and pagination.
- Privacy and LGPD obligations expand: content is now stored server-side and
  must be covered by export, deletion and access controls.
- Backups contain prompts and context, never media.
- Media remains device-bound; `asset_device` tracks where a copy exists.

## ADR-012: Server-dispatched jobs with client-side download

**Status:** Accepted (supersedes ADR-009)
**Date:** 2026-10-20

**Context:** Generation can take minutes and must survive a closed tab, but the
server cannot become durable media storage.

**Decision:** The server owns job state. A cron/worker claims `generation` rows
with `SELECT ... FOR UPDATE SKIP LOCKED`, calls the provider, and stores status,
provider job id, progress, error and result URLs (with expiry) in Neon. The
client subscribes via SSE (`/api/events`, polling fallback), downloads the
result directly from the provider URL into OPFS, then registers `asset_device`
and marks the generation ready. A reconciliation cron retries or fails stale
jobs. Stateless proxies exist only for CORS.

**Consequences:**

- Jobs continue without an open tab and can be retried idempotently.
- Provider URLs expire; the UI must prompt a timely download and offer
  regeneration when a URL is dead.
- A worker runtime is required (Vercel Cron, container worker or equivalent).
- No media is written to Neon, server disk or function memory beyond streaming.

## ADR-013: Cache-first reads, outbox writes and explicit sync

**Status:** Accepted
**Date:** 2026-10-20

**Context:** The product must feel fast and work on poor connections, while
Neon remains the source of truth.

**Decision:** TanStack Query with IndexedDB persistence for server state;
prefetch on intent; optimistic updates. Writes go through server actions with
client-generated UUIDv7 ids and an idempotency key, queued in an IndexedDB
outbox when offline. Reconnect flushes the outbox in order. Conflicts use a
`version` column with last-write-wins for editable entities; chat messages are
append-only. Durable media is never cached in IndexedDB. A `SyncBadge` and
`OfflineBanner` expose state.

**Consequences:**

- Reads are instant after first load; offline read of cached data works.
- Added complexity: retries, duplicate suppression, conflict policy and cache
  invalidation.
- Idempotency keys and stable ids must be generated on the client.
- Browser storage can be cleared; the server copy remains the recovery path.

## ADR-014: Shared schema with RLS on every tenant table

**Status:** Accepted (supersedes ADR-005)
**Date:** 2026-10-20

**Context:** The database now holds tenant-owned chats, agents, skills,
contexts and generations. Application-only filtering is too easy to bypass.

**Decision:** Shared schema. Every business table has a non-null
`organization_id` with composite indexes `(organization_id, ...)`. Tenant
access is enforced twice: a server-side scoping helper that always injects
`organization_id`, and Postgres RLS policies using
`set_config('app.organization_id', <id>, true)` inside the transaction with a
non-owner role. Cross-tenant ids return 404, not 403. Better Auth tables keep
their own membership checks.

**Consequences:**

- Defense in depth against tenant leaks.
- Every query must run inside a transaction that sets the tenant context;
  background jobs must set it explicitly.
- Migrations and the Drizzle adapter need raw SQL for `set_config`.
- Tests must cover cross-tenant access for every resource.

## ADR-015: Total accessibility and any-screen responsiveness

**Status:** Accepted
**Date:** 2026-10-20

**Context:** The user requires full accessibility and a site that works on any
screen, including phones, tablets, ultrawide monitors, zoom and assistive
technology.

**Decision:** WCAG 2.2 AA is the minimum, with AAA body text where possible.
Support 320-3440 px, 200% text, 400% zoom, keyboard-only use, NVDA, VoiceOver
and TalkBack, `prefers-reduced-motion`, `prefers-contrast` and `forced-colors`.
Layouts use fluid containers, container queries and no fixed widths. Video has
captions and transcripts; every drag interaction has a button alternative.

**Consequences:**

- Accessibility is a review gate, not a polish step.
- The test matrix includes small phones, landscape, split-screen and zoom.
- Some visual ideas are rejected when they cannot be made accessible.
- See [design-system.md](./design-system.md) section 8.

## ADR-016: Encrypted provider, OpenCode and database credentials in Neon

**Status:** Accepted
**Date:** 2026-10-20

**Context:** Connections must persist across devices, but API keys, OpenCode
tokens and database DSNs are high-value secrets and must not be exposed to
browsers or logs.

**Decision:** Store credentials in `provider_connection`,
`opencode_connection` and `database_connection` encrypted with AES-256-GCM
using `ENCRYPTION_KEY`. Provider and OpenCode credentials are scoped
`platform`, `organization` or `user` and resolve **user -> organization ->
platform**; disabled scopes are skipped. Decryption happens only in
server-side code that executes jobs or proxies requests. The API returns
masked metadata (label, provider, last four, status). Logs redact headers,
DSNs and payloads. Key rotation is a documented re-encryption job.

**Consequences:**

- Keys and DSNs work across devices without ever reaching the client.
- `ENCRYPTION_KEY` becomes a critical secret; losing it breaks all connections.
- Rotation and audit paths must exist before public launch.
- A stolen database dump does not expose plaintext credentials, but a stolen
  app secret plus dump does; secret management is part of operations.
- See ADR-017 for how the primary DSN is bootstrapped and changed.

## ADR-017: Admin-managed database configuration with env bootstrap

**Status:** Accepted
**Date:** 2026-10-20

**Context:** The app cannot read its own primary DSN from the database before
connecting, but administrators need to rotate or replace the database without
editing deployment files. Environment-only configuration makes rotation slow;
database-only configuration creates a chicken-and-egg failure.

**Decision:** `DATABASE_URL` (or an equivalent deployment secret) is the
bootstrap and recovery DSN only. An admin can save an encrypted `primary` row
in `database_connection` with a validated DSN, schema version and typed
confirmation. On startup the saved `primary` takes precedence; if it fails
health checks the app fails closed rather than auto-switching. The environment
DSN is used only when no valid primary exists or after an explicit, audited
rollback. Every change is audited with actor, reason and timestamp. The new
DSN is tested with `SELECT 1` and a schema/version check before activation.
The secret is never returned by the API.

**Consequences:**

- Recovery always exists if the saved DSN is wrong or the database is lost.
- Changing the primary database is a two-step operational action and may
  require a restart or connection-pool rebuild.
- Control-plane tables (`system_setting`, `database_connection`,
  `feature_flag`) are platform-wide, have no `organization_id` and are
  admin-only.
- The UI must explain precedence and recovery; it must never print the DSN.

## ADR-018: Remote-only inference; no local models or GPU

**Status:** Accepted
**Date:** 2026-10-20

**Context:** The product must work on phones, tablets and low-power laptops.
Local video models require GPUs, large downloads and long installs, and would
break the browser-first model.

**Decision:** All AI inference is remote over HTTP through server-side
adapters. The client never downloads model weights and never runs Ollama,
llama.cpp, WebGPU, WASM or local diffusion. The only local compute is canvas
keyframe extraction and thumbnail generation. Embeddings and reranking are
remote; if unavailable, search falls back to Postgres full-text, not a local
model.

**Consequences:**

- A network connection and a provider credential are required for generation.
- No offline generation; offline mode covers browsing cached metadata and
  editing drafts only.
- Input bytes are uploaded only for the duration of a job and are not stored
  on our servers.
- Provider privacy/retention policies must be disclosed per model.

## ADR-019: Free-first routing with explicit paid opt-in

**Status:** Accepted
**Date:** 2026-10-20

**Context:** Free tiers rotate and some earlier assumptions (keyless Zen,
keyless video) are not supported by current provider docs. Silent paid
fallback would create unexpected costs.

**Decision:** Resolve in this order: tenant OpenCode gateway, platform
free-tier credential, user BYOK, tenant key, platform key, then an explicitly
opted-in paid provider. There is no keyless video step. Pollinations Classic
is a text/image demo only. Retry only `429`, `5xx` and network errors, at most
twice, with jitter and `Retry-After`. Use capability preflight and a circuit
breaker. Never fall back to a paid model without consent and a cost ceiling.
The UI shows the provider/model and the path used.

**Consequences:**

- A tenant with no credential sees an actionable `no_credential` state.
- Free capacity is never guaranteed; quotas and provider limits are visible.
- Routing is deterministic and testable; every attempt is recorded in
  `usage_event`.
- Paid usage is always intentional and auditable.

## ADR-020: Live catalog and OpenCode-compatible provider registry

**Status:** Accepted
**Date:** 2026-10-20

**Context:** Free model ids change weekly, provider protocols differ and
OpenCode already owns a provider registry and models.dev catalog. Hardcoding a
list would rot and diverge from the orchestrator.

**Decision:** Use a normalized model record sourced from the tenant OpenCode
`/api/model`, models.dev and provider live model endpoints. Keep provider,
model id, aliases, protocols, capabilities, context/output limits, cost,
limits, privacy and health. Cache with a 24-hour TTL, refresh on connection
change and manual request, and mark stale entries instead of deleting them.
Adapters implement chat streaming plus optional synchronous or asynchronous
media methods. OpenCode remains the orchestrator; Zen is one gateway provider,
not a separate model layer.

**Consequences:**

- The app must tolerate schema drift and provider outages.
- Catalog refreshes and alias mapping need tests.
- The picker can show free/health/latency/privacy without hardcoded ids.
- A stale catalog never becomes a security or billing surprise because the
  router revalidates capabilities and limits before dispatch.

## ADR-021: Assemble video in the browser with WebCodecs and Mediabunny

**Status:** Accepted
**Date:** 2026-11-01

**Context:** Generated clips must be stitched into one file without uploading
media to the server. Earlier assumptions pointed to `ffmpeg.wasm`, but it
downloads 20-30 MB, runs single-threaded without COOP/COEP headers and is an
order of magnitude slower than the platform encoder. WebCodecs is baseline in
every current desktop browser (Chrome/Edge 94+, Firefox 130+, Safari 16.4+
partial, full in 26.1).

**Decision:** Assemble clips with `VideoEncoder`/`VideoDecoder` plus Mediabunny
as the MP4 muxer, inside a worker, streaming frames from OPFS. Load
`ffmpeg.wasm` on demand only when the browser cannot encode H.264 or when a
filter or container requires it. Feature-detect before starting a job and show
the chosen path in the UI.

**Consequences:**

- No large WASM download on the happy path; assembly is hardware accelerated.
- Safari below 16.4 and Firefox on Android need the `ffmpeg.wasm` fallback.
- `VideoFrame` timestamps are microseconds; this needs a shared helper and a
  test to avoid the classic 1000x bug.
- Memory stays bounded because clips are streamed from OPFS, not buffered.

## ADR-022: Self-hosted Better Auth with transaction-local RLS context

**Status:** Accepted
**Date:** 2026-11-01

**Context:** Neon now offers Managed Better Auth (data in `neon_auth`,
branch-aware, RLS-compatible) alongside self-hosted Better Auth. The product
needs organization roles, invitations and admin metadata in one schema with a
single migration history.

**Decision:** Keep Better Auth self-hosted with the Drizzle adapter, the
`organization` and `admin` plugins, tables owned by the app schema. Enforce
tenant isolation with RLS policies bound to `current_setting('app.tenant_id')`,
set with `SET LOCAL` inside the same transaction as every tenant query. Managed
Better Auth stays documented as the alternative for a zero-auth-code path.

**Consequences:**

- A pooled connection can never leak tenant context; session-level `SET` is
  forbidden in review.
- Tests must assert that a query without `app.tenant_id` returns zero rows.
- Moving to the Neon Data API later would require a JWT plus `auth.user_id()`
  policies, tracked as a separate ADR.
