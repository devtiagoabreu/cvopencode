import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, organization, user } from "@/lib/db/schema";

export const instant = false;

export const metadata = { title: "Administração" };

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/entrar");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  const organizations = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .orderBy(desc(organization.createdAt));

  const members = await db
    .select({
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
    })
    .from(member);

  const memberCount = (organizationId) =>
    members.filter((row) => row.organizationId === organizationId).length;

  return (
    <>
      <header className="border-b border-border">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brand />
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span className="text-sm font-medium">Administração</span>
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
          <h1 className="text-h1 font-semibold tracking-tight">
            Administração
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Visão de todas as contas e workspaces da plataforma. Como
            administrador, você pode abrir qualquer workspace e fazer
            alterações.
          </p>

          <section className="mt-10">
            <h2 className="text-h3 font-semibold">
              Usuários ({users.length})
            </h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Usuário
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      E-mail
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Papel
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Verificado
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3">{row.role}</td>
                      <td className="px-4 py-3">
                        {row.emailVerified ? "sim" : "não"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-h3 font-semibold">
              Workspaces ({organizations.length})
            </h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Nome
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Slug
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Membros
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Criado em
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {organizations.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.slug}
                      </td>
                      <td className="px-4 py-3">{memberCount(row.id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/${row.slug}`}
                          className="font-medium text-primary hover:underline"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
