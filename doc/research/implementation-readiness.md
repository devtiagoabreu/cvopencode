# Implementation Readiness - Research

Deep dive into the four unknowns that block the first sprint: keyless image
generation, auth on Neon, browser media storage and in-browser video assembly.
Live checks performed on **2026-11-01**; browser and provider claims verified
against current documentation on the same date.

## 1. Keyless image generation (verified live)

Two Pollinations surfaces were probed with `HEAD` requests, no credentials:

| URL | Result |
|-----|--------|
| `https://gen.pollinations.ai/image/a%20cat?model=flux` | `200`, `image/jpeg` |
| `https://image.pollinations.ai/prompt/a%20cat?model=flux&nologo=true` | `200`, `image/jpeg` |

So the keyless image path is real today, but three caveats apply:

1. Pollinations' own API reference says "all generation requests require an API
   key"; the keyless image route is an exception that the provider documents in
   its agent skill and still serves. It can be removed without notice.
2. The anonymous tier is throttled (recent reports: about one request per 15 s;
   older docs said 45 s) and stamps a watermark. Registering the key at
   `enter.pollinations.ai` removes the watermark and raises the limits.
3. Browser callers can pass `referrer=<app>` instead of a token, but that is
   attribution, not authorization.

Keys come in two flavours: `sk_` (secret, server-side only) and `pk_` (public,
browser-side). Frontends that need user-authorized generation are expected to
use the BYOP OAuth 2.0 authorization-code flow with PKCE to obtain a temporary
`sk_`; the device flow and fragment redirect remain supported.

**Implication for cvopencode:** keep the keyless path strictly as a demo for
image, behind a visible "demo / watermarked / rate-limited" badge. Anything
durable (video, batches, no watermark) goes through a tenant or platform key.
This confirms ADR-019 rather than changing it.

## 2. Authentication on Neon

Two viable shapes exist today, and the current ADR-004 picks the second:

| Shape | What it is | Pros | Cons |
|-------|------------|------|------|
| Neon Managed Better Auth | Managed service built on Better Auth, data in the `neon_auth` schema, branches with the database | No auth server code, branch-aware previews, RLS-compatible, JWT for the Data API | AWS regions only, less control over organization roles and invitation flows, vendor lock-in |
| Self-hosted Better Auth + Drizzle | Library mounted in Next.js route handlers, tables in the app schema | Full control of `organization`, `admin`, invitations, rate limits; same database and migrations | You operate it; JWT/Data API integration is manual |

RLS works with both, but the mechanics differ:

- **Data API / JWT path:** policies use `auth.user_id()` and the caller sends a
  JWT; GRANT plus RLS is the entire permission model, so a missing policy is an
  outage or a leak, not a bug.
- **Server-side SQL path (current design):** the app connects with a role that
  has policies bound to `current_setting('app.tenant_id')`; every request must
  run `SET LOCAL app.tenant_id = ...` inside the same transaction. With pooled
  connections, a session-level `SET` leaks across requests; `SET LOCAL` inside a
  transaction is mandatory.

**Recommendation:** keep ADR-004. Self-hosted Better Auth keeps organization
roles, invitations and admin metadata in one schema with one migration story,
which the product needs. Record Managed Better Auth as the documented
alternative for teams that want zero auth code. When implementing, wrap every
tenant query in a transaction that sets `app.tenant_id` locally, and keep the
`organization` plugin as the single source of tenant membership.

## 3. Browser media storage (OPFS)

### Support

OPFS is Baseline-wide available: Chrome/Edge 86+, Firefox 111+, Safari 15.2+
(March 2023). Synchronous access handles are worker-only; the main thread uses
async handles. No permission prompt is required.

### Quotas and eviction (this is the real risk)

| Browser | Behaviour |
|---------|-----------|
| Chromium | Origin can use up to ~60% of total disk; `persist()` usually granted |
| Firefox | Origin-group quota; large archives effectively capped near 10 GB unless `navigator.storage.persist()` is granted |
| Safari | Starts with a quota pool and prompts the user to expand storage in chunks |

Storage is **best-effort** by default. It is evicted under disk pressure, in
private windows, or when the user clears site data. `navigator.storage.persist()`
is a request, not a guarantee, and returns a boolean that must be surfaced.
`navigator.storage.estimate()` is an estimate and can change between calls.

### Consequences for the media library

1. Never present OPFS as durable backup. Show "this device only" plus a
   download/export affordance and a storage-meter with actual usage.
2. Ask for persistence once, explain the outcome, and degrade gracefully when
   it is denied.
3. Write large blobs through a worker with the sync access handle, in chunks,
   and handle `QuotaExceededError` by keeping the user's inputs and offering a
   retry after cleanup.
4. Two tabs can hold handles to the same file. Use an app-level lock plus a
   revision per asset; treat interrupted writes as `unknown` and recover.
5. Keep one asset per file under `/<userId>/<orgId>/<assetId>.<ext>`; never
   store blobs in IndexedDB or `localStorage`.

## 4. In-browser video assembly

The 2026 consensus is inverted from the earlier plan: **WebCodecs is the
default, `ffmpeg.wasm` is the fallback**.

| Criterion | WebCodecs + muxer | ffmpeg.wasm |
|-----------|-------------------|-------------|
| Encode path | Browser hardware encoder | CPU inside WASM |
| 1080p transcode speed | Seconds | Tens of seconds to minutes (10x slower is the common report) |
| Download cost | 0 (built in) | 20-30 MB core, re-fetched per context |
| Memory | Frame-by-frame, low | Full decode buffers, high |
| Filters and exotic containers | Not its job | Full FFmpeg filter set and demuxers |
| Threading | N/A | Single-thread unless COOP/COEP headers are set |

Support: Chrome/Edge 94+, Firefox 130+ (desktop; Android lags), Safari 16.4+
partial (video only; audio codecs landed later, full support in Safari 26.1).

Practical rules:

- Use `VideoEncoder`/`VideoDecoder` plus a muxer — **Mediabunny** (successor of
  `mp4-muxer`) — to stitch generated clips and produce the final MP4.
- `VideoFrame` timestamps are **microseconds**, not milliseconds. This is the
  most common bug in WebCodecs pipelines.
- Feature-detect `VideoEncoder` for H.264 and fall back to `ffmpeg.wasm` only
  when the browser cannot encode, or when a filter/container is required.
- Do not chain MediaRecorder + `ffmpeg.wasm` transcodes; each lossy pass
  compounds and doubles the work.
- Keep assembly in a worker and stream frames from OPFS to avoid holding whole
  clips in memory.

## 5. Gaps this closes in the current docs

| Existing statement | Refinement |
|--------------------|------------|
| "Pollinations Classic keyless is text/image only, 1 req/45 s" | Keyless image also works on `gen.pollinations.ai/image/{prompt}`; throttle is now ~15 s and output is watermarked |
| "Self-hosted Better Auth" | Still correct; add Managed Better Auth as a documented alternative and `SET LOCAL app.tenant_id` as the RLS mechanism |
| "Ask for `navigator.storage.persist()`" | Add per-browser quota behaviour, eviction risk and export-first UX |
| No video assembly decision | Proposed: WebCodecs + Mediabunny primary, `ffmpeg.wasm` fallback (new ADR) |

## 6. Proposed decisions (not yet recorded)

- **ADR-021 — Assemble video with WebCodecs + Mediabunny.** Hardware encode,
  no 25 MB download, works in all current desktop browsers; `ffmpeg.wasm`
  loaded on demand only for filters or unsupported containers.
- **ADR-022 — Keep self-hosted Better Auth, document Managed Better Auth.**
  Tenancy stays in the `organization` schema; `SET LOCAL app.tenant_id` inside
  every transaction is the RLS contract.

## 7. Open questions now answered

| Question | Answer |
|----------|--------|
| Can we ship a keyless image demo? | Yes, watermarked and throttled; demo only |
| Is RLS feasible with Better Auth? | Yes, via JWT (`auth.user_id()`) or transaction-local `app.tenant_id` |
| Is OPFS safe as the only copy? | No; evictable. Export and regenerate must always be offered |
| Is `ffmpeg.wasm` required for stitching? | No; WebCodecs + muxer is the default in 2026 |

## References

- [Pollinations API reference](https://enter.pollinations.ai/api/docs)
- [Pollinations agent skill (keyless image)](https://gen.pollinations.ai/.well-known/agent-skills/pollinations-api/SKILL.md)
- [Pollinations APIDOCS](https://github.com/pollinations/pollinations/blob/main/APIDOCS.md)
- [Neon Managed Better Auth](https://neon.com/docs/auth/about)
- [Neon RLS for multi-tenant apps](https://neon.com/guides/rls-multi-tenant-apps)
- [Neon Data API access control](https://neon.com/docs/data-api/access-control)
- [OPFS on web.dev](https://web.dev/articles/origin-private-file-system)
- [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [WebCodecs browser support](https://caniuse.com/webcodecs)
- [Mediabunny](https://mediabunny.dev)
