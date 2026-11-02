# cvopencode

Criar vídeos com IA usando OpenCode e modelos abertos/gratuitos, direto do
navegador.

- Next.js (App Router) em JavaScript, Tailwind CSS v4 e shadcn/ui.
- Login por e-mail e senha, organizações multi-tenant e área administrativa.
- Neon guarda todo dado estruturado: chats, prompts, agentes, skills, contextos,
  histórico e metadados de mídia.
- Imagens, áudios e vídeos ficam no dispositivo (OPFS); nunca no banco.
- Cache no navegador para leitura instantânea, com sincronização e suporte
  offline.
- Inferência somente remota, com roteamento free-first e fallback pago apenas
  com opt-in explícito.
- Acessibilidade WCAG 2.2 AA e layout de 320 px a 3440 px.

## Documentação

- [Requisitos](doc/requirements.md)
- [Arquitetura](doc/architecture.md)
- [Design system](doc/design-system.md)
- [Decisões](doc/decisions.md)
- [Índice da documentação](doc/README.md)

## Status

Fase de desenvolvimento. Landing, autenticação por e-mail/senha (Better Auth),
organizações multi-tenant, painel `/admin` e geração de imagens (Pollinations,
blob em OPFS e metadados no Postgres) funcionam. Chats, vídeo, RLS, verificação
de e-mail e convites são os próximos passos. Veja o checklist em
[doc/README.md](doc/README.md#status).

## Desenvolvimento

```bash
npm install
cp .env.example .env.local    # preencha DATABASE_URL e os segredos
npm run db:migrate            # aplica as migrations do Drizzle
npm run dev
```

`npm run lint` e `npm run build` validam o projeto. O schema vive em
`lib/db/schema.js` (gerado pelo Better Auth) e as migrations em
`db/migrations/`; use `npm run db:generate` após mudanças de schema.

Para promover uma conta a administrador da plataforma (acesso a todos os
workspaces em `/admin`):

```bash
node --env-file=.env.local scripts/create-admin.mjs email@exemplo.com senha
```
