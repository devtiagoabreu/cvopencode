import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container-marketing flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Brand />
          <p className="text-sm text-muted-foreground">
            Vídeos com modelos abertos, conteúdo sincronizado e mídia no seu
            dispositivo.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            fase de desenvolvimento
          </p>
        </div>

        <nav aria-label="Rodapé">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
            <li>
              <a
                href="#como-funciona"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Como funciona
              </a>
            </li>
            <li>
              <a
                href="#recursos"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Recursos
              </a>
            </li>
            <li>
              <a
                href="#privacidade"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacidade
              </a>
            </li>
            <li>
              <a
                href="#perguntas"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dúvidas
              </a>
            </li>
            <li>
              <Link
                href="/entrar"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Entrar
              </Link>
            </li>
            <li>
              <Link
                href="/criar-conta"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Criar conta
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="container-marketing flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© cvopencode. Licença MIT.</p>
          <p>
            Limites gratuitos e expiração de URLs são exibidos antes de gerar.
          </p>
        </div>
      </div>
    </footer>
  );
}
