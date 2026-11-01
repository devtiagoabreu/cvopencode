# Documentation

Documentation set for **Cvopencode** - a multi-tenant web app that generates AI
videos through OpenCode and free media providers. Structured AI work syncs
through Neon; media bytes stay on the device.

## Index

| Document | Purpose |
|----------|---------|
| [requirements.md](./requirements.md) | Personas, functional and non-functional requirements, acceptance criteria |
| [architecture.md](./architecture.md) | Stack, auth, tenancy, data boundary, routes and flows |
| [design-system.md](./design-system.md) | Tokens, typography, components, screen blueprints, accessibility |
| [decisions.md](./decisions.md) | Architecture decision records and trade-offs |
| [research/video-generation-solutions.md](./research/video-generation-solutions.md) | Survey of repositories that already solve similar problems |
| [research/free-llm-open-source-projects.md](./research/free-llm-open-source-projects.md) | Open-source projects using free online LLM/media APIs |
| [research/opencode-free-inference.md](./research/opencode-free-inference.md) | Verified OpenCode, models.dev and free-provider inference mechanics |
| [research/implementation-readiness.md](./research/implementation-readiness.md) | Keyless image, auth/RLS on Neon, OPFS quotas and browser video assembly |

## Scope

- Next.js App Router in plain JavaScript, Tailwind CSS v4 and shadcn/ui.
- Email/password authentication with Better Auth on Neon.
- Multi-tenant organizations, roles and invitations.
- Public landing page and platform admin area.
- Chats, prompts, agents, skills and contexts with cross-device sync.
- Generation flows for every input combination:
  - prompt only -> text-to-video
  - image + prompt -> image-to-video
  - video + prompt -> video-to-video / remix
  - image + video + prompt -> combined multimodal input
- OpenCode model catalog plus direct free media providers.
- Remote-only inference with free-first routing and explicit paid opt-in.
- WCAG 2.2 AA accessibility and layouts from 320 px to 3440 px.

## Data boundary

Neon stores **all structured product data**: users, sessions, accounts,
verification tokens, organizations, members, invitations, chats, messages,
prompts, agents, skills, contexts and chunks, projects, generations and inputs,
asset metadata, device associations, encrypted provider/OpenCode/database
connections, quotas, usage events, audit logs, feature flags and preferences.

Only **media bytes** (images, audio, video) stay on the client, in OPFS.
IndexedDB holds query caches, drafts and the offline outbox; it is never the
source of truth. No media is written to Neon, server disk or durable function
storage. Media is device-bound, so the UI shows where a copy exists and offers
download or regeneration.

## Status

- [x] Research
- [x] Requirements
- [x] Stack decision (see [decisions.md](./decisions.md))
- [x] Architecture
- [x] Design system
- [x] Frontend scaffolding (App Router, tokens, landing, auth placeholders)
- [ ] Authentication and tenancy (e-mail+senha, organizações e painel `/admin` funcionando; RLS, verificação de e-mail e convites pendentes)
- [ ] Client cache, outbox and OPFS media store
- [ ] Chats, prompts, agents, skills and contexts
- [ ] Generation jobs and sync
- [ ] Admin area
- [ ] Accessibility audit and tests
