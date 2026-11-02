import { headers } from "next/headers";
import Link from "next/link";
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

  let workspace = membership;

  if (!workspace && session.user.role === "admin") {
    const [org] = await db
      .select({ organizationId: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.slug, orgSlug))
      .limit(1);
    workspace = org ? { ...org, role: null } : undefined;
  }

  if (!workspace) {
    notFound();
  }

  const isPlatformAdmin = session.user.role === "admin";
  const roleLabel = workspace.role
    ? (roleLabels[workspace.role] ?? workspace.role)
    : "Administrador da plataforma (acesso total)";

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
            <span className="text-sm font-medium">{workspace.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user.email}
            </span>
            <Link
              href={`/app/${orgSlug}/create`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Criar imagem
            </Link>
            {isPlatformAdmin ? (
              <Link
                href="/admin"
                className="text-sm font-medium text-primary hover:underline"
              >
                Admin
              </Link>
            ) : null}
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
            {workspace.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você entrou como{" "}
            <span className="font-medium text-foreground">{roleLabel}</span>{" "}
            neste workspace.
          </p>

          {isPlatformAdmin && !workspace.role ? (
            <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
              Acesso de administrador da plataforma: você não é membro deste
              workspace, mas pode visualizar e alterar os dados dele.
            </p>
          ) : null}

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
                    {roleLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">ID do workspace</dt>
                  <dd className="font-mono text-xs">
                    {workspace.organizationId.slice(0, 12)}…
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-5">
              <h2 className="text-h3 font-semibold">Studio em construção</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Geração de imagem já está disponível. Chats, vídeo e áudio são
                as próximas entregas.
              </p>
              <Link
                href={`/app/${orgSlug}/create`}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Abrir o studio →
              </Link>
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
