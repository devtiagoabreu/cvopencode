# Requirements - Cvopencode

## 1. Vision

Let anyone generate AI videos from a browser using Open/free models, with a
fast, local-first experience. Chats, prompts, agents, skills and contexts sync
across devices through Neon; heavy media stays on the device that downloaded
it.

The product is a multi-tenant web app with a public landing page,
email/password accounts, tenant workspaces and a platform admin area.

## 2. Personas

| Persona | Goal | Pain today |
|---------|------|------------|
| Creator | Turn a prompt or reference clip into a short video | Too many tools, keys and model ids |
| Team lead | Give a small team a shared workspace with roles and reusable agents | Accounts and permissions are scattered |
| Developer | Automate generations, keep prompts and contexts organized | Opaque SaaS, no control over data |
| Platform admin | Operate accounts, tenants and quotas safely | No visibility into access, jobs and abuse |

## 3. Scope and data boundary

**In scope**

- Public landing page and legal pages.
- Email/password registration, verification, login, password reset.
- Organizations (tenants), memberships, roles and invitations.
- Chats, prompts, agents, skills and contexts, synced per tenant.
- Generation studio (text/image/video/multimodal) and local media library.
- OpenCode integration and direct free-tier media providers (credentials
  required for video).
- API keys stored encrypted in Neon, scoped to platform, tenant or user (BYOK).
- Local-first cache, offline reads and write outbox.
- Platform admin for users, tenants, jobs, providers, database connections,
  quotas and flags.
- Accessibility and responsiveness as acceptance criteria.

**Data boundary**

| Data | Where it lives |
|------|----------------|
| Accounts, sessions, organizations, members, invitations | Neon |
| Chats, messages, prompts, generations, agents, skills, contexts | Neon (source of truth) + IndexedDB (cache) |
| Model preferences, usage, audit, quotas | Neon |
| Provider/OpenCode credentials (platform, tenant, user) | Neon, encrypted at rest, write-only |
| Database connection strings and system settings | Neon, encrypted at rest, admin-only |
| Quotas, limits, usage and audit | Neon |
| Images, videos, audio, thumbnails | Browser OPFS only |
| Media metadata (size, dimensions, duration, checksum, provider URL) | Neon |
| Media availability per device | Neon (`asset_device`) |

**Invariant:** no image, video or audio **bytes** are stored in Neon, server
disk, serverless storage or a CDN. Structured AI data is allowed and expected
in the database.

## 4. Functional requirements

Priorities: **M** must (MVP), **S** should, **C** could.

### 4.1 Accounts and authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A1 | Register with name, email and password; password >= 10 chars | M |
| FR-A2 | Verify email before creating a tenant | M |
| FR-A3 | Log in and log out; session persists across reloads | M |
| FR-A4 | Request password reset and set a new password by email | M |
| FR-A5 | Rate-limit login, register and reset attempts | M |
| FR-A6 | Show generic errors that do not reveal whether an email exists | M |
| FR-A7 | Optional OAuth login (GitHub/Google) | C |
| FR-A8 | User can change name/password and delete the account | S |
| FR-A9 | Platform admins can ban/unban users and revoke sessions | S |

### 4.2 Tenants and roles

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-T1 | After verification, create the first organization (name + unique slug) | M |
| FR-T2 | Switch between organizations the user belongs to | M |
| FR-T3 | Invite a member by email with role `owner`/`admin`/`member` | M |
| FR-T4 | Accept an invitation only with the matching signed-in email | M |
| FR-T5 | Owner/admin can change roles and remove members | M |
| FR-T6 | Owner can transfer ownership and delete the organization | S |
| FR-T7 | Every tenant route and action checks membership and role server-side | M |
| FR-T8 | Every business table is scoped by `organization_id` and protected by RLS | M |
| FR-T9 | Reserved slugs are rejected | M |
| FR-T10 | Admin can set per-tenant quotas for generations and storage metadata | S |

### 4.3 Chats and prompts

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-C1 | Create, rename, pin, archive and delete chats | M |
| FR-C2 | Send messages with streaming responses and stop/regenerate | M |
| FR-C3 | Choose model and agent per chat; change mid-conversation | M |
| FR-C4 | Attach local images/videos as transient inputs without uploading them to our storage | M |
| FR-C5 | Full-text search across chats and messages | S |
| FR-C6 | Show token usage and model/provider per message | S |
| FR-C7 | Attach a context collection and show citations | S |
| FR-C8 | Export a chat as Markdown/JSON | S |
| FR-C9 | Share a chat with tenant members (read-only link inside the tenant) | C |
| FR-P1 | Save a prompt from chat or studio to the prompt library | M |
| FR-P2 | Tag, favorite, search and reuse prompts | M |
| FR-P3 | Track prompt usage count and last used | S |
| FR-P4 | Insert a prompt into the studio with one action | M |

### 4.4 Agents and skills

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AG1 | Create/edit/delete tenant agents with name, description and system prompt | M |
| FR-AG2 | Bind a default model, skills and allowed tools to an agent | M |
| FR-AG3 | Set agent visibility: tenant or private | S |
| FR-AG4 | Test an agent in a sandbox chat before saving | S |
| FR-AG5 | Import/export an agent as JSON | C |
| FR-SK1 | List system skills and tenant skills | M |
| FR-SK2 | Create tenant skills with name, version, source and instructions | M |
| FR-SK3 | Enable/disable a skill per tenant and per agent | M |
| FR-SK4 | Show skill provenance and required permissions | S |
| FR-SK5 | Skill execution that touches files or shell requires explicit approval | M |
| FR-SK6 | Import a skill from a URL or Markdown file | C |

### 4.5 Contexts and knowledge

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CTX1 | Create context collections per tenant | M |
| FR-CTX2 | Add text, Markdown and URLs; extract text from PDF/DOCX | S |
| FR-CTX3 | Store extracted text and metadata in Neon; keep original files local | M |
| FR-CTX4 | Chunk documents and retrieve relevant passages for a chat | S |
| FR-CTX5 | Optional embeddings with pgvector | C |
| FR-CTX6 | Show citations with document title and passage | S |
| FR-CTX7 | Delete a context and all derived chunks | M |

### 4.6 Generation studio

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-G1 | Pick a model from the live OpenCode catalog, grouped by provider, with Open/free badges | M |
| FR-G2 | Filter models by video capability and zero cost | M |
| FR-G3 | text-to-video from a prompt | M |
| FR-G4 | image-to-video from a local image + prompt | M |
| FR-G5 | video-to-video using 8 browser-captured keyframes + prompt | S |
| FR-G6 | multimodal input (image + video + prompt) | S |
| FR-G7 | Configure duration, aspect ratio and seed when supported | S |
| FR-G8 | Show job status, progress and actionable errors (rate limit, auth, timeout) | M |
| FR-G9 | Cancel a running job when the provider supports it | S |
| FR-G10 | Fall back to direct free providers when no video model is available | M |
| FR-G11 | Show which path produced the result (`opencode` or `direct`) | S |
| FR-G12 | Continue server-side after the tab closes; reconcile on return | M |
| FR-G13 | Show URL expiry and offer regeneration when the result is gone | S |
| FR-G14 | Record usage and enforce tenant/user quotas server-side | M |
| FR-G15 | Run every model remotely via HTTP; never download weights or require client GPU/WebGPU/WASM/large RAM | M |
| FR-G16 | Build the catalog from OpenCode `/api/model` plus models.dev and provider model endpoints, with aliases, protocols, capabilities, limits, cost, free, privacy and health fields | M |
| FR-G17 | Route free-first: tenant OpenCode gateway, platform free-tier credential, user BYOK, tenant key, platform key, then opt-in paid; never assume a provider is keyless | M |
| FR-G18 | Fall back on `429`/`5xx`/timeout with at most two retries, jitter and `Retry-After`; never fall back silently to paid | M |
| FR-G19 | Reject unsupported model/mode combinations before enqueue, listing supported alternatives | M |
| FR-G20 | Skip unhealthy providers with a circuit breaker and show the chosen path/attempts | S |
| FR-G21 | Stream chat tokens and job events server-side over SSE; the browser never calls providers directly in hosted mode | M |
| FR-G22 | Use remote embeddings/reranking; fall back to Postgres full-text, never a local model | S |
| FR-G23 | Import OpenCode `provider`, `model` and `small_model` ids from `opencode.json` without importing secrets | S |
| FR-G24 | Keyframe extraction is the only local compute; it must work without GPU acceleration | M |
| FR-G25 | Support both synchronous media responses and async submit/poll, normalizing them into one job state machine | M |
| FR-G26 | Show the provider/model, free-tier limits and privacy/retention policy before the first request | M |
| FR-G27 | Return `no_credential` with a settings action when no capable provider has a credential | M |

### 4.7 Local media library

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-L1 | Store image/video/audio bytes in OPFS only | M |
| FR-L2 | List, search and filter generations by mode, provider and status | M |
| FR-L3 | Play, download and delete a local asset | M |
| FR-L4 | Remix a generation (reuse prompt/inputs) | S |
| FR-L5 | Show storage usage and warn at 80% | M |
| FR-L6 | Request persistent storage and show whether it was granted | M |
| FR-L7 | Export/import a ZIP (metadata + media) for backup or device migration | S |
| FR-L8 | Clear local media for one tenant, with confirmation | M |
| FR-L9 | Explain that media is local to the device; metadata syncs | M |
| FR-L10 | On a new device, show "not on this device" and offer download while the URL is valid | M |
| FR-L11 | Pin assets used by chats/prompts and evict unpinned media with LRU | S |
| FR-L12 | Optional passphrase lock for local media | C |

### 4.8 Sync, cache and offline

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SY1 | Serve cached data from IndexedDB before the network | M |
| FR-SY2 | Revalidate in the background and update the UI without a reload | M |
| FR-SY3 | Queue writes in an outbox and replay them when back online | M |
| FR-SY4 | Use idempotency keys and version checks to avoid duplicates/lost updates | M |
| FR-SY5 | Stream chat and job updates over SSE, with polling fallback | M |
| FR-SY6 | Show sync state: salvo, sincronizando, offline, erro | M |
| FR-SY7 | Read cached chats/library/prompts while offline | M |
| FR-SY8 | Register each browser as a device and track media availability | M |
| FR-SY9 | Prefetch likely next routes and the model catalog on idle | S |
| FR-SY10 | Service worker app-shell cache with an offline fallback | S |

### 4.9 Landing page and content

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-M1 | Public landing with hero, product preview, features, modes, privacy and FAQ | M |
| FR-M2 | Clear call to action: create free account / sign in | M |
| FR-M3 | Explain sync vs local media and free-model limits without overpromising | M |
| FR-M4 | Responsive, accessible and SEO-ready (metadata, sitemap, OG image) | M |
| FR-M5 | Terms and privacy pages | M |
| FR-M6 | Pricing page reflecting the free-first model | S |
| FR-M7 | Documentation page for setup and OpenCode connection | S |
| FR-M8 | Light/dark theme with system default | S |

### 4.10 AI credentials, BYOK and limits

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-K1 | Store provider API keys in Neon encrypted with AES-256-GCM, versioned key material and AAD binding id/scope/provider | M |
| FR-K2 | Support credential scopes `platform`, `organization` and `user` for AI providers | M |
| FR-K3 | Resolve credentials user -> organization -> platform per provider, skipping disabled scopes | M |
| FR-K4 | Users can add, replace, test and revoke their own BYOK keys for allowed providers | M |
| FR-K5 | Tenant owner/admin can manage shared tenant keys and see metadata (provider, label, last four, status, last used) | M |
| FR-K6 | Never return a plaintext key to any client, including admin; only metadata and `key_hint` | M |
| FR-K7 | Platform admin can enable/disable BYOK globally and require a user key per provider | M |
| FR-K8 | Restrict each credential to allowed providers and models; reject others server-side | M |
| FR-K9 | Route every generation, chat and proxy call through the resolved credential, decrypted in memory only | M |
| FR-K10 | Attribute usage and cost to `user`, `credential_id` and `credential_scope` | M |
| FR-K11 | Audit credential create/replace/revoke/test and key rotation, with actor and result | M |
| FR-K12 | Support rotating `ENCRYPTION_KEY` with a re-encryption job and old-key fallback during rollout | S |
| FR-K13 | Admin can create, edit and suspend users and tenants; reset password or force sign-out | M |
| FR-K14 | Admin can set limits per platform/tenant/user: generations day/month, tokens/month, cost cents/month, concurrent jobs, requests/minute, output seconds, input bytes, context tokens, credentials and members | M |
| FR-K15 | Limits inherit platform -> tenant -> user; the most specific row wins and `0` blocks the metric | M |
| FR-K16 | Enforce limits before enqueue and in the dispatcher; return `429` with metric, limit, current value and reset time | M |
| FR-K17 | Admin can allowlist providers/models per platform, tenant and user, and block a provider instantly | S |
| FR-K18 | Usage dashboard per user, tenant, provider and model with spend, tokens, errors and top consumers | S |
| FR-K19 | Every limit, policy or credential metadata change requires a reason and is audited | M |
| FR-K20 | Admin can manage database connections: add, test, rotate, deactivate and set `primary` | M |
| FR-K21 | Show masked DSN fields (host, database, user, ssl mode, pool size); never the password or full URL | M |
| FR-K22 | Validate `primary` with `SELECT 1`, schema/version check and typed confirmation before activation; require restart notice | M |
| FR-K23 | Use `DATABASE_URL` only as bootstrap/recovery; a healthy admin-managed `primary` takes precedence on restart | M |
| FR-K24 | Non-admin users and tenant roles cannot read or write system settings or database connections | M |
| FR-K25 | If the active `primary` fails health checks, fail closed; switch to `DATABASE_URL` only through an explicit, audited rollback | M |

### 4.11 Platform admin

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AD1 | `/admin` restricted to `user.role = admin` | M |
| FR-AD2 | List, search, create, edit and suspend users and tenants with pagination | M |
| FR-AD3 | Inspect a tenant's members, invitations, quotas, connections and usage | M |
| FR-AD4 | Ban/unban users, revoke sessions and force sign-out | S |
| FR-AD5 | Inspect generation jobs (status, provider, errors) without media | M |
| FR-AD6 | Manage system skills and feature flags | S |
| FR-AD7 | Audit access to prompts/chats through a time-boxed elevation, if ever allowed | S |
| FR-AD8 | No access to media bytes | M |
| FR-AD9 | Manage provider credentials and BYOK policy without ever seeing plaintext | M |
| FR-AD10 | Manage quotas and limits per tenant and user from the UI | M |
| FR-AD11 | Manage database connections with test, validation and audit | M |

### 4.12 Accessibility and responsiveness

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-X1 | Meet WCAG 2.2 AA; target AAA for body text where feasible | M |
| FR-X2 | Work from 320 px to 3440 px without horizontal scroll | M |
| FR-X3 | 400% zoom and 200% text resize without loss of content | M |
| FR-X4 | Full keyboard operation, visible focus and focus restoration | M |
| FR-X5 | Screen reader support with landmarks, names and live regions | M |
| FR-X6 | Respect reduced motion, high contrast and forced colors | M |
| FR-X7 | Captions/transcripts for audio; alt text and prompt text for videos | M |
| FR-X8 | Touch targets >= 44x44 px; no drag-only interactions | M |
| FR-X9 | Accessible authentication: paste, password managers, no cognitive tests | M |
| FR-X10 | Status messages announced without stealing focus | M |
| FR-X11 | Consistent help, error prevention and reversible destructive actions | S |

### 4.13 Design system

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DS1 | All screens use semantic design tokens, never raw hex values | M |
| FR-DS2 | Geist + Geist Mono loaded through `next/font/google` | M |
| FR-DS3 | Dark and light themes with AA contrast | M |
| FR-DS4 | Reusable primitives for button, input, dialog, table, badge, toast, empty state | M |
| FR-DS5 | Loading, empty, error and offline states for every data surface | M |
| FR-DS6 | Fluid type, container queries and responsive tables | M |
| FR-DS7 | Screens follow the blueprints in [design-system.md](./design-system.md) | S |

## 5. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Landing LCP < 2.0 s on 4G; app INP < 200 ms |
| NFR-2 | Cached route transitions < 150 ms; auth actions p95 < 500 ms |
| NFR-3 | Cache hit ratio > 80% for chats, prompts, agents and catalog reads |
| NFR-4 | Outbox writes sync p95 < 1.5 s online; no data loss offline |
| NFR-5 | 100% of tenant tables protected by repository scoping + RLS |
| NFR-6 | No media bytes in Neon, server disk, logs, Sentry or CDN |
| NFR-7 | Provider/OpenCode keys and database DSNs encrypted at rest, write-only and never serialized to clients |
| NFR-8 | No secret in `NEXT_PUBLIC_*`, URLs, logs, Sentry or exports |
| NFR-17 | 100% of admin credential, quota and database changes audited with actor and reason |
| NFR-18 | Quota enforcement adds < 50 ms p95 to enqueue and fails closed when usage cannot be read |
| NFR-19 | Catalog refresh <= 24 h; stale entries are visibly marked and never silently treated as healthy |
| NFR-9 | CSP with no inline scripts; no third-party scripts on app routes |
| NFR-10 | WCAG 2.2 AA, 320-3440 px, 400% zoom, keyboard and screen reader tested |
| NFR-11 | Client storage failures (quota, private mode) produce clear recovery guidance |
| NFR-12 | pt-BR default UI, English secondary; all strings externalized |
| NFR-13 | SEO: unique titles, meta description, sitemap, robots, OG image |
| NFR-14 | Retention: soft delete 30 days; raw usage pruned after 90 days |
| NFR-15 | Dependency and CSP changes reviewed for supply-chain risk |
| NFR-16 | Free-tier quotas and provider rate limits degrade gracefully |

## 6. MVP acceptance criteria

1. A new user registers, verifies email, creates a tenant and reaches the
   dashboard.
2. The user creates a chat, saves a prompt, creates an agent, enables a skill
   and adds a context; all of it appears on a second browser after login.
3. The user generates a video from a prompt using at least one OpenCode model
   and one configured free-tier provider; job state syncs across devices.
4. Media plays from OPFS after reload and after signing out/in on the same
   browser; the second browser shows metadata and a download action, not bytes.
5. The job continues server-side when the tab closes and is visible on return.
6. An invited member can chat and generate but cannot invite, remove members or
   edit connections.
7. A platform admin can find the tenant and its jobs but cannot open media or
   read prompts.
8. A user adds a personal provider key; it appears as metadata on a second
   device, generates successfully, and the plaintext key never appears in any
   response, log or browser storage.
9. An admin sets 2 generations/day for a user; the third returns `429` with the
   limit and reset time; raising the limit to 10 unlocks the next request; both
   changes are audited.
10. An admin saves an invalid primary DSN: validation fails, the current
    connection stays active and no secret is returned. After a valid DSN is
    activated and the app restarts, it is used; env remains the recovery path.
11. Offline, the app opens from cache, shows library metadata and queues a
    prompt edit; the edit syncs when back online.
12. 320 px, 768 px, 1440 px and 3440 px layouts pass without horizontal scroll;
    400% zoom passes; keyboard-only flow completes registration and generation.
13. Lighthouse accessibility >= 95 on landing, login, chat and studio; axe has
    no critical/serious issues.
14. No media bytes, plaintext secrets or prompt text appear in Neon storage
    paths, server logs or Sentry.
15. With only free-tier credentials configured, generation never falls back to
    a paid model; the UI shows the selected provider/model and the path used.
16. With no capable credential configured, video generation ends with
    `no_credential` and a settings link, not a generic provider failure.

## 7. Out of scope

- Storing media bytes in Neon, server disk, object storage or a CDN.
- Revealing plaintext API keys or full DSNs to any UI, including admin.
- Cross-device media byte sync.
- Shared OpenCode runner for untrusted tenants.
- Billing, invoices and paid plans.
- Custom domains, white label and public API.
- Real-time multi-user co-editing.
- Mobile apps and desktop wrappers.

## 8. Open questions

1. Should media sync across devices become an opt-in paid feature later? It
   would require a new ADR and explicit consent.
2. How long should chats and prompts be retained by default? Current proposal:
   keep until deleted; prune raw usage after 90 days.
3. Which embedding provider is acceptable for contexts, and is pgvector needed
   in the MVP or only after launch?
4. Provider output URLs expire. Is regeneration acceptable, or should users be
   prompted to download immediately?
5. Should RLS ship in the first migration or be enabled table by table?
6. Is a PWA install part of the MVP for offline library access?
7. Which free providers are allowed by their terms for commercial use?
8. Do user BYOK calls consume the tenant quota, a separate user quota, or both?
   Current proposal: both, with separate counters.
9. Should changing the `primary` DSN require two-admin approval in hosted mode?

## 9. Success metrics

- Activation: % of verified users who create a tenant and finish one video.
- Generation success rate per provider and p95 time to first playable result.
- Cache hit ratio and outbox sync success rate.
- 7-day retention of users who generated at least one video.
- Media download success rate per device and URL-expiry recovery rate.
- Accessibility defects per release (target: zero critical/serious).
- Auth conversion (register -> verified -> first generation).
