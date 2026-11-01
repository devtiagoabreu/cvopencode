# OpenCode and Free Inference - Research

How OpenCode resolves models and providers, which free or free-tier
inference paths are currently usable, and what `cvopencode` should copy.
Primary sources verified on **2026-10-20**.

## 1. What OpenCode actually does

OpenCode is a client/orchestrator, not a model vendor. Its relevant
building blocks are:

| Layer | Responsibility |
|-------|----------------|
| Provider registry | Knows providers, auth, endpoints and model ids |
| Models.dev catalog | Supplies model metadata (provider, context, modalities, cost) |
| AI SDK | Normalizes chat/streaming calls across provider protocols |
| `provider/model` id | Stable selection key used by config, sessions and API |
| `small_model` | Cheaper model for titles, summaries and small tasks |
| Auth | Credentials resolved server-side, per provider |
| HTTP API | Sessions, prompts, SSE events, model/agent selection |

Configuration exposes `model`, `small_model`, provider options, timeouts and
provider enable/disable rules. Model discovery is live, so the application
must not hardcode today's free list.

OpenCode currently documents two different things that are easy to confuse:

- **OpenCode server**: runtime/API used to run sessions and prompts.
- **OpenCode Zen**: an inference gateway provider, addressed as
  `opencode/<model>` inside OpenCode.

`cvopencode` uses both: the server as orchestrator and Zen as one provider.

## 2. OpenCode Zen

### Endpoints

Zen exposes protocol-specific endpoints under `https://opencode.ai/inference`,
not a single `/zen/v1` endpoint:

| Model family | Endpoint |
|--------------|----------|
| GPT | `https://opencode.ai/inference/openai/v1/responses` |
| Claude / Qwen | `https://opencode.ai/inference/anthropic/v1/messages` |
| Gemini | `https://opencode.ai/inference/google/v1beta/models/{model}` |
| Compatible models | `https://opencode.ai/inference/openai/v1/chat/completions` |
| SystemOne | `https://opencode.ai/inference/systemone/v1/systemone` |

The model list is `GET https://opencode.ai/inference/v1/models`.

### Credentials and free models

The current docs require an API key created in the OpenCode Console and
mention purchased credits, even though several models are listed as free for
a limited time. The docs do **not** document keyless access.

Older community projects describe `Bearer public` with no key. That claim is
unsupported by the current official docs and must not be used as a product
assumption. Treat Zen as a **free-tier gateway that still needs a platform
credential**.

Free models observed in the catalog include `big-pickle`, GLM, DeepSeek,
MiniMax, Nemotron, MiMo and other `*-free` variants. Availability changes
without notice.

### Privacy

Zen documents per-model data policies. Some free models may train on
requests; others are zero-retention. The UI must display the selected model's
policy before sending user content.

## 3. Models.dev catalog

Models.dev is the open catalog OpenCode uses. It is metadata only; it does
not run inference.

- Source: `https://github.com/sst/models.dev`
- Site/API: `https://models.dev`
- Machine-readable catalog: `https://models.dev/api.json`
- Schema: `https://models.dev/model-schema.json`

The catalog is large (the full `api.json` exceeds 5 MB), so the app must
fetch, cache and project only the fields it needs. The upstream schema is
authoritative; `cvopencode` should keep a normalized internal record and
refresh it on a TTL.

Fields useful to the model picker and router:

- provider, lab, model id and aliases
- display name and release/update dates
- context and output limits
- input/output modalities
- reasoning, tool calling, structured output, temperature support
- cost (including zero-cost/free detection)
- attachment support and open weights
- provider-specific endpoint/protocol hints

Do not infer "free" from a name alone. Use catalog price plus the provider's
live model endpoint, and keep a manual allow/deny override for promotions.

## 4. Direct free or free-tier providers

### 4.1 Pollinations

Pollinations has two surfaces:

| Surface | Base | Auth | Use |
|---------|------|------|-----|
| Classic | `text.pollinations.ai`, `image.pollinations.ai` | Keyless | Small text/image demo only |
| Unified | `https://gen.pollinations.ai` | Secret key `sk_...` | Text, image, video, audio, 3D, embeddings |

Unified API is OpenAI-compatible for chat (`/v1/chat/completions`,
`/v1/responses`, `/v1/messages`) and exposes native generation routes such as
`GET /image/{prompt}`, `GET /video/{prompt}`, `GET /audio/{text}` and
`GET /3d/{prompt}`.

Model discovery is public: `GET /models`, `GET /v1/models`,
`GET /text/models`, `GET /video/models`. Records include model ids and
aliases, supported endpoints, input modalities, health, per-user RPM,
duration/resolution limits and reference-image limits.

Video behavior:

- Default is synchronous: the request returns an MP4.
- `Prefer: respond-async` returns `202` with `Location` and `Retry-After`.
- Poll `GET /v1/jobs/{id}`, then fetch `GET /v1/jobs/{id}/result`.
- Jobs expire after 24 hours; cached results can return immediately.

Classic limits are strict and per IP: one image request per 45 seconds and
one text request per 30 seconds, with `402` plus `Retry-After` when exceeded.
Classic has no video. Unified generation consumes Pollen credits; free Pollen
is available through the provider's quests.

### 4.2 Agnes

Current video model: **`agnes-video-2.5-flash`**.

| Item | Value |
|------|-------|
| Base | `https://apihub.agnes-ai.com/v1` |
| Create | `POST /videos` |
| Poll | `GET /agnesapi?video_id=<id>&model_name=agnes-video-2.5-flash` |
| Price | Promotional `$0/s` |
| Size | `"720P"` only |
| Duration | Seconds as a string, roughly 4-12 |
| Inputs | Up to 5 images, up to 3 audios |
| Not supported | Video input |
| Modes | Text, keyframes, reference-to-video |

Generation is asynchronous: create, poll every 1-2 seconds, then download the
returned URL. Invalid inputs return `400` with a validation message.

### 4.3 OpenRouter Free Router

OpenRouter exposes `openrouter/free`: it selects a random model that supports
the requested capabilities and is currently free, and returns the chosen
model in the response's `model` field.

Use `:free` on a specific model id when the user pins a model. The free pool
changes frequently, so treat a pinned free model as best-effort.

Documented free-tier limits:

- Fewer than 10 credits: 20 requests/minute and 50 requests/day.
- At least 10 credits: 20 requests/minute and 1,000 requests/day.
- Credit count can lag; an account near the threshold may still see the lower
  cap for a short period.
- `429` includes rate-limit headers and usually `Retry-After`.
- `402` means payment required; `403` means the key or model is not allowed.

OpenRouter is text/multimodal-chat oriented for this project. It is not the
video path.

### 4.4 Provider comparison

| Provider | Video | Auth for production | Job model | Best role |
|----------|-------|---------------------|-----------|-----------|
| OpenCode Zen | No (text models) | Platform/tenant key | Streaming chat | Primary OpenCode gateway |
| Pollinations | Yes | `sk_` key | Sync or async | Free-first video/image |
| Agnes 2.5 Flash | Yes | API key | Submit + poll | Free-tier video fallback |
| OpenRouter | No | API key | Streaming chat | Free text fallback |

## 5. Adapter contract for cvopencode

Every provider adapter implements the same server-side interface:

```ts
type Adapter = {
  listModels(): Promise<ModelRecord[]>;
  health(): Promise<Health>;
  chatStream(input: ChatInput): AsyncIterable<ChatEvent>;
  generateMedia?(input: MediaInput): Promise<MediaResult>;
  submit?(input: MediaInput): Promise<JobHandle>;
  poll?(job: JobHandle): Promise<JobStatus>;
  cancel?(job: JobHandle): Promise<void>;
  estimateCost?(input: ModelInput): Promise<CostEstimate>;
};
```

Rules:

- Declare capabilities before routing; never discover "no video support" by
  failing mid-job.
- Normalize both `sync` and `async` media into the same job state machine.
- Normalize provider model ids and keep `provider`, `model` and `alias`
  separately.
- Keep credentials server-side; adapters never receive browser secrets.
- Classify errors: `no_credential`, `unsupported_capability`,
  `rate_limited`, `quota_exceeded`, `payment_required`, `provider_error`,
  `timeout`, `cancelled`.
- Retry only `429`, `5xx` and network errors, at most twice, with jitter and
  `Retry-After`.
- Never fall back to a paid model unless the tenant explicitly opted in.

## 6. Routing implications

The free-first chain becomes:

1. Tenant OpenCode gateway (if configured).
2. Platform free-tier key: Zen, Pollinations, Agnes or OpenRouter.
3. User BYOK free-tier key.
4. Tenant key.
5. Platform paid key.
6. Paid fallback only with explicit opt-in.

This replaces the earlier "keyless free gateway" assumption. Keyless
Pollinations Classic is a demo path for text/image only; it cannot satisfy
the video requirement. Zen requires a credential. A tenant without any key
must see an actionable `no_credential` state, not a failed generation.

For long video jobs, prefer async where the provider supports it
(Pollinations `Prefer: respond-async`, Agnes submit/poll). Synchronous
generation is still allowed for short clips and for providers without jobs.

## 7. Corrections to earlier research

| Earlier claim | Current finding |
|---------------|-----------------|
| Zen uses one `https://opencode.ai/zen/v1` endpoint | Per-protocol endpoints under `https://opencode.ai/inference/...` |
| Zen is keyless with `Bearer public` | Official docs require an API key; keyless is unverified |
| Pollinations video is always submit/poll | Default is synchronous MP4; async is opt-in |
| Pollinations is entirely keyless | Only Classic text/image is keyless; unified generation needs `sk_` |
| Agnes uses `agnes-video-v2.0` | Current model is `agnes-video-2.5-flash` |
| All video APIs are asynchronous | Pollinations defaults to sync; Agnes is async |
| models.dev is `anomalyco/models.dev` | Catalog source is `sst/models.dev` |
| Keyless generation exists only on Classic (`image.pollinations.ai`) | Verified 2026-11-01: `gen.pollinations.ai/image/{prompt}` also answers keyless (200, `image/jpeg`), watermarked and throttled; see [implementation-readiness.md](./implementation-readiness.md) |

## 8. Decisions this research supports

- Remote-only inference; no local GPU, weights or browser inference.
- Live catalog with models.dev-compatible metadata; never hardcode free ids.
- Provider adapters with capability preflight and sync/async normalization.
- Free-first routing, but free tiers still require credentials in production.
- Per-model privacy/retention disclosure in the model picker.
- Paid fallback is opt-in and always visible.

## References

- [OpenCode Zen](https://opencode.ai/docs/zen)
- [OpenCode models](https://opencode.ai/docs/models)
- [OpenCode config](https://opencode.ai/docs/config)
- [Models.dev](https://models.dev)
- [Models.dev source](https://github.com/sst/models.dev)
- [OpenRouter Free Router](https://openrouter.ai/docs/guides/routing/routers/free-router)
- [OpenRouter limits](https://openrouter.ai/docs/api-reference/limits)
- [Pollinations API docs](https://raw.githubusercontent.com/pollinations/pollinations/master/APIDOCS.md)
- [Pollinations unified docs](https://gen.pollinations.ai/docs)
- [Agnes Video 2.5 Flash](https://wiki.agnes-ai.com/en/docs/agnes-video-25-flash)
