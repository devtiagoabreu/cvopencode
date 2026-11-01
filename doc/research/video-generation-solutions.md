# AI Video Generation Solutions - Research

Survey of existing repositories and projects that already implement (or
strongly inspire) an "AI video generation" frontend, including solutions that
integrate with OpenCode agents and skills.

## Summary

| # | Repository | Stack | Video providers / models | Capabilities | Notes |
|---|-----------|-------|--------------------------|--------------|-------|
| 1 | [BlueFish](https://github.com/bluefish2026/BlueFish) | React (Vite) + FastAPI | Kling, Seedance, Runway, Vidu, DashScope, Replicate, Google Veo | Storyboard (T2I / I2I / frame-to-frame), character and scene management, script and dialogue, TTS, video editing | Self-hostable, Docker Compose, zero-config persistence, WebSocket progress, provider adapter pattern, mock mode |
| 2 | [MediaRouter](https://github.com/samagra14/mediagateway) | FastAPI + React | OpenAI Sora (Sora 2 / Sora 1, synced audio), Runway (Gen-3 / Gen-4), Kling (v1.5 / v1.0) | Playground (prompt, model, duration, aspect ratio, seed), cost tracking, gallery, OpenAI-compatible API, BYOK | Sora pricing around USD 0.10/sec |
| 3 | [Sora 2 Playground](https://github.com/amirzak/sora2-playground) | Next.js 15 + TS + Tailwind | OpenAI Sora 2 / Sora 2 Pro | Model, duration (4/8/12s), resolution, input reference image, progress, library, client-side key handling, localStorage history | Privacy-first (no server storage) |
| 4 | [OpenAI Sora Sample App](https://github.com/openai/openai-sora-sample-app) | Next.js + TS | OpenAI Sora | Prompt + optional image (input_reference), variations (Versions Count), prompt optimization, remix, retry | Official OpenAI sample |
| 5 | [SwiftSora](https://github.com/jasonwang178/SwiftSora) | Nuxt 3 + Vue 3 + Tailwind | OpenAI Sora | Web UI, fake/proxy API routes | Early-stage integration |
| 6 | [VideoForge](https://github.com/magicpro97/videoforge) | CLI (Node) | Runway, fal.ai, Replicate, Google Veo, OpenAI Sora | T2V, I2V, style presets, resolution presets, batch YAML, templates, cost tracking | Terminal-first multi-provider tool |
| 7 | [AI-video-Replicate](https://github.com/xiaohuihui202504/AI-video-Replicate) | Gradio + Python | Seedance, Sora 2, Sora 2 Free | T2V, I2V (via keyframe extraction), video cloning, prompt generation, keyframe extraction, progress polling | Sora 2 Free: daily 10 uses |
| 8 | [super-video-maker-skill](https://github.com/Bomx/super-video-maker-skill) | Agent skill (SKILL.md + tools) | HeyGen, Seedance 2.5 (fal.ai / Replicate), OpenAI image | Avatar explainers, b-roll, screen recording, captions, music, QC gates | End-to-end agentic production pipeline |
| 9 | [take](https://github.com/XucroYuri/take) | Skill / MCP / CLI (TypeScript) | GPT-image-2, Seedance 2.0/2.5, MiniMax H3 | Screenplay -> storyboards -> images -> video | OpenCode-native (Claude Code, Codex, OpenCode, zcode) |
| 10 | [seedance-skills](https://github.com/Microck/seedance-skills) | Agent skills (OpenCode) | Seedance 2.0 | Montage method, repo-first prompts | OpenCode-native |
| 11 | [video-producer-skill](https://github.com/zysilm-ai/video-producer-skill) | Agent skill (OpenCode / Claude Code) | Google Flow / Veo 3.1 Fast | Scene pipeline, keyframe continuity | OpenCode-native via MCP Playwright |
| 12 | [agentic-video](https://github.com/itspremkumar/automated-video-generator) | Agent skill + MCP | LLM (agent), acquire / verify / gate / render | Fully agentic video pipeline | Backend agent orchestration |

## Key patterns observed

1. **Provider abstraction.** BlueFish and RemixKit isolate each provider behind
   an adapter (`app/services/*_service.py`, provider registries), so adding a
   new video model only requires one new adapter.
2. **Free / low-cost model access.** Sora 2 Free (daily 10 runs), Gemini/Veo,
   Groq-hosted open models and OpenRouter open models. The "open free model"
   selection in this project maps to these options through the OpenCode
   provider catalog.
3. **Multimodal input handling.** prompt + image, prompt + video, image +
   video. Video inputs usually require keyframe extraction (FFmpeg frame
   sampling) before being sent to generators that accept a single image.
4. **Job orchestration.** submit -> poll -> download -> edit (captions, TTS,
   music) as seen in BlueFish, MediaRouter and the Sora sample app. Polling is
   not universal: Pollinations returns MP4 synchronously by default and
   supports async only via `Prefer: respond-async`; Agnes always uses
   submit/poll. Normalize both into one job state machine.

## OpenCode-native angle

The OpenCode ecosystem already exposes video-related capabilities:

- Skills: `video-creator` (image + audio -> video, TTS, transitions,
  subtitles, BGM) and `ai-video-script` (topic -> script -> storyboard ->
  prompts).
- Domain skills for planning and review: `writing-plans`, `executing-plans`,
  `two-stage-code-review`, `verification-before-completion`.
- Agents: `frontend-developer`, `backend-developer`, `qa-engineer`, and others
  that supply technical parameters for the implementation.

The frontend should therefore act as the orchestration UI on top of OpenCode
HTTP API (`/api/model`, `/api/provider`, `/api/agent`, session prompt/generate
endpoints) instead of duplicating generation logic.
