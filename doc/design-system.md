# Design System - Cvopencode

## 1. Direction

Developer-first, sync-first and media-local. Structured AI work (chats,
prompts, agents, skills, contexts) follows the user across devices; heavy media
stays on the device that downloaded it. The interface should feel like a
precise tool: dense where it matters, calm everywhere else, one accent color
and monospace reserved for machine data.

Principles:

1. **Clarity over decoration.** Borders and spacing before shadows and gradients.
2. **One accent.** Violet marks primary actions, focus and active state only.
3. **Data is monospace.** Model ids, providers, durations, sizes, tokens and
   timestamps use Geist Mono.
4. **Sync is visible.** Every surface shows whether data is saved, syncing or
   offline; media shows whether it exists on this device.
5. **Accessible on any screen.** WCAG 2.2 AA minimum from 320 px to 3440 px,
   400% zoom and screen readers.
6. **Fast by default.** Cache-first reads, optimistic writes and prefetching.
7. **No dark patterns.** Free limits, URL expiry and provider constraints are
   stated plainly.

## 2. Typography

| Role | Family | Source |
|------|--------|--------|
| UI / headings | Geist | `next/font/google` |
| Code / data | Geist Mono | `next/font/google` |
| Fallback | system-ui, -apple-system, Segoe UI, sans-serif | - |

```js
// app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

<html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
```

Sizes are in `rem` so browser text resize works. Use fluid type for display
only; body text stays at least 16 px.

| Token | Size / line | Use |
|-------|-------------|-----|
| `text-display` | `clamp(2rem, 5vw, 3.5rem)` / 1.05, -0.02em | Landing hero |
| `text-h1` | `clamp(1.5rem, 2.5vw, 1.875rem)` / 1.2 | Page title |
| `text-h2` | `clamp(1.25rem, 2vw, 1.5rem)` / 1.25 | Section |
| `text-h3` | `1.25rem` / 1.3 | Card title |
| `text-body` | `1rem` / 1.6 | Default |
| `text-sm` | `0.875rem` / 1.5 | Secondary |
| `text-xs` | `0.75rem` / 1.4 | Captions, badges |
| `text-mono` | `0.8125rem` / 1.5 | Ids, code, metrics |

Weights: 400 body, 500 UI labels, 600 headings. Never use more than three
weights on one screen. Headings use sentence case. Limit paragraphs to 60-75
characters per line (`max-w-[65ch]`). Never justify text. Do not use text
smaller than 12 px.

## 3. Color tokens

Tailwind CSS v4, CSS variables in `app/globals.css`, `oklch` values. Components
must use semantic names, never palette values or hex.

```css
@import "tailwindcss";

:root {
  --background: oklch(0.99 0.002 285);
  --foreground: oklch(0.17 0.01 285);
  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --popover: oklch(1 0 0);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.52 0.23 285);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.96 0.01 285);
  --secondary-foreground: oklch(0.25 0.02 285);
  --muted: oklch(0.96 0.005 285);
  --muted-foreground: oklch(0.46 0.015 285);
  --accent: oklch(0.94 0.03 285);
  --accent-foreground: oklch(0.25 0.03 285);
  --destructive: oklch(0.55 0.22 27);
  --destructive-foreground: oklch(0.99 0 0);
  --success: oklch(0.52 0.15 155);
  --warning: oklch(0.62 0.15 75);
  --info: oklch(0.55 0.12 240);
  --border: oklch(0.90 0.005 285);
  --input: oklch(0.90 0.005 285);
  --ring: oklch(0.52 0.23 285);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.14 0.006 285);
  --foreground: oklch(0.97 0.002 285);
  --card: oklch(0.17 0.007 285);
  --card-foreground: var(--foreground);
  --popover: oklch(0.18 0.008 285);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.72 0.17 285);
  --primary-foreground: oklch(0.14 0.01 285);
  --secondary: oklch(0.22 0.008 285);
  --secondary-foreground: oklch(0.97 0.002 285);
  --muted: oklch(0.21 0.007 285);
  --muted-foreground: oklch(0.72 0.01 285);
  --accent: oklch(0.26 0.03 285);
  --accent-foreground: oklch(0.97 0.002 285);
  --destructive: oklch(0.65 0.20 27);
  --destructive-foreground: oklch(0.14 0.01 285);
  --success: oklch(0.70 0.15 155);
  --warning: oklch(0.80 0.14 75);
  --info: oklch(0.72 0.10 240);
  --border: oklch(0.26 0.008 285);
  --input: oklch(0.26 0.008 285);
  --ring: oklch(0.72 0.17 285);
}
```

Rules:

- Use `bg-background`, `text-foreground`, `border-border`, `bg-muted`,
  `text-muted-foreground`, `bg-primary`. No `bg-zinc-*` in product code.
- Do not write `dark:` color overrides; tokens already switch.
- Status colors are semantic: `success` (ready/saved), `info` (syncing),
  `warning` (quota/rate limit/offline), `destructive` (failed). Never use
  success green for decoration.
- Do not rely on color alone: pair status color with an icon and text.
- Charts: violet, cyan `oklch(0.65 0.12 210)`, emerald `oklch(0.65 0.15 155)`,
  amber `oklch(0.78 0.14 75)`, rose `oklch(0.62 0.19 15)`.
- High contrast: honor `prefers-contrast: more` by strengthening borders and
  muted text; honor `forced-colors` by not using background images for meaning.

## 4. Layout and responsiveness

- Base unit 4 px; use 4/8/12/16/24/32/48/64.
- Radius: `rounded-md` 10 px for controls, `rounded-lg` 14 px for cards,
  `rounded-full` for avatars and pills.
- Marketing container: max 1152 px. App container: max 1440 px (1680 px on
  ultrawide). Use `width: min(100% - 2rem, 1440px)`.
- Never set a fixed page width; never require horizontal scrolling.
- Use container queries for cards and panels; media queries only for page-level
  layout changes.
- Prefer `min-height: 100dvh` over `100vh` for mobile browser chrome.
- Shadows: `0 1px 2px oklch(0 0 0 / 0.06)` for raised cards only. Prefer
  `border` + background contrast.

### 4.1 Responsive behavior

| Width | Shell | Chat | Studio | Tables |
|-------|-------|------|--------|--------|
| < 480 | Bottom nav + sheet sidebar | Single thread, chat list in sheet | Stacked form -> preview | Cards |
| 480-767 | Sheet sidebar | Thread + list sheet | Stacked | Cards |
| 768-1023 | Collapsed rail 64 px | List 280 px + thread | Stacked or 2 cols | Horizontal scroll with sticky first column |
| 1024-1439 | Sidebar 248 px | List 280 px + thread + context sheet | 420 px + fluid preview | Full table |
| 1440-2559 | Sidebar 248 px | 320 px + thread + 320 px context | 420 px + preview + history | Full table |
| >= 2560 | Max-width 1680 px, centered | Extra space in thread | Preview grows | Full table |

- Sidebar collapses to icons, then to a sheet; state persists.
- Chat composer stays anchored; the thread scrolls independently.
- Studio stacks with the preview first on mobile (result visibility) and the
  form first on desktop.
- Data tables become cards below 768 px; never hide columns without an
  "expand" path.
- Use `clamp()` for vertical rhythm on marketing pages, not for body text.
- Test landscape phones, split-screen and 400% zoom.

## 5. Components

Base: shadcn/ui (new-york style, `tsx: false`, JSX output, Radix primitives,
Lucide icons). `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

| Need | Component |
|------|-----------|
| Actions | `button`, `dropdown-menu`, `toggle-group` |
| Inputs | `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `label`, `form` |
| Overlays | `dialog`, `sheet`, `popover`, `tooltip`, `alert-dialog`, `command` |
| Structure | `card`, `tabs`, `accordion`, `separator`, `scroll-area`, `resizable` |
| Data | `table` + TanStack Table, `badge`, `progress`, `skeleton`, `avatar`, `breadcrumb` |
| Feedback | `sonner` toasts, `alert`, `empty-state` (custom) |
| Navigation | `sidebar`, `navigation-menu`, `breadcrumb` |

Custom components:

| Component | Responsibility |
|-----------|----------------|
| `PageHeader` | Title, description, primary action, breadcrumb |
| `MetricCard` | Label, value in mono, delta, hint |
| `EmptyState` | Icon, title, explanation, one action |
| `SyncBadge` | `salvo`, `sincronizando`, `offline`, `erro` with icon + text |
| `OfflineBanner` | Persistent, dismissible notice with queued-write count |
| `StatusBadge` | `queued/running/downloading/ready/failed/canceled` |
| `ProviderBadge` | Provider name + `free` marker |
| `MediaAvailabilityBadge` | `neste dispositivo` / `baixar` / `expirado` |
| `ChatBubble` | Role, content, model, tokens, actions |
| `ChatComposer` | Textarea, attachments, model/agent pickers, send/stop |
| `StreamingStatus` | Polite live region; announces start/end, not every token |
| `PromptCard` / `PromptPicker` | Save, tag, favorite, insert |
| `AgentCard` / `AgentForm` | System prompt, model, skills, tool permissions |
| `SkillCard` / `SkillProvenance` | Version, source, permissions, enable toggle |
| `ContextCard` / `CitationList` | Collections, documents, passages, sources |
| `ModelCombobox` | Searchable `provider/model` list with capability, free, health, latency and privacy filters |
| `ModelHealthBadge` | `saudável`, `degradado`, `offline` with last check and source |
| `PrivacyNotice` | Per-model retention/training policy before the first request |
| `RoutingTrace` | Selected path, attempts, sync/async mode and provider/model used |
| `NoCredentialNotice` | Explains which credential is missing and links to the right settings scope |
| `MediaDropzone` | Local image/video input with validation and preview |
| `KeyframeStrip` | 8 captured frames with timestamps |
| `VideoPlayer` | Native video, captions, transcript, download, fullscreen |
| `StorageMeter` | Used/total, persistence status, cleanup action |
| `DeviceMediaNotice` | Explains local media and offers download/regeneration |
| `OrgSwitcher` | Tenant list, create organization |
| `GenerationCard` | Thumbnail, prompt excerpt, model, status, duration |
| `JobProgress` | Determinate progress + `aria-live` status |
| `ExportImportDialog` | ZIP export/import with progress and conflicts |
| `ConfirmDialog` | Typed confirmation for destructive actions |
| `SecretField` | Write-only key/DSN input with paste, mask and "not revealable" hint |
| `ConnectionTest` | Test action with pending/success/error and last checked time |
| `QuotaEditor` | Metric rows with inherited value, override, reset window and reason |
| `LimitBadge` | Metric, current/limit, warning at 80% and blocked state |
| `UsageMeter` | Spend, tokens and generations per user/tenant/provider |
| `DatabaseConnectionCard` | Masked host/database, role, status, test and rotate |

Icons: Lucide, 16 px inline with text, 20 px in buttons, 1.5 stroke. No
hand-drawn SVGs except the logo. Icons never replace a text label for primary
actions on small screens.

## 6. Screen blueprints

### 6.1 Landing (`/`)

1. Header: logo, "Como funciona", "Recursos", "Privacidade", theme toggle,
   "Entrar", "Criar conta".
2. Hero: outcome-focused headline ("Vídeos com modelos abertos, com seu
   contexto em qualquer dispositivo"), one paragraph, two CTAs, honesty note
   about free limits.
3. Product preview: real studio/chat frame with a video card, provider badge
   and sync/local-media badges. No fake metrics.
4. Model strip: provider names with "catálogo ao vivo" note.
5. Three-step flow: escolha o modelo -> converse ou envie mídia -> assista,
   baixe e reutilize.
6. Feature grid (6): Open/free catalog, four input modes, OpenCode integration,
   synced chats/prompts/agents, local media library, multi-tenant roles.
7. Privacy section: diagram "conteúdo -> Neon; mídia -> este dispositivo" with
   the media path outside the database.
8. FAQ (6): "onde ficam meus vídeos?", "o que sincroniza?", "funciona no
   celular?", "preciso instalar algo?", "é grátis?", "posso usar em equipe?".
9. Final CTA + footer with legal, GitHub and status.

### 6.2 Auth

Centered card, max 400 px, logo above, one primary action, secondary link.
Register shows password rules before submit. Verification explains the next
step and offers resend with a cooldown. Invitation acceptance shows the tenant
name and invited email. Inputs allow paste and password managers.

### 6.3 App shell

Desktop: sidebar 248 px with org switcher, Dashboard, Chats, Criar, Biblioteca,
Prompts, Agentes, Skills, Contextos, Settings. Footer: connection status,
`SyncBadge`, theme toggle, user menu. Header: breadcrumb, command menu
(`Ctrl/Cmd+K`), storage meter on library pages.

Tablet: collapsed 64 px rail with tooltips. Mobile: top bar + bottom nav
(Dashboard, Chats, Criar, Biblioteca, Mais) and a sheet for the rest.

Dashboard: greeting, "Criar vídeo" primary action, 4 metric cards (chats,
vídeos locais, espaço usado, último modelo), recent chats and generations,
setup checklist.

### 6.4 Chats (`/app/[org]/chats`)

Desktop: chat list 320 px (search, new chat, filters), thread fluid, optional
context panel 320 px. Tablet: list 280 px + thread, context in a sheet. Mobile:
thread full screen with a back button to the list sheet.

Thread: message bubbles, model/provider/token meta, copy, retry, save as
prompt, attach to context, citations. Composer: multiline, attachments,
model/agent pickers, send/stop, hint about Enter/Shift+Enter. Streaming uses a
polite live region that announces completion, not every token.

### 6.5 Studio (`/app/[org]/create`)

Left column: mode tabs (Texto, Imagem, Vídeo, Multimodal), prompt textarea with
counter and "salvar prompt", media dropzone, keyframe strip, model combobox
(`provider/model`, free, health, privacy), advanced options, submit with
cost/free badge, provider limits notice and `PrivacyNotice`. If no capable
credential exists, replace submit with `NoCredentialNotice`; do not fail only
after enqueue.

Right column: preview, progress steps ("enviando", "gerando", "baixando",
"salvando"), cancel, result player, actions (baixar para este dispositivo,
remixar, abrir na biblioteca), `RoutingTrace` with path, attempts and
sync/async mode. If the job is ready but not cached here, show
`DeviceMediaNotice`.

### 6.6 Library (`/app/[org]/library`)

Toolbar: search, filters (mode, provider, status, device), sort, storage meter,
export/import. Grid of `GenerationCard` >= 768 px, list on mobile. Detail:
player, prompt, model, provider, parameters, timestamps, size, device
availability, actions. Empty state explains local media and links to the
studio.

### 6.7 Prompts, agents, skills, contexts

- Prompts: list with tags/favorites, search, detail drawer, "usar no studio".
- Agents: cards with model, skills and visibility; form with system prompt,
  model, skill multi-select, tool permissions and a test chat.
- Skills: system vs tenant sections, version, provenance, permission summary,
  enable toggle, import.
- Contexts: collection detail with documents, chunk count, citations preview,
  attach to chat/agent, delete cascade.

### 6.8 Settings

- Geral: name, slug, retention.
- Membros: invite, roles, remove.
- Conexões: "Minhas chaves" (user BYOK), "Chaves do workspace" (owner/admin),
  OpenCode URL/token, provider test and last-used time. Members see the BYOK
  policy but cannot change tenant keys.
- Modelos: default model per mode, allowlist inherited from the platform;
  each row shows `free`, health, context/output, supported mode and whether
  the provider requires a key. A stale catalog row is marked, never hidden.
- Limites: usage meters and inherited quotas; overrides are editable only by
  owner/admin and never exceed the platform ceiling.
- Dados locais: usage, persistence, export/import, clear.

Every key field is write-only: show provider, label, `••••1234`, status and
"não é possível exibir a chave novamente". Replacing a key requires the new
value; there is no reveal action.

### 6.9 Admin (`/admin`)

Top-level tabs: Visão geral, Usuários, Tenants, Jobs, Provedores, Banco de
dados, Configurações.

- Visão geral: users, tenants, jobs, error rate, spend and quota saturation.
- Usuários: search, create, edit, suspend; detail with sessions, roles,
  tenants, usage, credentials metadata, effective limits and audit trail.
- Tenants: members, invitations, usage, connections metadata, limits and
  feature flags.
- Jobs: status/provider/errors, retry/cancel; never media.
- Provedores: platform credentials, provider allowlist, BYOK policy, test and
  revoke; keys remain masked.
- Banco de dados: connection cards for `primary`, replica/analytics/external;
  masked DSN, test, rotate, deactivate; activation requires typed confirmation,
  validation result and a restart notice.
- Configurações: defaults, retention, flags and two-admin approval policy.

Persistent notice: "Mídia não é armazenada no servidor. Chaves e DSNs são
criptografados e não podem ser exibidos. Prompts exigem elevação auditada."

## 7. Content and voice

- pt-BR default, English secondary. Sentence case, direct verbs.
- Say "modelos abertos e gratuitos quando disponíveis", not "ilimitado".
- Explain sync and storage where the action happens: "Seus chats sincronizam.
  O vídeo fica neste dispositivo até você baixar em outro."
- Explain URL expiry before it happens: "Baixe agora; links de provedores
  expiram."
- Explain free-tier limits before submit: "Modelo gratuito: 20 req/min e 50
  req/dia neste provedor."
- Numbers and ids in mono. Use `10 MB`, `60 s`, `1280x720`.
- Errors: what happened, why, what to do. Example: "O provedor limitou as
  requisições. Tente novamente em 30 s ou escolha outro modelo."
- Missing credential: "Este modelo precisa de uma chave do provedor. Adicione
  em Configurações > Conexões." Link to the exact scope; never show a dead end.
- Privacy: "Este modelo gratuito pode usar o conteúdo para treinamento.
  Escolha outro modelo ou revise a política."
- Never blame the user. Never expose stack traces or provider payloads.
- Do not use "local-first" as a slogan without the explanation of what syncs.

## 8. Accessibility

Target WCAG 2.2 AA everywhere; AAA for body text where contrast allows.

### 8.1 Perceivable

- Text contrast >= 4.5:1; large text and UI boundaries >= 3:1.
- Never use color alone for status, errors or charts; add icon and text.
- All images have alt text; decorative images use empty alt.
- Videos have captions when audio exists, a transcript and a poster; provide
  audio description when visual information is essential.
- Text resizes to 200% without loss; content reflows at 320 CSS px.
- Support `prefers-contrast: more` and `forced-colors`.

### 8.2 Operable

- Every action works with a keyboard; focus order follows reading order.
- Focus ring: 2 px `--ring` with 2 px offset; never `outline: none`.
- Focus is never obscured by sticky headers, banners or sheets.
- Skip link to main content; landmarks for nav, main, complementary and footer.
- No keyboard traps; Escape closes overlays and restores focus.
- Touch targets >= 44x44 px; never drag-only (keyframes and uploads have
  buttons/inputs as alternatives).
- No time limits on composing; job timeouts are provider-driven and explained.
- Streaming and animations can be paused/stopped; respect reduced motion.

### 8.3 Understandable

- Visible labels for every input; placeholders are examples, not labels.
- Errors identify the field, explain the fix and are announced.
- Consistent navigation, help and terminology across screens.
- Don't ask for the same information twice; prefill from the account.
- Accessible authentication: paste allowed, password managers supported, no
  puzzles or cognitive tests.
- Destructive actions require confirmation and offer undo where possible.

### 8.4 Robust

- Semantic HTML first; ARIA only when native semantics are insufficient.
- Chat streaming: `aria-live="polite"` announces "resposta concluída", not
  every token; errors use `role="alert"`.
- Job progress: `role="progressbar"` with `aria-valuenow/min/max` and a text
  status; completion announced once.
- Toasts are announced but never steal focus; persistent errors stay visible.
- Test with NVDA + Firefox/Chrome, VoiceOver + Safari, TalkBack + Chrome.

### 8.5 Any screen

Test matrix: 320, 360, 390, 414, 768, 820, 1024, 1280, 1440, 1920, 2560 and
3440 px; portrait and landscape; split-screen; 200% text and 400% zoom; light,
dark, high contrast and forced colors; reduced motion on/off. Automated checks:
axe, Lighthouse; manual: keyboard-only, screen reader and zoom.

## 9. Motion and feedback

- 120 ms for hover/focus, 180 ms for popovers, 240 ms for sheets/dialogs.
- Ease-out; no bounce. Progress transitions are linear and honest.
- No parallax, no autoplaying carousels, no animated gradients in the app.
- Landing may use one subtle entrance animation, disabled with reduced motion.
- Skeletons for loads > 300 ms, with a text alternative for screen readers.
- Optimistic updates show `SyncBadge` immediately; failures roll back with a
  clear message.
- Reserve aspect ratios for thumbnails and video to avoid layout shift.

## 10. Implementation rules for agents

1. Use semantic tokens only; never raw hex, `zinc-*`, or `dark:` color fixes.
2. Use `cn()` from `@/lib/utils` for conditional classes.
3. Prefer Server Components; add `"use client"` only at interactive leaves.
4. In Next.js 15/16, `params` and `searchParams` are async: `const { orgSlug } = await params`.
5. Media bytes go to OPFS only; never to `localStorage`, IndexedDB blobs,
   Neon, server disk or our API as durable storage.
6. Structured data is server state: write through server actions with an
   idempotency key and outbox; IndexedDB is a cache, never the source of truth.
7. Serve cached data first, then revalidate; show `SyncBadge` and `OfflineBanner`.
8. Check `navigator.storage.estimate()` before large writes and revoke object
   URLs after use.
9. Every data surface needs loading, empty, error, offline and success states.
10. Every destructive action uses `ConfirmDialog` and a clear consequence.
11. Do not edit generated `components/ui/*` unless the design system requires
    it; wrap instead.
12. No fixed widths, no `outline: none`, no text below 12 px.
13. Test at 320 px, 768 px and 1440 px plus 400% zoom before opening a PR.
14. Add or update a route preview or example for new primitives.

## 11. References and what to borrow

| Reference | Borrow | Avoid |
|-----------|--------|-------|
| shadcn/ui | Copy-in components, semantic tokens, JS output | Treating it as a locked dependency |
| Radix Primitives | Keyboard/focus behavior, ARIA | Restyling from scratch |
| Supabase UI | Semantic token naming, dense admin tables | Heavy marketing gradients |
| Vercel Geist | Type pairing, monochrome discipline, mono data | Copying the Vercel brand |
| Linear | Density, keyboard-first navigation, command menu | Excessive animation |
| GitHub Primer | Data tables, labels, admin clarity | Legacy spacing scale |
| Cal.com | Form ergonomics, accessible flows | Overly rounded cards |
| Dub | Dashboard hierarchy, empty states | Affiliate-specific UI |
| Resend | Landing polish, code samples | Overpromising copy |
| TanStack Query / Table | Cache-first reads, headless tables | Uncontrolled cache growth |

## 12. Assets

- Logo: wordmark "cvopencode" in Geist SemiBold, optional `>_` glyph in mono.
- Favicon and OG image generated from the wordmark; no stock photos.
- Illustrations: simple line diagrams (browser, Neon, provider) using
  `--border` and `--primary`; no 3D blobs.
- Video posters: first frame, muted, with duration badge and alt text.
