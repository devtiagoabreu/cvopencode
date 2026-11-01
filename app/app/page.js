import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema";

export const instant = false;

export const metadata = {
  title: "Studio",
};

export default async function AppIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/entrar");
  }

  const [workspace] = await db
    .select({ slug: organization.slug })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, session.user.id))
    .limit(1);

  if (!workspace) {
    redirect("/app/novo");
  }

  redirect(`/app/${workspace.slug}`);
}
