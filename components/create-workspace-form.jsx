"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function CreateWorkspaceForm({ userName }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(name);

    if (name.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    setPending(true);
    try {
      const { error: createError } = await authClient.organization.create({
        name,
        slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      });

      if (createError) {
        setError(
          createError.code === "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS"
            ? "Limite de workspaces atingido."
            : createError.message || "Não foi possível criar o workspace.",
        );
        return;
      }

      router.push("/app");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      id="conteudo"
      className="flex flex-1 items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 sm:p-8">
        <Brand />
        <h1 className="mt-6 text-h1 font-semibold tracking-tight">
          Crie seu workspace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Olá, {userName}. Um workspace reúne chats, prompts, agentes e
          gerações da sua equipe.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="workspace-name" className="text-sm font-medium">
              Nome do workspace
            </label>
            <input
              id="workspace-name"
              name="name"
              type="text"
              required
              autoFocus
              className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              disabled={pending}
            />
          </div>

          <div aria-live="polite" role="status">
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Criando workspace
              </>
            ) : (
              "Criar workspace"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
