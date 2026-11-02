import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Brand } from "@/components/brand";
import { ImageStudio } from "@/components/image-studio";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema";

export const instant = false;

export async function generateMetadata({ params }) {
  const { orgSlug } = await params;
  return { title: `Criar · ${orgSlug}` };
}

export default async function CreatePage({ params }) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/entrar");
  }

  const [membership] = await db
    .select({ organizationId: organization.id, name: organization.name })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(
      and(eq(organization.slug, orgSlug), eq(member.userId, session.user.id)),
    )
    .limit(1);

  const isPlatformAdmin = session.user.role === "admin";

  let workspace = membership;

  if (!workspace && isPlatformAdmin) {
    const [org] = await db
      .select({ organizationId: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.slug, orgSlug))
      .limit(1);
    workspace = org;
  }

  if (!workspace) {
    notFound();
  }

  return (
    <>
      <header className="border-b border-border">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Brand />
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <Link
              href={`/app/${orgSlug}`}
              className="truncate text-sm font-medium hover:underline"
            >
              {workspace.name}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/app/${orgSlug}`}
              className="hidden text-sm text-muted-foreground hover:underline sm:block"
            >
              Dashboard
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
        <div className="container-app py-10">
          <p className="font-mono text-xs text-muted-foreground">
            /app/{orgSlug}/create
          </p>
          <h1 className="mt-2 text-h1 font-semibold tracking-tight">
            Criar imagem
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gere imagens com provedores gratuitos. O arquivo fica no seu
            dispositivo; o workspace guarda apenas os metadados.
          </p>

          <div className="mt-8">
            <ImageStudio
              organizationId={workspace.organizationId}
              userId={session.user.id}
            />
          </div>
        </div>
      </main>
    </>
  );
}
