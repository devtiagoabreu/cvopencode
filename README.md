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

Fase de desenvolvimento. A base do app (App Router, tokens de design, landing e
páginas de autenticação provisórias) está de pé; autenticação, studio e
sincronização são os próximos passos. Veja o checklist em
[doc/README.md](doc/README.md#status).

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev
```

`npm run lint` e `npm run build` validam o projeto.
