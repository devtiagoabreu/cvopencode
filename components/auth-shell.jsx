import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, Users } from "lucide-react";
import { Brand } from "@/components/brand";

const pending = [
  {
    icon: ShieldCheck,
    text: "Sessão com Better Auth sobre Neon, com cookies httpOnly e verificação de e-mail.",
  },
  {
    icon: Users,
    text: "Criação de organização, convites e papéis por workspace.",
  },
  {
    icon: KeyRound,
    text: "Chaves de provedor cifradas no servidor e exibidas apenas mascaradas.",
  },
];

export function AuthShell({ title, description }) {
  return (
    <main
      id="conteudo"
      className="flex flex-1 items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 sm:p-8">
        <Brand />

        <h1 className="mt-6 text-h1 font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-6 rounded-md border border-dashed border-border bg-muted/50 p-4">
          <p className="font-mono text-xs text-muted-foreground">
            em construção
          </p>
          <p className="mt-2 text-sm">
            Esta etapa ainda não está disponível. Nenhum dado é enviado.
          </p>
        </div>

        <ul className="mt-6 space-y-3">
          {pending.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex gap-2 text-sm">
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span className="text-muted-foreground">{item.text}</span>
              </li>
            );
          })}
        </ul>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
