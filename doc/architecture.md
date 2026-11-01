# Architecture - Create Video with OpenCode

## 1. Goal

A multi-tenant web application that cooperates with OpenCode to produce AI
videos. Each tenant (organization/workspace) connects its own OpenCode
instance or uses the built-in free media providers, picks an Open/free model,
and generates video from any combination of prompt, image and video inputs.

The product includes a public landing page, email/password authentication,
tenant workspaces with chats, prompts, agents, skills and contexts, a local
media library and a platform administration area.

**Data boundary:** Neon stores **all structured data** (accounts, access,
chats, messages, prompts, generations, agents, skills, contexts, preferences,
usage, audit, encrypted AI credentials, quotas and database connection
settings). Only **image/video/audio bytes** are excluded: media lives in the
browser (OPFS) and the database keeps metadata and provider URLs only.

**Inference invariant:** every model runs remotely through an HTTP API, using
the same mechanics as OpenCode: a provider registry, a live model catalog,
credentials resolved server-side, `provider/model` ids, streaming and fallback.
The browser never downloads weights and never needs a GPU, WebGPU, WASM runtime
or large RAM. The only local compute is keyframe extraction with a canvas.

## 2. Chosen stack

**Next.js (App Router, latest stable) in plain JavaScript (JSX, no
TypeScript), Tailwind CSS v4, shadcn/ui and Neon Postgres.**

| Layer | Choice |
|-------|--------|
| Framework | Next.js App Router, `app/` directory, JSX only |
| Language | JavaScript + JSDoc for editor hints (no `.ts`/`.tsx`) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix primitives, `tsx: false`) |
| Icons / fonts | Lucide; Geist + Geist Mono via `next/font/google` |
| Database | Neon Postgres for all structured data; no media bytes |
| ORM / migrations | Drizzle ORM + `drizzle-kit` |
| Auth | Better Auth (email/password) + organization and admin plugins |
| Validation | Zod schemas shared by server actions and forms |
| Inference | Remote HTTP APIs only (OpenCode gateway, free online providers); no local runtime |
| Server state | TanStack Query with IndexedDB persistence; SSE for live updates |
| Forms | React Hook Form + `@hookform/resolvers/zod` |
| Media storage | Browser OPFS; metadata + device availability in Neon |
| Browser cache | IndexedDB (entities, queries, drafts, outbox) + Cache Storage |
| Secrets | Provider/OpenCode keys and DSNs AES-256-GCM encrypted in Neon, never sent to clients |
| Email | Resend + React Email templates |
| Deployment | Vercel (app) + Neon (database); Docker for self-host |

Rationale:

- The product is a public, authenticated, multi-tenant SaaS, not a local
  control panel. A full-stack framework removes the need for a separate API.
- Next.js provides SSR for the landing page (SEO), route protection close to
  the data, server actions, streaming and cron.
- JavaScript keeps the entry barrier low, as requested. Type safety comes from
  Zod at the boundaries and JSDoc in shared modules.
- Neon can hold every text/JSON artifact (chats, prompts, agents, skills,
  contexts, job state) cheaply; only media bytes are kept out.
- Browser storage makes the app fast and resilient: reads are cache-first and
  writes are optimistic through an outbox.

Alternatives considered:

| Stack | Why not chosen |
|-------|----------------|
| Vite + React SPA | No SSR/SEO for the landing page; needs a separate auth server; superseded by ADR-001 |
| Remix / React Router 7 | Viable, but smaller overlap with the researched multi-tenant starters |
| Vue / Nuxt, SvelteKit | Smaller ecosystem overlap with the studied repos and shadcn patterns |
| Prisma | Excellent, but heavier runtime and codegen; Drizzle fits Neon SQL better |
| Neon Managed Better Auth | Less control over organization roles/invitations; self-hosted Better Auth keeps users in one schema (see ADR-004) |
| Clerk / Auth0 | Per-MAU cost and vendor lock-in for a free-first product |
| S3/R2/Vercel Blob | Violates the data boundary: media bytes must stay on the client |

## 3. Runtime topology

```
Browser
  -> IndexedDB: query cache, entities, drafts, outbox, settings
  -> OPFS: image/video/audio blobs (never uploaded)
  -> Cache Storage: app shell + static assets (service worker)
  -> Next.js app (Vercel or Docker)
       -> Neon Postgres (all structured data)
       -> Resend (verification, reset, invitations)
  -> Provider media URL (direct download into OPFS)
  -> OpenCode endpoint (tenant BYO, server-side proxy)

Next.js server
  -> Job dispatcher (cron/worker) -> OpenCode or free providers
  -> Writes job state, progress, provider URLs to Neon
  -> Never writes media bytes to disk or database
```

Two deployment modes share the same code:

1. **Self-hosted / local**: one Docker Compose stack with the app, Postgres
   (or Neon) and an `opencode serve` sidecar. The server can reach OpenCode
   directly and media downloads go to the browser.
2. **Hosted SaaS**: Vercel + Neon. Tenants expose their own OpenCode endpoint
   through an HTTPS tunnel or use the direct free providers.

Jobs are **server-dispatched** and **client-downloaded**:

1. The client creates a `generation` row through a server action.
2. A cron/worker claims queued jobs with `FOR UPDATE SKIP LOCKED`, calls the
   provider and records `external_id`, progress and the output URL.
3. The client follows progress over SSE (or polling) and downloads the result
   directly into OPFS, then records which device cached it.
4. If the tab closes, the job continues. When the user returns, metadata is
   already synced; media can be downloaded on any signed-in device while the
   provider URL is valid.

No media byte is ever stored in Neon, serverless storage or a CDN. A stateless
proxy can stream a download through the server when CORS blocks the browser;
it does not persist the stream.

## 4. Authentication and tenancy

### 4.1 Authentication

Better Auth with the Drizzle adapter, mounted at
`app/api/auth/[...all]/route.js`:

- Email + password (minimum 10 characters), verification and password reset.
- Session cookie: `httpOnly`, `secure`, `sameSite=lax`, 7-day expiry, 1-day
  rolling update.
- Optional OAuth (GitHub/Google) after the MVP; the schema already supports it.
- Rate limiting on login, register and reset (Better Auth built-in, plus
  Upstash/in-memory fallback).
- Platform role in `user.role` through the admin plugin (`user`, `admin`).
- Bootstrap secrets: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `DATABASE_URL`, `RESEND_API_KEY`, `ENCRYPTION_KEY`. Provider keys, OpenCode
  tokens and additional DSNs live encrypted in Neon (section 4.5/4.6).

### 4.2 Two role layers

| Layer | Field | Values | Scope |
|-------|-------|--------|-------|
| Platform | `user.role` | `user`, `admin` | `/admin`, all tenants |
| Tenant | `member.role` | `owner`, `admin`, `member` | One organization |

- Platform admins manage accounts, tenants, quotas and flags. Access to
  prompts/chats is **not** part of support tooling and requires an audited,
  time-boxed elevation if ever needed.
- Tenant roles: `owner` (delete tenant, transfer ownership), `admin` (members,
  invitations, connections, agents, skills), `member` (create chats,
  generations and prompts), optional `viewer` (read-only) as a custom role.
- UI hides actions by role, but every server action and route handler
  re-checks the role and the tenant.

### 4.3 Tenant isolation

Model: **shared database, shared schema, `organization_id` on every business
row** (see ADR-005).

Rules:

1. `organization` is the tenant. URL shape: `/app/[orgSlug]/...`.
2. The tenant is resolved from the session membership, never from a client
   supplied id. The slug is a routing hint; membership is verified server-side.
3. Every read/write goes through repositories that require an
   `organizationId`. No raw `db.select()` in pages or components.
4. Unique keys are tenant-scoped, e.g. `unique (organization_id, slug)`.
5. Cross-tenant ids return `404`, not `403`, to avoid leaking existence.
6. Defense in depth: Postgres RLS on tenant tables using
   `set_config('app.organization_id', ..., true)` inside a transaction with a
   non-owner role. System rows (global skills) have `organization_id IS NULL`
   and are read-only.
7. Reserved slugs: `admin`, `api`, `app`, `auth`, `login`, `register`, `www`,
   `support`, `docs`, `billing`.

### 4.4 Invitations and onboarding

- Register -> verify email -> create first organization -> app.
- Invite by email with role; `/accept-invitation/[id]` requires a matching
  signed-in email.
- Invitations expire in 7 days; re-inviting cancels the previous one.
- Tenant switcher lists memberships; "Create organization" is always available.
- Deleting a tenant soft-deletes structured data for 30 days and removes
  memberships. Members' local media is untouched; the UI offers "clear local
  data" per tenant.

### 4.5 AI credentials, BYOK and quotas

Credentials are database rows, not environment-only values. Three scopes:

| Scope | Owner | Typical use |
|-------|-------|-------------|
| `platform` | Platform admin | Default keys, free-provider keys, fallback |
| `organization` | Tenant owner/admin | Shared team key for one provider |
| `user` | The user | Personal BYOK key for a specific AI provider |

Resolution for a provider, most specific first: **user -> organization ->
platform**. A scope can be disabled by policy; disabled scopes are skipped. If
no credential resolves for a provider that requires one, the job fails with
`no_credential` and the UI links to the right settings screen. Anonymous
access is limited to the Pollinations Classic text/image demo and is never
used for video.

Rules:

1. Keys are write-only. The API returns `provider`, `label`, `key_hint` (last
   four characters), `status`, `last_used_at` and `allowed_models`; never the
   secret. Admins can replace, test or revoke, but not reveal.
2. Every key is encrypted with AES-256-GCM, a random IV and AAD binding
   `id + scope + provider + key_version` (see ADR-016).
3. A credential can restrict providers/models and inherit a platform
   allowlist. Model ids outside the allowlist are rejected server-side.
4. BYOK is a policy: `byok_enabled` at platform and tenant level, with
   `require_user_key` per provider. Platform admin can disable BYOK globally;
   tenant admin can disable it for the tenant; users cannot override.
5. OpenCode tokens follow the same model (`opencode_connection`), one primary
   connection per tenant plus optional per-user connections.
6. The server dispatcher decrypts the selected credential in memory, calls the
   provider, and records `credential_id`, `credential_scope` and `user_id` in
   `usage_event`. The browser never receives a key or a decrypted DSN.
7. Rotating a key creates a new `key_version`, re-encrypts, tests, then marks
   the old version revoked. Every change writes an `audit_log` row.

Quotas and limits are also database rows so admins can change them without a
deploy:

- Scopes: `platform` (default), `organization`, `user`. The most specific row
  wins; `0` means blocked for that metric.
- Metrics: generations/day and /month, tokens/month, cost cents/month,
  concurrent jobs, provider requests/minute, max output seconds, max input
  bytes, max context tokens, max credentials, max members.
- Policy: allowed providers/models, BYOK on/off, media download allowed,
  export allowed.
- Enforcement happens before enqueue and again in the dispatcher (defense in
  depth). Exceeding a limit returns `429` with the metric, limit, current value
  and reset time. Usage is aggregated from `usage_event`; admin changes are
  audited with actor and reason.

### 4.6 Database configuration owned by the admin

The primary connection string cannot be read from the database before the app
connects to it. Bootstrap is therefore explicit:

1. `DATABASE_URL` (or a Docker/K8s secret) opens the first connection.
2. The admin can save, test and rotate connection strings in
   `database_connection` (AES-256-GCM with AAD binding `id + role +
   key_version`, admin-only). A validated `primary` row takes precedence on
   the next app/worker start. If it fails its health check, the app fails
   closed instead of silently switching databases; env is the documented
   recovery path only after an explicit rollback action.
3. Additional rows can describe a read replica, an analytics database or an
   external tenant database. Only `primary` is used by Drizzle; others are
   read-only and allowlisted per feature.
4. The admin UI shows `host`, `database`, `user`, `ssl_mode`, `pool_max`,
   `role`, `status` and `last_checked_at`, with the password masked. It never
   returns the full DSN.
5. Changing `primary` requires a successful `SELECT 1` plus a schema/version
   check, typed confirmation, an `audit_log` entry and a restart notice.
   Workers reload the active DSN on their next start.
6. Only `user.role = admin` can read or write these rows. They are
   control-plane tables with no `organization_id` and are denied by RLS to
   tenant roles.

## 5. Data model

Tenant tables have `id`, `organization_id`, `created_at`, `updated_at`,
`deleted_at` and `created_by`. Control-plane tables (`system_setting`,
`database_connection`, `feature_flag`) have no `organization_id`; `quota` may
target platform, tenant or user. Auth tables are owned by Better Auth.

### 5.1 Identity and access

| Table | Purpose |
|-------|---------|
| `user` | Identity, email, password hash, platform role, ban fields |
| `session` | Active sessions and expiry |
| `account` | Credentials and future OAuth accounts |
| `verification` | Email verification and reset tokens |
| `organization` | Tenant id, name, slug, logo URL, settings |
| `member` | User <-> organization, role |
| `invitation` | Email, role, status, expiry |
| `device` | Browser install id, user, name, user agent, last seen |
| `api_key` | Tenant automation keys (prefix, hash, scopes, last used) |
| `system_setting` | Admin-only key/value config; `encrypted_value` when secret (no tenant column) |
| `database_connection` | Admin-managed DSNs: `role`, `encrypted_url`, `ssl_mode`, `pool_max`, `status`, `last_checked_at` (no tenant column) |

### 5.2 AI workspace

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `project` | Groups chats and generations | `name`, `slug`, `description` |
| `chat` | Conversation | `project_id`, `title`, `agent_id`, `model`, `pinned`, `archived` |
| `chat_message` | Message | `chat_id`, `role`, `content`, `model`, `tokens`, `metadata jsonb` |
| `prompt` | Saved prompt library | `title`, `body`, `tags text[]`, `favorite`, `usage_count` |
| `agent` | Custom agent | `name`, `description`, `system_prompt`, `model`, `skills jsonb`, `tools jsonb`, `visibility` |
| `skill` | Skill registry | `name`, `slug`, `version`, `description`, `source`, `instructions`, `enabled`, `is_system` |
| `context` | Context collection | `name`, `description`, `scope` |
| `context_document` | Text/Markdown source | `context_id`, `title`, `content`, `source_url`, `tokens` |
| `context_chunk` | Retrieval unit | `document_id`, `content`, `position`, `embedding vector(1536)` (optional) |
| `model_preference` | Last model per user/tenant | `user_id`, `provider`, `model`, `params jsonb` |

`agent.skills` and `agent.tools` are JSON arrays of skill slugs and tool ids.
`skill` accepts `organization_id = NULL` for platform-provided skills, which
are read-only for tenants. `context_chunk.embedding` uses `pgvector` when
semantic retrieval is enabled; it stores text vectors, not media.

`provider_connection` and `opencode_connection` use a scope check:
`platform` has `organization_id IS NULL AND user_id IS NULL`, `organization`
has `organization_id NOT NULL AND user_id IS NULL`, and `user` has both set.
Partial unique indexes enforce one default per `(scope, owner, provider)`.
`quota` is unique on `(scope, organization_id, user_id, metric, window)` with
NULLs treated as the platform/tenant default. Secrets are bytea or text
ciphertext; no plaintext column exists.

### 5.3 Generation and media metadata

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `generation` | Video job | `project_id`, `chat_id`, `prompt`, `mode`, `provider`, `model`, `params jsonb`, `status`, `progress`, `error_code`, `error_message`, `external_id`, `output_url`, `output_expires_at`, `output_asset_id`, `started_at`, `finished_at` |
| `generation_input` | Inputs per job | `generation_id`, `asset_id`, `role` (`reference`, `start_frame`, `end_frame`, `source_video`) |
| `asset` | Media metadata only | `kind`, `mime_type`, `bytes`, `width`, `height`, `duration_ms`, `checksum`, `provider`, `provider_url`, `source` |
| `asset_device` | Which browser has the blob | `asset_id`, `device_id`, `opfs_path`, `cached_at` |
| `provider_connection` | AI provider key, any scope | `scope` (`platform`/`organization`/`user`), `user_id`, `provider`, `label`, `encrypted_secret`, `key_hint`, `key_version`, `allowed_providers text[]`, `allowed_models text[]`, `is_default`, `status`, `last_used_at`, `last_checked_at` |
| `opencode_connection` | OpenCode endpoint | `scope`, `user_id`, `base_url`, `encrypted_token`, `key_version`, `is_default`, `status`, `models_cache jsonb`, `last_checked_at` |
| `quota` | Limits by scope | `scope`, `user_id`, `metric`, `limit_value`, `window`, `enforced`, `reason`, `updated_by` |
| `usage_event` | Metering and quotas | `kind`, `provider`, `model`, `units`, `tokens_in`, `tokens_out`, `cost_cents`, `generation_id`, `user_id`, `credential_id`, `credential_scope` |
| `audit_log` | Security trail | `actor_user_id`, `action`, `target_type`, `target_id`, `metadata jsonb`, `ip`, `user_agent` |
| `feature_flag` | Platform config | `key`, `enabled`, `rollout jsonb` (no tenant column) |

`generation.status`: `queued -> running -> downloading -> ready` with
`failed` / `canceled` branches. `progress` is 0-100. `downloading` means the
provider finished and a URL is available; it becomes `ready` when the client
confirms a cached blob, or stays `downloading` for other devices.

`asset` never contains bytes. The blob lives at
`OPFS /<userId>/<orgId>/<assetId>.<ext>`; `asset_device` tells the UI whether
this device can play it or must download it again.

### 5.4 Indexes and retention

- `(organization_id, created_at DESC)` on chats, messages, generations and
  audit logs.
- `unique (organization_id, slug)` on projects, agents and skills.
- GIN on `chat_message.content`, `prompt.body` and `context_document.content`
  for full-text search.
- `(scope, organization_id, user_id, provider)` on `provider_connection` and
  `opencode_connection`; `(scope, organization_id, user_id, metric)` on `quota`.
- `(user_id, created_at DESC)` and `(credential_id, created_at DESC)` on
  `usage_event` for per-user spend reports.
- HNSW on `context_chunk.embedding` when pgvector is enabled.
- Soft delete + 30-day purge for tenants and projects; chat retention is a
  tenant setting (default: keep until deleted).
- Usage events are aggregated monthly; raw rows are pruned after 90 days.

## 6. Browser storage and sync

The browser is a cache and an offline buffer, not the source of truth for
structured data.

### 6.1 What lives where

| Data | Browser | Neon |
|------|---------|------|
| Auth session cookie | Cookie | Session row |
| Chats, messages, prompts | IndexedDB cache | Source of truth |
| Agents, skills, contexts | IndexedDB cache | Source of truth |
| Generations and progress | IndexedDB cache | Source of truth |
| Model catalog | IndexedDB, TTL 10 min | Cached per connection |
| Media bytes | OPFS | Never |
| Media metadata | IndexedDB | `asset` + `asset_device` |
| Drafts and UI state | IndexedDB/localStorage | Optional |
| Outbox (pending writes) | IndexedDB | Applied on sync |

### 6.2 Read path

1. Serve from IndexedDB immediately (cache-first) with a `staleAt` timestamp.
2. Revalidate in the background with TanStack Query; update the cache and the
   persisted query store.
3. Prefetch on hover, route prefetch and `requestIdleCallback` for the next
   likely screen.
4. Use SSE (`/api/events`) for chats and generation progress; fall back to
   polling with exponential backoff.

### 6.3 Write path

1. Validate with Zod, apply an optimistic update to IndexedDB.
2. Append an operation to the outbox with an idempotency key.
3. Send through a server action/route handler; retry with jitter when offline.
4. On ack, merge the server row (`version`, `updatedAt`) and remove the
   outbox entry.
5. Conflicts: last-write-wins per entity with a version check; chat messages
   are append-only, so they never conflict. Destructive actions require the
   server ack before the UI confirms.

### 6.4 Media path

- Validate MIME, size and duration before writing to OPFS.
- Generate thumbnails with canvas; store them in OPFS next to the asset.
- Call `navigator.storage.persist()` and display the result.
- Show `navigator.storage.estimate()`; warn at 80% and offer cleanup.
- Pin assets used by chats/prompts; evict unpinned media with LRU when needed.
- Export/import a ZIP (JSON + media) for backup or device migration.
- On a new device, metadata syncs and media shows "not on this device" with a
  download action while `output_url` is valid; otherwise offer regeneration.

### 6.5 Service worker

- Precache the app shell and fonts; network-first for HTML, stale-while-
  revalidate for static assets.
- Offline fallback for the app shell; library and cached chats remain readable.
- Background Sync for the outbox where supported; otherwise retry on focus.
- Never cache media responses in Cache Storage by default (avoid duplicating
  OPFS bytes); explicit downloads go to OPFS.

## 7. Integration with OpenCode

The server owns the tenant OpenCode connection (URL + encrypted token) and
calls the audited V2 endpoints. The browser may call the same endpoints
through a stateless proxy when a local connection is used.

| Endpoint | Use |
|----------|-----|
| `GET /api/info` | Version, pid, connection URLs |
| `GET /api/location` | Current project/location |
| `GET /api/model` | List models across providers |
| `GET /api/model/default` | Default model |
| `GET /api/provider` | Configured/available providers |
| `GET /api/agent` | Agents available for prompting |
| `GET /api/skill` | Installed skills (e.g. `video-creator`) |
| `GET /api/event` | Event stream (progress) |
| `POST /api/session` | Create a session |
| `POST /api/session/{id}/model` | Switch model |
| `POST /api/session/{id}/agent` | Switch agent |
| `POST /api/session/{id}/prompt` | Send prompt + inputs |
| `POST /api/session/{id}/generate` | Transient generation |

Call strategy:

1. **Server dispatcher** for jobs: resolves the credential in the order
   user -> organization -> platform, checks BYOK policy and quotas, decrypts the
   key in memory, injects it server-side, applies timeouts and stores only
   status/URLs in Neon.
2. **Browser direct** for local mode when the endpoint allows CORS.
3. **Stateless proxy** `app/api/opencode/[...path]/route.js` for CORS-restricted
   or HTTPS-tunneled endpoints. It forwards an allowlisted path, follows no
   redirects, limits size/time, logs no headers/body and blocks link-local and
   cloud metadata addresses.
4. If no connection exists, fall back to direct free providers. The UI always
   shows which path produced a video (`opencode` or `direct`).

Gateway-first, then direct: a healthy tenant OpenCode connection is preferred
because it already owns the provider registry, keys and model catalog. The
built-in adapters implement the same contract, so behavior and error codes do
not change when the gateway is absent.

The model catalog is cached per connection in `opencode_connection.models_cache`
and in IndexedDB for instant rendering.

## 8. Model catalog, free-first routing and remote inference

The picker is populated from a live remote catalog: the tenant OpenCode
`/api/model` when connected, plus a `models.dev`-compatible registry bundled
with the app. Providers with free tiers (OpenCode Zen, Google AI Studio, Groq,
Cerebras, OpenRouter free models, Pollinations, Agnes) are flagged as
"Open/free". The last selection is stored in `model_preference` per user/tenant
and mirrored in IndexedDB for instant load.

Free tiers rotate, so never hardcode ids: read the live catalog, filter by
capability (for example `video` output) and zero cost, and keep a curated
fallback list in `lib/providers/catalog.js` (see
[research/opencode-free-inference.md](./research/opencode-free-inference.md)
and
[research/free-llm-open-source-projects.md](./research/free-llm-open-source-projects.md)).
There is no local Ollama, llama.cpp, WebGPU or WASM fallback.

The catalog is metadata only. Free means "zero price in the catalog and
currently advertised as free by the provider", not "no credential": Zen,
Pollinations unified, Agnes and OpenRouter still require a server-side key.
The per-model privacy/retention policy is part of the record and must be shown
before the first request.

### 8.1 Catalog and OpenCode compatibility

The app reuses OpenCode's mechanics rather than inventing another model layer:

| OpenCode concept | Cvopencode implementation |
|------------------|---------------------------|
| `opencode.json` `provider`, `model`, `small_model` | `provider_connection` + `model_preference` (main and small); ids stay `provider/model` |
| `opencode auth login` | Write-only encrypted credential UI, scoped platform/tenant/user |
| models.dev catalog | Normalized, cached model metadata used by the picker and router |
| `GET /api/model` | Catalog sync into `opencode_connection.models_cache` and IndexedDB |
| `GET /api/agent`, `/api/skill` | Tenant agents and skills |
| `GET /api/event` | SSE stream for tokens, progress and job events |
| Provider plugin | One adapter contract in `lib/providers/registry.js` |

Normalized model record: `id`, `provider`, `alias`, `label`, `capabilities[]`
(`text`, `image`, `video`, `audio`, `embedding`), `context_window`,
`max_output`, `input_modalities[]`, `output_modalities[]`, `protocols[]`,
`cost` (input/output per unit and per second), `free`, `status`, `regions`,
`limits` (RPM/RPD/concurrency/duration/resolution), `privacy`
(`zero_retention`, `may_train`, `unknown`), `health`, `docs_url`.

Adapter contract: `listModels()`, `health()`, `chatStream(input)`,
`generateMedia?(input)` for synchronous delivery, and optional
`submit(input) -> { externalId }`, `poll(externalId) ->
{ status, progress, url, expiresAt }`, `cancel(externalId)`,
`estimateCost()`. A provider that has no submit/poll support must not be
forced into that flow; sync media is normalized into the same job state
machine.

The catalog refreshes on a TTL (default 24 hours) and on connection change;
stale entries are marked, not silently removed. A manual refresh is available
to admins.

`opencode.json` import maps providers and model ids only. Secrets are never
imported from a file in hosted mode; the user re-enters them in the credential
UI.

### 8.2 Free-first routing and fallback

The user picks a `provider/model`; the server resolves the credential and
routes. When the first choice is unavailable, a deterministic chain runs:

1. Tenant OpenCode gateway, if connected and healthy.
2. Platform free-tier credential (OpenCode Zen, Pollinations `sk_`, Agnes or
   OpenRouter free).
3. User BYOK key, when the provider is free-tier eligible.
4. Tenant shared key.
5. Platform default key.
6. Opt-in paid provider (not in the MVP; requires explicit consent and a cost
   ceiling).

There is no keyless step for video. Pollinations Classic keyless access is a
demo for text/image only and is not part of the production chain. If no
credential exists for a capable provider, the request ends with
`no_credential` and an action to configure a key.

Rules:

- **Capability preflight.** Reject unsupported mode/model combinations before
  creating a job, with the supported alternatives.
- **Free-first, never silent paid.** A paid fallback requires explicit opt-in.
  The UI always shows which provider/model produced the result.
- **Health and circuit breaker.** Skip providers with an open circuit or a
  failed health check; retry only `429`, `5xx` and network errors, at most twice,
  with jitter and `Retry-After`.
- **Streaming stays server-side.** Chat tokens and job events reach the browser
  over SSE; the browser does not call provider APIs directly in hosted mode.
  Optional local mode may call a localhost OpenCode endpoint.
- **Remote embeddings.** Context embeddings and reranking use a remote API. If
  unavailable, search falls back to Postgres full-text, never to a local model.
- **Cost and quota guard.** Check quota, provider free-tier limits and cost
  ceiling before each attempt; record every attempt in `usage_event`.
- **Free, not unlimited.** Show RPM/RPD/concurrency/duration limits and the
  per-model privacy policy; a `429` includes the metric, limit, current value
  and reset time.
- **No client requirements beyond a browser.** No GPU, no model download, no
  large RAM. Keyframe extraction is the only local compute.

### 8.3 Direct free media providers

Not every free model can produce video through OpenCode. When the tenant has
no video-capable model, the same provider-adapter interface calls a media API
directly. Credentials are encrypted in Neon and used only by the server
dispatcher; they are never sent to the browser.

| Provider | Endpoint/model | Access | Job model |
|----------|----------------|--------|-----------|
| Pollinations | `https://gen.pollinations.ai`, `GET /video/{prompt}` | `sk_` key, Pollen credits | Sync MP4 by default; `Prefer: respond-async` returns `202` + `Location` |
| Agnes | `https://apihub.agnes-ai.com/v1`, `agnes-video-2.5-flash` | API key, promotional `$0/s` | `POST /videos` then `GET /agnesapi?video_id=...` |
| OpenCode Zen | `https://opencode.ai/inference`, per-protocol chat endpoints | Console API key | Chat streaming only; no video |
| OpenRouter | `https://openrouter.ai/api/v1`, `openrouter/free` | API key | Chat streaming; 20 RPM, 50 or 1,000 RPD |

Pollinations also exposes audio, image, 3D and embeddings routes. Its model
list is public (`/models`, `/v1/models`, `/video/models`) and includes
aliases, supported endpoints, modalities, health and per-user RPM.

Adapter media contract:

- `generateMedia(input)` for synchronous providers returns bytes or a URL.
- `submit(input)` / `poll(externalId)` / `cancel(externalId)` for asynchronous
  providers. Poll with backoff and honor `Retry-After`.
- The UI always shows whether the result came from `sync` or `async`, which
  provider/model produced it, and when the job expires.
- Rate limits use per-provider backoff and a clear `rate_limited` error code;
  `402` is `payment_required`, missing keys are `no_credential`.

Pollinations async jobs expire after 24 hours. Agnes polls every 1-2 seconds
and accepts at most 5 images and 3 audios, with `720P` output and no video
input.

## 9. Generation modes

| Mode | Inputs | Pipeline |
|------|--------|----------|
| text-to-video | prompt | prompt -> video generator |
| image-to-video | image (+ prompt) | image reference + prompt -> generator |
| video-to-video | video (+ prompt) | keyframe extraction -> image reference + prompt -> generator |
| multimodal | image + video + prompt | keyframes + image reference + prompt -> generator |

Keyframes are captured **in the browser**: an offscreen `<video>` seeks to 8
evenly spaced timestamps and draws frames to a canvas, producing JPEG/PNG
blobs. Inputs are uploaded to the provider only for the duration of the job;
they are not stored on our servers. The local originals remain in OPFS.

Uploads are validated before they enter OPFS: MIME, size (images <= 10 MB,
videos <= 200 MB), duration (<= 60 s) and decode check. Thumbnails are
generated with canvas and stored next to the asset.

## 10. Routes

```
app/
  (marketing)/
    page.jsx                     # landing
    pricing/page.jsx
    docs/page.jsx
    legal/{terms,privacy}/page.jsx
  (auth)/
    login/page.jsx
    register/page.jsx
    forgot-password/page.jsx
    reset-password/page.jsx
    verify-email/page.jsx
    accept-invitation/[id]/page.jsx
  (app)/app/[orgSlug]/
    layout.jsx                   # tenant guard + shell
    page.jsx                     # dashboard
    chats/page.jsx
    chats/[id]/page.jsx
    create/page.jsx              # generation studio
    library/page.jsx
    library/[id]/page.jsx
    prompts/page.jsx
    agents/page.jsx
    agents/[id]/page.jsx
    skills/page.jsx
    contexts/page.jsx
    contexts/[id]/page.jsx
    settings/{general,members,connections,models,local-data}/page.jsx
  (admin)/admin/
    layout.jsx                   # platform admin guard
    page.jsx
    tenants/page.jsx
    tenants/[id]/page.jsx
    users/page.jsx
    jobs/page.jsx
    providers/page.jsx
    skills/page.jsx
    audit/page.jsx
    flags/page.jsx
  api/
    auth/[...all]/route.js
    events/route.js              # SSE
    sync/route.js                # outbox replay
    chats/route.js
    chats/[id]/messages/route.js
    generations/route.js
    generations/[id]/route.js
    generations/[id]/cancel/route.js
    assets/[id]/cache/route.js
    uploads/[id]/route.js        # transient input handoff, no retention
    providers/test/route.js
    opencode/[...path]/route.js  # stateless proxy
    proxy/fetch/route.js         # stateless media stream
    cron/dispatch/route.js
    cron/reconcile/route.js
```

`proxy.js` (formerly `middleware.js`) performs an optimistic cookie check for
`/app` and `/admin`. It does **not** query the database; membership and roles
are enforced in layouts, server actions and route handlers.

## 11. Code organization

```
app/                  routes above
components/
  ui/                 shadcn primitives (generated, JSX)
  marketing/          hero, features, pricing, faq, footer
  app/                shell, org switcher, chat, studio, library
  a11y/               skip link, live region, focus helpers
  admin/              users/tenants/jobs tables, flags
  forms/              shared field wrappers
  data-table/         TanStack Table wrapper
lib/
  auth.js             Better Auth server instance
  auth-client.js      Better Auth React client
  db/index.js         Drizzle + Neon client
  db/schema/          auth, workspace, media, ops
  opencode/client.js  server + browser OpenCode clients
  providers/          adapter registry + free providers
  jobs/               dispatcher, claim, reconcile, state machine
  client-store/       IndexedDB cache, outbox, media, quota, backup
  sync/               sync engine, SSE client, conflict handling
  crypto.js           AES-GCM helpers for credentials
  validation/         Zod schemas
  utils.js            cn(), formatting, ids
db/migrations/        drizzle-kit output
worker/               dispatcher entry for self-host/Docker
emails/               React Email templates
```

## 12. Security and privacy

| Risk | Control |
|------|---------|
| Database breach | Media bytes absent; prompts/chats encrypted at rest by Neon; strict least-privilege DB role |
| Cross-tenant access | `organization_id` in repositories + RLS on tenant tables; 404 for foreign ids |
| Credential leakage | Provider/OpenCode keys and DB DSNs AES-256-GCM encrypted with a versioned `ENCRYPTION_KEY`; write-only API; masked in UI; no secrets in logs, Sentry or exports |
| Stolen database backup | Dump contains ciphertext plus metadata, never plaintext keys or media; `ENCRYPTION_KEY` lives outside the database/backup |
| Malicious or compromised admin | Admin cannot reveal secrets, only replace/revoke; every config, quota and database change is audited; optional two-admin approval for `primary` DSN changes |
| Bad database configuration | Test connection + schema/version check before activation; env bootstrap as recovery path; stale workers alerted |
| XSS reading local media | Strict CSP, no inline scripts, no third-party scripts on app routes, dependency review |
| SSRF via BYO URL or media proxy | HTTPS only in production, host allowlist, block private/link-local/metadata addresses, no redirects, timeout + size limit |
| Prompt injection | Agents cannot execute tools without explicit user approval; tool allowlist; no secrets in prompts |
| Abuse of free providers | Server-side quotas from `usage_event`, concurrency caps, rate limiting |
| Auth attacks | Rate limits, email verification, generic errors, breached-password check |
| Enumeration | Opaque public ids; 404 for foreign resources |
| Device loss | Media is local by design; export/backup reminder; optional library passphrase |
| LGPD/GDPR | Export and delete tenant/user data; local media deleted in the browser; documented retention |

Media in OPFS is same-origin and readable by any script on the origin. CSP and
supply-chain hygiene are part of the media security model, not optional
hardening.

## 13. Observability and limits

- Sentry for browser, server and cron, with prompt/content scrubbing.
- Structured logs with `requestId`, `organizationId`, `generationId`; never
  log prompt text, message content or tokens.
- Metrics: queued jobs, p95 time per provider, failure rate, cache hit ratio,
  outbox lag, active tenants, cost per generation.
- Traces for server actions, dispatcher and provider calls.
- Default limits: 3 concurrent jobs per tenant, 50 generations/day on free,
  1 OpenCode connection per tenant, 60 s max output for the MVP. Admins can
  override any metric per tenant or user in `quota`; the most specific row wins.
- Alert on dispatcher backlog, provider error spikes, RLS denials, quota
  saturation, spend anomalies and failing `database_connection` health checks.

## 14. Accessibility and responsiveness

Accessibility is a product requirement, not a phase.

- WCAG 2.2 AA minimum; AAA for body text where contrast allows.
- Full keyboard operation, visible focus, skip links and focus restoration.
- Screen reader support (NVDA, VoiceOver, TalkBack) with landmarks and
  `aria-live` for streaming chat and job progress.
- Reflow at 320 CSS px and 400% zoom without horizontal scrolling.
- Fluid type with `clamp()`, container queries and no fixed-width layouts.
- `prefers-reduced-motion`, `prefers-contrast` and `forced-colors` support.
- Captions/transcripts for any generated audio; prompt transcript and alt text
  for every video card.
- Test matrix from 320 px to 3440 px, mobile/tablet/desktop, light/dark/high
  contrast.

Details and tokens are in [design-system.md](./design-system.md).

## 15. Non-goals (MVP)

- Storing image/video/audio bytes in Neon, serverless storage or a CDN.
- Cross-device media byte sync (metadata syncs; media is downloaded per device).
- Revealing plaintext API keys or full DSNs to any UI, including admin.
- Connecting to a primary database without a bootstrap secret (see section 4.6).
- Local inference: Ollama, llama.cpp, WebGPU, WASM models, model downloads or
  any requirement for a client GPU/large RAM.
- Shared runner pool executing OpenCode for untrusted tenants.
- Billing and paid plans.
- Custom domains per tenant.
- Real-time multi-user co-editing.
- Mobile apps.

## 16. Roadmap

1. Scaffold Next.js (JS) + Tailwind v4 + shadcn (`tsx: false`) + design tokens.
2. Neon schema, Better Auth email/password, organization onboarding.
3. Landing page, auth screens and app shell with tenant switcher.
4. Browser store: IndexedDB cache, outbox, OPFS media, export/import.
5. Chats, prompts, agents, skills and contexts (CRUD + search + sync).
6. OpenCode connection, model picker, dispatcher and text-to-video.
7. Image-to-video, video-to-video (canvas keyframes), multimodal.
8. Library, download, remix and cross-device media handoff.
9. Tenant settings, invitations, BYOK/OpenCode connections and quota overrides.
10. Platform admin: user CRUD, per-user/tenant limits, provider credentials,
    database connections, jobs, flags and audit.
11. Accessibility/responsive hardening and e2e tests.

Decisions and trade-offs are recorded in [decisions.md](./decisions.md).
Visual rules are in [design-system.md](./design-system.md). Requirements are in
[requirements.md](./requirements.md).
