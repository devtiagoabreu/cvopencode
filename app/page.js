import Link from "next/link";
import {
  BookOpen,
  Boxes,
  Cloud,
  Database,
  FolderOpen,
  KeyRound,
  Layers,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { StudioPreview } from "@/components/marketing/studio-preview";
import { Button } from "@/components/ui/button";

const providers = [
  "OpenCode Zen",
  "OpenRouter",
  "Pollinations",
  "Agnes",
  "Groq",
  "Google Gemini",
];

const steps = [
  {
    title: "Escolha o modelo",
    text: "Catálogo ao vivo com custo, saúde, privacidade e limites. Modelos gratuitos vêm primeiro e o caminho usado fica visível.",
  },
  {
    title: "Converse ou envie mídia",
    text: "Prompt puro, imagem, vídeo ou os dois juntos. Agentes, skills e contextos entram na conversa quando você quiser.",
  },
  {
    title: "Assista, baixe e reutilize",
    text: "O resultado é baixado direto para este dispositivo, entra na biblioteca local e fica pronto para remixar.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Catálogo aberto e gratuito",
    text: "Roteamento free-first com catálogo atualizado; nada de lista fixa de modelos.",
  },
  {
    icon: Layers,
    title: "Quatro modos de entrada",
    text: "Texto, imagem, vídeo e multimodal no mesmo studio, com pré-requisitos checados antes de gerar.",
  },
  {
    icon: Workflow,
    title: "Integração com OpenCode",
    text: "O OpenCode orquestra agentes e sessões; provedores de mídia são chamados pelos adaptadores.",
  },
  {
    icon: FolderOpen,
    title: "Conteúdo sincronizado",
    text: "Chats, prompts, agentes, skills e contextos acompanham você em qualquer dispositivo.",
  },
  {
    icon: MonitorSmartphone,
    title: "Biblioteca de mídia local",
    text: "Imagens, áudios e vídeos ficam no armazenamento privado do navegador, nunca no banco.",
  },
  {
    icon: Users,
    title: "Equipes com papéis",
    text: "Organizações multi-tenant, convites, papéis e limites herdados do workspace.",
  },
];

const faqs = [
  {
    question: "Onde ficam meus vídeos?",
    answer:
      "No seu dispositivo, no armazenamento privado do navegador (OPFS). O banco guarda apenas metadados, como prompt, modelo, provedor e tamanho. Médio não é enviada para o servidor.",
  },
  {
    question: "O que sincroniza entre dispositivos?",
    answer:
      "Tudo que é estruturado: chats, mensagens, prompts, agentes, skills, contextos, projetos, metadados de geração e preferências. A mídia é vinculada ao dispositivo que a baixou.",
  },
  {
    question: "Funciona no celular?",
    answer:
      "Sim. O layout vai de 320 px a telas ultrawide, com navegação adaptada, alvos de toque adequados e suporte a leitores de tela.",
  },
  {
    question: "Preciso instalar algo?",
    answer:
      "Não para usar no navegador. Para conectar um gateway OpenCode próprio, você informa a URL e o token nas configurações da organização.",
  },
  {
    question: "É grátis?",
    answer:
      "O produto tem caminho gratuito, mas provedores impõem limites e alguns exigem chave. A interface mostra o limite e o aviso de privacidade antes de gerar; fallback pago só com escolha explícita.",
  },
  {
    question: "Posso usar em equipe?",
    answer:
      "Sim. Organizações têm papéis, convites e chaves por workspace. Chaves são somente escrita: depois de salvas, não podem ser exibidas novamente.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="conteudo" className="flex-1">
        <section className="border-b border-border">
          <div className="container-marketing grid gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Inferência remota, mídia local
              </p>

              <h1 className="mt-5 text-display font-semibold text-balance">
                Vídeos com modelos abertos, com seu contexto em qualquer
                dispositivo
              </h1>

              <p className="mt-5 max-w-[65ch] text-base text-muted-foreground sm:text-lg">
                Converse com agentes, gere imagens e vídeos e mantenha o trabalho
                sincronizado. O conteúdo estruturado vive no Neon; os arquivos
                ficam só onde você está.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/criar-conta">Criar conta</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>

              <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">
                Modelos gratuitos têm limite de uso e podem mudar sem aviso. O
                limite, a marca d&apos;água e a política de privacidade aparecem
                antes de cada geração.
              </p>
            </div>

            <StudioPreview />
          </div>
        </section>

        <section aria-labelledby="catalogo" className="border-b border-border">
          <div className="container-marketing py-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 id="catalogo" className="text-sm font-medium">
                Provedores conectáveis
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                catálogo ao vivo · ids nunca fixos no código
              </p>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {providers.map((provider) => (
                <li
                  key={provider}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
                >
                  {provider}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="como-funciona"
          aria-labelledby="como-funciona-titulo"
          className="border-b border-border"
        >
          <div className="container-marketing py-16">
            <h2
              id="como-funciona-titulo"
              className="text-h1 font-semibold tracking-tight"
            >
              Do prompt ao arquivo, sem sair da aba
            </h2>
            <p className="mt-3 max-w-[65ch] text-muted-foreground">
              O fluxo é o mesmo para texto, imagem, vídeo e entrada multimodal.
            </p>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <p className="font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-h3 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="recursos"
          aria-labelledby="recursos-titulo"
          className="border-b border-border"
        >
          <div className="container-marketing py-16">
            <h2
              id="recursos-titulo"
              className="text-h1 font-semibold tracking-tight"
            >
              Feito para quem trabalha com modelos, não contra eles
            </h2>
            <p className="mt-3 max-w-[65ch] text-muted-foreground">
              Menos promessa, mais controle sobre custo, privacidade e onde cada
              byte fica.
            </p>

            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.title}
                    className="rounded-lg border border-border bg-card p-5"
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-muted">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <h3 className="mt-4 text-h3 font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="privacidade"
          aria-labelledby="privacidade-titulo"
          className="border-b border-border bg-muted/40"
        >
          <div className="container-marketing grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2
                id="privacidade-titulo"
                className="text-h1 font-semibold tracking-tight"
              >
                O que sincroniza e o que nunca sai do dispositivo
              </h2>
              <p className="mt-3 max-w-[65ch] text-muted-foreground">
                A separação é a base do produto: dados estruturados viajam,
                bytes de mídia não. Se a mídia só existe em outro dispositivo, a
                interface avisa e oferece baixar ou gerar de novo.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex gap-2">
                  <Database
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <span>
                    <strong className="font-medium">
                      Estruturado no Neon:
                    </strong>{" "}
                    chats, prompts, agentes, skills, contextos, metadados e
                    configurações.
                  </span>
                </li>
                <li className="flex gap-2">
                  <MonitorSmartphone
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <span>
                    <strong className="font-medium">Mídia no dispositivo:</strong>{" "}
                    imagens, áudios e vídeos em OPFS, com aviso de uso e
                    exportação.
                  </span>
                </li>
                <li className="flex gap-2">
                  <KeyRound
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <span>
                    <strong className="font-medium">Chaves protegidas:</strong>{" "}
                    credenciais cifradas no servidor e exibidas apenas de forma
                    mascarada.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="flex items-center gap-2">
                    <Boxes aria-hidden="true" className="size-4 text-primary" />
                    <p className="text-sm font-medium">Conteúdo e contexto</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    chats · prompts · agentes · metadados
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <Cloud aria-hidden="true" className="size-4" />
                    Neon (Postgres)
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-4 text-xs text-muted-foreground">
                  <span aria-hidden="true">→</span>
                  sincroniza entre dispositivos
                </div>

                <div className="rounded-md border border-primary/40 bg-background p-4">
                  <div className="flex items-center gap-2">
                    <Lock aria-hidden="true" className="size-4 text-primary" />
                    <p className="text-sm font-medium">Mídia</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    imagem · áudio · vídeo
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <MonitorSmartphone aria-hidden="true" className="size-4" />
                    Este dispositivo (OPFS)
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Nenhum byte de mídia é gravado no banco, no disco do servidor
                  ou em armazenamento durável de função.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="perguntas"
          aria-labelledby="perguntas-titulo"
          className="border-b border-border"
        >
          <div className="container-marketing py-16">
            <h2
              id="perguntas-titulo"
              className="text-h1 font-semibold tracking-tight"
            >
              Perguntas frequentes
            </h2>

            <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium marker:content-none">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="font-mono text-muted-foreground group-open:hidden"
                    >
                      +
                    </span>
                    <span
                      aria-hidden="true"
                      className="hidden font-mono text-muted-foreground group-open:inline"
                    >
                      −
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-final" className="border-b border-border">
          <div className="container-marketing flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                id="cta-final"
                className="text-h1 font-semibold tracking-tight"
              >
                Comece pelo gratuito, cresça com controle
              </h2>
              <p className="mt-2 max-w-[60ch] text-muted-foreground">
                Crie sua conta, conecte um provedor e veja o caminho de rota,
                custo e privacidade antes de cada geração.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/criar-conta">Criar conta</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/entrar">Entrar</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
