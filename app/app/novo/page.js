import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateWorkspaceForm } from "@/components/create-workspace-form";

export const instant = false;

export const metadata = {
  title: "Novo workspace",
};

export default async function NewWorkspacePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/entrar");
  }

  return <CreateWorkspaceForm userName={session.user.name} />;
}
