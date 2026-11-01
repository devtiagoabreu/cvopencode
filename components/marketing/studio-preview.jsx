import { HardDrive, Play, RefreshCw, Sparkles } from "lucide-react";

export function StudioPreview() {
  return (
    <figure
      className="overflow-hidden rounded-lg border border-border bg-card"
      aria-label="Exemplo de interface do studio: formulário de prompt à esquerda e prévia de vídeo à direita"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          <p className="text-sm font-medium">Studio</p>
          <span className="font-mono text-xs text-muted-foreground">
            /app/acme/create
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            <RefreshCw aria-hidden="true" className="size-3" />
            conteúdo sincronizado
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            <HardDrive aria-hidden="true" className="size-3" />
            mídia neste dispositivo
          </span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4 border-b border-border p-4 md:border-b-0 md:border-r">
          <div className="flex flex-wrap gap-1" aria-hidden="true">
            {["Texto", "Imagem", "Vídeo", "Multimodal"].map((mode, index) => (
              <span
                key={mode}
                className={
                  index === 2
                    ? "rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                    : "rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
                }
              >
                {mode}
              </span>
            ))}
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">Prompt</p>
            <p className="mt-1 text-sm leading-relaxed">
              Uma cidade costeira ao amanhecer, câmera lenta sobre os telhados,
              luz suave e névoa baixa.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
              <span className="font-mono text-xs text-muted-foreground">
                pollinations/flux
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <Sparkles aria-hidden="true" className="size-3" />
                grátis
              </span>
            </div>
          </div>

          <div className="space-y-2" aria-hidden="true">
            {["enviando", "gerando", "baixando", "salvando"].map(
              (step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={
                      index < 2
                        ? "size-1.5 rounded-full bg-primary"
                        : "size-1.5 rounded-full bg-border"
                    }
                  />
                  <span
                    className={
                      index < 2
                        ? "text-xs text-foreground"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {step}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.17_285/0.28),transparent_55%),radial-gradient(circle_at_75%_80%,oklch(0.65_0.12_210/0.25),transparent_50%)]"
            />
            <span className="relative flex size-12 items-center justify-center rounded-full border border-border bg-background/80">
              <Play aria-hidden="true" className="ml-0.5 size-5" />
            </span>
            <span className="absolute right-2 bottom-2 rounded bg-background/85 px-1.5 py-0.5 font-mono text-xs">
              00:08
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border px-2 py-1 font-mono text-xs">
              pollinations
            </span>
            <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
              imagem + prompt
            </span>
            <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
              download para este dispositivo
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
