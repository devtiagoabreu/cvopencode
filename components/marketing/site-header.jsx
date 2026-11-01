"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#privacidade", label: "Privacidade" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-marketing flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/entrar"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:block"
          >
            Entrar
          </Link>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/criar-conta">Criar conta</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">
              {open ? "Fechar menu" : "Abrir menu"}
            </span>
            {open ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id="menu-mobile"
          className="border-t border-border bg-background md:hidden"
        >
          <nav aria-label="Principal (móvel)" className="container-marketing py-4">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-2 flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/entrar" onClick={() => setOpen(false)}>
                    Entrar
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/criar-conta" onClick={() => setOpen(false)}>
                    Criar conta
                  </Link>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
