import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { KeyRound, MessageSquarePlus, Video } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema";

export const instant = false;

const roleLabels = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

export async function generateMetadata({ params }) {
  const { orgSlug } = await params;
  return { title: orgSlug };
}

export default async function WorkspacePage({ params }) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/entrar");
  }

  const [membership] = await db
    .select({
      organizationId: organization.id,
      name: organization.name,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(
      and(eq(organization.slug, orgSlug), eq(member.userId, session.user.id)),
    )
    .limit(1);

  if (!membership) {
    notFound();
  }

  const nextSteps = [
    {
      icon: MessageSquarePlus,
      title: "Chats com agentes",
      text: "Sessões persistentes com contexto, agentes e skills do workspace.",
    },
    {
      icon: Video,
      title: "Geração de imagem e vídeo",
      text: "Roteamento free-first, com limites e privacidade antes de gerar.",
    },
    {
      icon: KeyRound,
      title: "Conexões e chaves",
      text: "Provedores e gateway OpenCode cifrados, exibidos só mascarados.",
    },
  ];

  return (
    <>
      <header className="border-b border-border">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brand />
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span className="text-sm font-medium">{membership.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        <div className="container-app py-12">
          <p className="font-mono text-xs text-muted-foreground">
            /app/{orgSlug}
          </p>
          <h1 className="mt-2 text-h1 font-semibold tracking-tight">
            {membership.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você entrou como{" "}
            <span className="font-medium text-foreground">
              {roleLabels[membership.role] ?? membership.role}
            </span>{" "}
            neste workspace.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-h3 font-semibold">Sessão ativa</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Usuário</dt>
                  <dd className="font-medium">{session.user.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd className="truncate font-medium">{session.user.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Papel</dt>
                  <dd className="font-medium">
                    {roleLabels[membership.role] ?? membership.role}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">ID do workspace</dt>
                  <dd className="font-mono text-xs">
                    {membership.organizationId.slice(0, 12)}…
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-5">
              <h2 className="text-h3 font-semibold">Studio em construção</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A autenticação e o workspace já funcionam. A próxima entrega é
                a camada de chats e a geração de mídia.
              </p>
            </div>
          </div>

          <h2 className="mt-10 text-h3 font-semibold">Próximos passos</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {nextSteps.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </>
  );
}
