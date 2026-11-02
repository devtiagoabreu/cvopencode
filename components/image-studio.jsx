"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ensurePersistentStorage,
  getDeviceId,
  readOpfs,
  writeOpfs,
} from "@/lib/opfs";

const ASPECTS = [
  { id: "1:1", label: "Quadrado", hint: "1024 × 1024" },
  { id: "4:3", label: "Paisagem", hint: "1024 × 768" },
  { id: "16:9", label: "Wide", hint: "1280 × 720" },
  { id: "9:16", label: "Retrato", hint: "720 × 1280" },
];

const ERROR_MESSAGES = {
  rate_limited: "O provedor está limitando. Aguarde alguns segundos.",
  payment_required:
    "O modo gratuito recusou a geração (créditos). Tente em instantes.",
  timeout: "O provedor demorou demais. Tente novamente.",
  provider_error: "O provedor não conseguiu gerar. Tente outro prompt.",
  network_error: "Falha de rede ao falar com o provedor.",
  too_large: "A imagem ficou grande demais.",
  invalid_input: "Descreva a imagem com 3 a 1000 caracteres.",
  unauthorized: "Sua sessão expirou. Entre novamente.",
  forbidden: "Você não tem acesso a este workspace.",
};

export function ImageStudio({ organizationId, userId }) {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [model, setModel] = useState("flux");
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [items, setItems] = useState([]);
  const deviceId = useRef(null);
  const urls = useRef(new Set());

  const trackUrl = useCallback((url) => {
    urls.current.add(url);
    return url;
  }, []);

  useEffect(() => {
    const id = getDeviceId();
    deviceId.current = id;

    ensurePersistentStorage().then((granted) => {
      if (!granted) {
        setNotice(
          "O navegador não garantiu armazenamento persistente. As imagens podem ser removidas sob pressão de espaço.",
        );
      }
    });

    async function load() {
      try {
        const response = await fetch(
          `/api/assets?organizationId=${encodeURIComponent(organizationId)}&deviceId=${encodeURIComponent(id ?? "")}`,
        );

        if (!response.ok) return;

        const { assets } = await response.json();
        const loaded = [];

        for (const item of assets) {
          let url = null;

          if (item.opfsPath) {
            const file = await readOpfs(item.opfsPath);
            if (file) url = trackUrl(URL.createObjectURL(file));
          }

          loaded.push({ ...item, url });
        }

        setItems(loaded);
      } catch {
        setError("Não foi possível carregar o histórico local.");
      }
    }

    load();

    const tracked = urls.current;

    return () => {
      for (const url of tracked) URL.revokeObjectURL(url);
      tracked.clear();
    };
  }, [organizationId, trackUrl]);

  async function handleGenerate(event) {
    event.preventDefault();
    setError(null);

    const cleanPrompt = prompt.trim();

    if (cleanPrompt.length < 3) {
      setError(ERROR_MESSAGES.invalid_input);
      return;
    }

    setBusy(true);

    try {
      const payload = { organizationId, prompt: cleanPrompt, aspect, model };

      if (seed.trim() !== "") payload.seed = Number(seed);

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(ERROR_MESSAGES[data.code] ?? data.error ?? "Falha ao gerar.");
        return;
      }

      const blob = await response.blob();
      const opfsPath = response.headers.get("x-opfs-path");
      const assetId = response.headers.get("x-asset-id");
      const demo = response.headers.get("x-demo") === "true";

      await writeOpfs(opfsPath, blob);
      const url = trackUrl(URL.createObjectURL(blob));

      await fetch(`/api/assets/${assetId}/cache`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deviceId: deviceId.current,
          opfsPath,
          deviceName: "Navegador",
          userAgent: navigator.userAgent.slice(0, 400),
        }),
      });

      const item = {
        id: assetId,
        prompt: cleanPrompt,
        model: response.headers.get("x-model"),
        url,
        opfsPath,
        cached: true,
        createdAt: new Date().toISOString(),
      };

      setItems((current) => [item, ...current.filter((i) => i.id !== assetId)]);
      setResult({ ...item, demo });
      setNotice(
        demo
          ? "Modo demonstração sem chave: imagens saem com marca d'água e o limite é 1 geração a cada 15 segundos. Configure POLLINATIONS_API_KEY para produção."
          : null,
      );
    } catch {
      setError("Não foi possível salvar a imagem neste dispositivo.");
    } finally {
      setBusy(false);
    }
  }

  function remix(item) {
    setPrompt(item.prompt ?? "");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Imagem
            </span>
            <span className="text-xs text-muted-foreground">
              Vídeo, texto e multimodal em breve
            </span>
          </div>

          <label
            htmlFor="prompt"
            className="mt-5 block text-sm font-medium"
          >
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value.slice(0, 1000))}
            rows={5}
            placeholder="Descreva a imagem: cena, estilo, luz, cores…"
            className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p className="mt-1 text-right font-mono text-xs text-muted-foreground">
            {prompt.length}/1000
          </p>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Formato</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ASPECTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={aspect === option.id}
                  onClick={() => setAspect(option.id)}
                  className={
                    aspect === option.id
                      ? "rounded-md border border-primary bg-primary/10 px-3 py-2 text-left text-sm"
                      : "rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                  }
                >
                  <span className="block font-medium">{option.label}</span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="model" className="block text-sm font-medium">
                Modelo
              </label>
              <select
                id="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="flux">flux (qualidade)</option>
                <option value="turbo">turbo (rápido)</option>
              </select>
            </div>
            <div>
              <label htmlFor="seed" className="block text-sm font-medium">
                Seed{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </label>
              <input
                id="seed"
                inputMode="numeric"
                value={seed}
                onChange={(event) =>
                  setSeed(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="aleatória"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <Button type="submit" disabled={busy} className="mt-5 w-full" size="lg">
            {busy ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {busy ? "Gerando…" : "Gerar imagem"}
          </Button>

          <p className="mt-3 text-xs text-muted-foreground">
            Provedor: Pollinations (gratuito). A imagem é salva apenas neste
            dispositivo (OPFS); os metadados ficam no workspace.
          </p>
        </div>

        <div aria-live="polite" className="min-h-6 text-sm">
          {busy ? (
            <p className="text-muted-foreground">Gerando imagem…</p>
          ) : null}
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-foreground">
              {notice}
            </p>
          ) : null}
        </div>
      </form>

      <div className="space-y-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-h3 font-semibold">Prévia</h2>

          {result ? (
            <figure className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt={result.prompt}
                className="w-full rounded-md border border-border"
              />
              <figcaption className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {result.prompt}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={result.url}
                      download={`cvopencode-${result.id}.jpg`}
                    >
                      <Download aria-hidden="true" />
                      Baixar
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remix(result)}
                  >
                    <RotateCcw aria-hidden="true" />
                    Reutilizar prompt
                  </Button>
                </div>
              </figcaption>
            </figure>
          ) : (
            <div className="mt-4 flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 p-8 text-center">
              <ImagePlus
                aria-hidden="true"
                className="size-8 text-muted-foreground"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                A imagem gerada aparece aqui e fica salva neste dispositivo.
              </p>
            </div>
          )}
        </div>

        <section>
          <h2 className="text-h3 font-semibold">Neste dispositivo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {userId ? "Histórico local do workspace." : null}
          </p>

          {items.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Nenhuma imagem ainda. Gere a primeira ao lado.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.prompt ?? "Imagem gerada"}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                      Não está neste dispositivo
                    </div>
                  )}
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.prompt ?? "Sem prompt registrado"}
                    </p>
                    {item.url ? (
                      <a
                        href={item.url}
                        download={`cvopencode-${item.id}.jpg`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Download aria-hidden="true" className="size-3" />
                        Baixar
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
