"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "login",
  "register",
  "www",
  "support",
  "docs",
  "billing",
]);

function slugify(value) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const suffix = Math.random().toString(36).slice(2, 6);
  const slug = base ? `${base}-${suffix}` : `workspace-${suffix}`;
  return RESERVED_SLUGS.has(slug) ? `${slug}-workspace` : slug;
}

const messages = {
  USER_ALREADY_EXISTS: "Este e-mail já tem conta. Tente entrar.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  PASSWORD_TOO_SHORT: "A senha precisa de pelo menos 10 caracteres.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
};

function describeError(error) {
  if (!error) return "Não foi possível concluir. Tente de novo.";
  if (error.code && messages[error.code]) return messages[error.code];
  if (error.status === 429) {
    return "Muitas tentativas. Aguarde alguns instantes.";
  }
  return error.message || "Não foi possível concluir. Tente de novo.";
}

export function AuthForm({ mode }) {
  const router = useRouter();
  const isSignUp = mode === "signup";
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    const nextFieldErrors = {};
    if (isSignUp && name.length < 2) {
      nextFieldErrors.name = "Informe seu nome.";
    }
    if (!email.includes("@")) {
      nextFieldErrors.email = "Informe um e-mail válido.";
    }
    if (password.length < 10) {
      nextFieldErrors.password = "Use pelo menos 10 caracteres.";
    }
    if (isSignUp && confirm !== password) {
      nextFieldErrors.confirm = "As senhas não conferem.";
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setPending(true);
    try {
      if (!isSignUp) {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) {
          setFormError(describeError(error));
          return;
        }
        router.push("/app");
        router.refresh();
        return;
      }

      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) {
        setFormError(describeError(error));
        return;
      }

      const { error: orgError } = await authClient.organization.create({
        name: `Workspace de ${name}`,
        slug: slugify(name),
      });

      if (orgError) {
        console.error("Falha ao criar workspace inicial", orgError);
      }

      router.push("/app");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const fieldClass =
    "mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60";

  return (
    <main
      id="conteudo"
      className="flex flex-1 items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 sm:p-8">
        <Brand />

        <h1 className="mt-6 text-h1 font-semibold tracking-tight">
          {isSignUp ? "Criar conta" : "Entrar"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isSignUp
            ? "Sua conta começa com um workspace pessoal para chats, prompts e gerações."
            : "Use o e-mail e a senha da sua conta para abrir o studio."}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {isSignUp ? (
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                className={cn(fieldClass, fieldErrors.name && "border-destructive")}
                disabled={pending}
              />
              {fieldErrors.name ? (
                <p id="name-error" className="mt-1.5 text-xs text-destructive">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={cn(fieldClass, fieldErrors.email && "border-destructive")}
              disabled={pending}
            />
            {fieldErrors.email ? (
              <p id="email-error" className="mt-1.5 text-xs text-destructive">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={10}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password
                  ? "password-error"
                  : isSignUp
                    ? "password-hint"
                    : undefined
              }
              className={cn(
                fieldClass,
                fieldErrors.password && "border-destructive",
              )}
              disabled={pending}
            />
            {isSignUp && !fieldErrors.password ? (
              <p id="password-hint" className="mt-1.5 text-xs text-muted-foreground">
                Mínimo de 10 caracteres.
              </p>
            ) : null}
            {fieldErrors.password ? (
              <p id="password-error" className="mt-1.5 text-xs text-destructive">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {isSignUp ? (
            <div>
              <label htmlFor="confirm" className="text-sm font-medium">
                Confirmar senha
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={Boolean(fieldErrors.confirm)}
                aria-describedby={
                  fieldErrors.confirm ? "confirm-error" : undefined
                }
                className={cn(
                  fieldClass,
                  fieldErrors.confirm && "border-destructive",
                )}
                disabled={pending}
              />
              {fieldErrors.confirm ? (
                <p id="confirm-error" className="mt-1.5 text-xs text-destructive">
                  {fieldErrors.confirm}
                </p>
              ) : null}
            </div>
          ) : null}

          <div aria-live="polite" role="status">
            {formError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                {isSignUp ? "Criando conta" : "Entrando"}
              </>
            ) : isSignUp ? (
              "Criar conta"
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Já tem conta?{" "}
              <Link href="/entrar" className="font-medium text-foreground hover:underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <Link
                href="/criar-conta"
                className="font-medium text-foreground hover:underline"
              >
                Criar conta
              </Link>
            </>
          )}
        </p>

        <Link
          href="/"
          className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
