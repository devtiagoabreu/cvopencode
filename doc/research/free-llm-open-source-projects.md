# Free Online LLM/Media Projects - Research

Survey of open-source projects that rely on **free online** LLM, image and
video APIs (free tiers, no credit card, or keyless endpoints). Goal: reuse
their patterns for `cvopencode`.

## 1. Free LLM gateways and routers

Projects that aggregate several free provider keys behind one
OpenAI-compatible endpoint with fallback and rate-limit handling.

| Project | Stack | Free providers | What to reuse |
|---------|-------|----------------|---------------|
| [freellmapi](https://github.com/tashfeenahmed/freellmapi) | Self-hosted gateway | 34 providers, 635 free endpoints | Provider catalog, encrypted keys, per-key quota tracking, router with failover |
| [free-llm-proxy-router](https://github.com/kaiser-data/free-llm-proxy-router) | Proxy (OpenAI-compatible) | Groq, Gemini, OpenRouter, GitHub Models, Cerebras, Mistral, HuggingFace | 13 routing strategies, model auto-discovery, 429 cooldown |
| [free-llm-api-stack](https://github.com/dklymentiev/free-llm-api-stack) | Zero-dependency Python | Groq, Cerebras, Gemini, OpenRouter, NIM, Mistral, Cohere, HF | `providers.json` as single source of truth |
| [freelm](https://github.com/shihabshahrier/freelm) | Python + Node library | Gemini, Groq, OpenRouter, Cloudflare, Z.ai, Cohere, Mistral, NIM, Kilo | Keyless fallbacks, provider racing, live model discovery |
| [litellm-free-models-proxy](https://github.com/tomaasz/litellm-free-models-proxy) | LiteLLM + Postgres | Same set, auto-discovered every 8h | Free-model detection rules (`pricing == 0`, `-Free` suffix) |
| [free-llm-gateway](https://github.com/malda231125/free-llm-gateway) | Python gateway | Gemini, Groq, Cerebras, NIM, Mistral, OpenRouter, GitHub | Prompt-aware routing (LLM picks the model), quota persistence |
| [tokensforthepeople](https://github.com/AleDeclerk/tokensforthepeople) | Go CLI | Gemini, OpenRouter, Groq, Ollama Cloud, Cerebras, Mistral, NIM, GitHub, Z.ai | Wizard that validates keys and emits configs |
| [zen-proxy](https://github.com/12errh/zen-proxy) | Node proxy | OpenCode Zen free models (platform key) | Alias layer, fallback chain, catalog refresh from models.dev |
| [n8n-nodes-panda-free-llm](https://github.com/GreatPandetta/n8n-nodes-panda-free-llm) | n8n community node | Groq, Cerebras, Gemini, OpenRouter, Mistral | Sequential failover on empty/429/timeout |

## 2. Curated catalogs (data sources)

Useful as machine-readable sources for a model picker instead of hardcoding
free models.

| Project | Size | Notes |
|---------|------|-------|
| [free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources) | ~13 providers | The reference list cited by most gateways; excludes ToS-violating proxies |
| [awesome-freellm-apis](https://github.com/open-free-llm-api/awesome-freellm-apis) | 511+ APIs / 30 providers | Daily refresh, credit-card transparency, config snippets for agents |
| [awesome-free-llm-apis](https://github.com/mnfst/awesome-free-llm-apis) | Permanent free tiers | OpenAI SDK compatibility, rate limits per model |
| [Free-LLM](https://github.com/nejib1/Free-LLM) | 210+ models / 47 providers | Planned limits, local/self-hosted section |
| [awesome-free-inference](https://github.com/bradAGI/awesome-free-inference) | 20+ providers | "Best provider by use case" matrix, verified limits |
| [awesome-free-ai-api](https://github.com/yoanndev90/awesome-free-ai-api) | 80+ APIs | Weekly probe status per provider |
| [free-llm-atlas](https://github.com/happyyboxx/free-llm-atlas) | 48 providers | Structured JSON + generated LiteLLM/Portkey/Open WebUI configs |

## 3. Free video generation (most relevant to this project)

| Project | Stack | Free media source | Capabilities |
|---------|-------|-------------------|--------------|
| [Agnes Video Generator](https://github.com/lcy362/agnes-video-generator) | Python + Web UI (MIT) | Agnes AI free API, no GPU, rate-limited | Text-to-video, image-to-video, keyframes, TTS narration, word-level SRT, multi-scene |
| [free-short-video-studio](https://github.com/lcy362/free-short-video-studio) | Browser / TypeScript | Agnes AI | Browser-only, no install, scenes + stitch |
| [vimax-agnes](https://github.com/lcy362/vimax-agnes) | Python agentic pipeline | Agnes AI free API | Idea -> story -> character reference -> scenes -> final video |
| [AngeMedia Gateway](https://github.com/ang77712829/image-proxy-gateway) | Self-hosted gateway | Agnes Video, Pollinations, ModelScope, SiliconFlow | `POST /v1/videos` + polling, image-to-video, keyframes, queue |
| [Pollinations](https://github.com/pollinations/pollinations) | Unified API + SDK + MCP | Free tier / Pollen credits | Text, image, video (`veo-3.1-fast`, `seedance-2.0`, `wan-3.0`, `minimax-h3`, `kling-v3`), audio |
| [FreeVideo](https://github.com/FlashML-org/FreeVideo) | ComfyUI plugin (Apache-2.0) | Local, 8 GB VRAM | MiniMax H3 local, text/image/video/audio refs |
| [WanGP](https://github.com/deepbeepmeep/WanGP) | Web UI + API | Local, 6 GB VRAM | Wan, LTX, Hunyuan, MiniMax, audio/TTS |
| [FastVideo](https://github.com/hao-ai-lab/fastvideo) | Inference framework | Local GPU/Apple Silicon | Distilled H3, LTX, Kandinsky, realtime editing |
| [OpenVideo](https://github.com/open-video-ai/open-video) | CLI + ComfyUI | Local GPU | "Ollama for video", agent skill for coding agents |
| [LTX-Video](https://github.com/Lightricks/LTX-Video) | Python | Local + hosted (fal, Replicate) | I2V, keyframes, extension, V2V, 4K with audio |

### Direct API notes

- **Pollinations**: `https://gen.pollinations.ai/video/{prompt}` returns MP4
  synchronously and accepts `model`, `duration`, `aspectRatio`, `image[]`
  (start/end frame), `reference_images`, `reference_videos`,
  `reference_audios`. Send `Prefer: respond-async` to receive `202` plus a
  job id, then poll `/v1/jobs/{id}`. Unified generation needs an `sk_` key.
  The classic endpoint (`text.pollinations.ai`, image URL) is keyless but
  limited to text/image (1 request per 30 s / 45 s per IP).
- **Agnes AI**: `agnes-video-2.5-flash`, free-tier pricing and no GPU.
  Create with `POST /v1/videos`, then poll
  `/v1/agnesapi?video_id=<id>&model_name=agnes-video-2.5-flash`. Supports up
  to 5 images and 3 audios, no video input, `720P` output.

## 4. Provider-agnostic UIs (model picker patterns)

| Project | Stack | Relevant pattern |
|---------|-------|------------------|
| [LibreChat](https://github.com/LibreChat-AI/LibreChat) | React + Node (MIT) | Presets, side-by-side comparison, custom OpenAI-compatible endpoints |
| [Open WebUI](https://github.com/open-webui/open-webui) | Svelte + Python | Connections UI, per-model overrides, RBAC, multi-model chats |
| [Open-Fiesta](https://github.com/NiladriHazra/Open-Fiesta) | Next.js + Supabase | Free-model catalog, per-provider API routes, Ollama custom models |
| [OpenChat](https://github.com/openchatui/openchat) | Next.js + Prisma | Chat + image + video (Sora 2) + voice in one UI |
| [Multi-Backend Chatbot](https://github.com/M-F-Tushar/Multi-Backend-Chatbot-with-Gradio) | Gradio | Model validation script that probes every free model |
| [Iara](https://github.com/felipefernandes/iara) | Python CLI/CI | OpenRouter free models with automatic fallback |

## 5. OpenCode-native / agent-oriented

| Project | Pattern |
|---------|---------|
| [OpenCode Zen](https://opencode.ai/docs/zen/) | Official gateway; free models (`big-pickle`, `*-free`) with a Console API key; per-protocol endpoints under `https://opencode.ai/inference` |
| [pi-ext-opencode-zen](https://github.com/Karrq/pi-ext-opencode-zen) | Validates free models live via `/v1/models` + models.dev metadata |
| [triss-coworker](https://github.com/ayleen/triss-coworker) | Never pins a stale free model: fetches the live catalog, falls back safely |
| [LemonCrow](https://github.com/lemoncrow-lab/lemoncrow) | Older projects assumed a keyless Zen tier; official docs now require a key |
| [Relay](https://github.com/orhanucok/relay) | MCP that delegates work to free providers to save paid tokens |
| [Zhenyi](https://github.com/ShamalLakshan/Zhenyi) | Multi-provider pool with circuit breaker and free-tier-only policy |
| [Agnes agent-ready](https://github.com/lcy362/agnes-video-generator) | Ships `AGENTS.md` + skills so a coding agent installs and runs it |

## 6. Patterns worth adopting

1. **Live catalog, never hardcoded free models.** Free tiers rotate weekly
   (see `triss-coworker`, `pi-ext-opencode-zen`, `freellm`). Query
   `/v1/models` and filter by `pricing == 0`, then cache with TTL.
2. **Provider abstraction + ordered fallback.** One adapter per provider,
   automatic 429 cooldown, skip empty responses.
3. **Credential-aware first run.** Pollinations Classic is keyless but
   text/image only. Zen requires a key. Offer a keyless image/text demo and
   an actionable `no_credential` state for video.
4. **Normalize sync and async video.** Pollinations returns MP4 by default
   and supports `Prefer: respond-async`; Agnes always uses submit -> poll.
   Model both behind one job state machine with resumable checkpoints.
5. **Reference media by URL.** Pollinations and AngeMedia accept public
   URLs for start/end frames and reference videos, avoiding large uploads.
6. **Be explicit about limits.** Surface per-provider quota and the fact that
   free models may train on data (Zen and OpenRouter differ per model).

## 7. Implications for cvopencode

- OpenCode remains the orchestrator, but **free media providers can be called
  directly** (`gen.pollinations.ai`, Agnes AI) when the selected OpenCode model
  cannot generate video.
- A `free-model` adapter should read the live OpenCode catalog
  (`GET /api/model`, `GET /api/provider`) plus models.dev metadata and flag
  zero-cost models, mirroring what the gateways above do.
- The video pipeline can be modeled after Agnes/AngeMedia: one job per scene,
  persistent job state, then stitching (already planned for keyframes).
- Add a keyless image/text demo using Pollinations Classic only. Video and
  Zen always require a configured credential.
- Show provider/model, privacy policy and free-tier limits before generation;
  never silently fall back to a paid model.

## References

- [free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)
- [OpenCode Zen docs](https://opencode.ai/docs/zen/)
- [Models.dev](https://models.dev)
- [OpenRouter Free Router](https://openrouter.ai/docs/guides/routing/routers/free-router)
- [Pollinations API docs](https://github.com/pollinations/pollinations/blob/main/APIDOCS.md)
- [Pollinations unified docs](https://gen.pollinations.ai/docs)
- [Agnes Video Generator](https://github.com/lcy362/agnes-video-generator)
- [Agnes Video 2.5 Flash](https://wiki.agnes-ai.com/en/docs/agnes-video-25-flash)
- [Detailed inference notes](./opencode-free-inference.md)
