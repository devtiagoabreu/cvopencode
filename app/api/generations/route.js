import { createHash, randomUUID } from "node:crypto";
import { headers as nextHeaders } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asset, generation } from "@/lib/db/app-schema";
import {
  extensionFor,
  pollinationsImageRequest,
} from "@/lib/providers/pollinations";
import { takeToken } from "@/lib/rate-limit";
import { getWorkspaceAccess } from "@/lib/tenant";

const ASPECTS = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

const bodySchema = z.object({
  organizationId: z.string().min(1),
  prompt: z.string().trim().min(3).max(1000),
  aspect: z.enum(Object.keys(ASPECTS)).default("1:1"),
  seed: z.number().int().min(0).max(2_147_483_647).optional(),
  model: z.enum(["flux", "turbo"]).default("flux"),
});

const MAX_BYTES = 15 * 1024 * 1024;

function fail(message, code, status, extra = {}) {
  return Response.json({ error: message, code, ...extra }, { status });
}

export async function POST(request) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });

  if (!session) {
    return fail("Sua sessão expirou. Entre novamente.", "unauthorized", 401);
  }

  let body;

  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return fail(
      "Descreva o que você quer gerar (3 a 1000 caracteres) e escolha um formato.",
      "invalid_input",
      400,
    );
  }

  const access = await getWorkspaceAccess(session.user, body.organizationId);

  if (!access.allowed) {
    return fail("Você não tem acesso a este workspace.", "forbidden", 403);
  }

  const demo = !process.env.POLLINATIONS_API_KEY;
  const limit = takeToken(
    `image:${session.user.id}`,
    demo ? 15_000 : 3_000,
  );

  if (!limit.allowed) {
    return fail(
      "Limite gratuito atingido. Aguarde alguns segundos e tente de novo.",
      "rate_limited",
      429,
      { retryAfterMs: limit.retryAfterMs },
    );
  }

  const { width, height } = ASPECTS[body.aspect];
  const seed = body.seed ?? Math.floor(Math.random() * 2_147_483_647);
  const generationId = randomUUID();
  const now = new Date();

  await db.insert(generation).values({
    id: generationId,
    organizationId: body.organizationId,
    createdBy: session.user.id,
    prompt: body.prompt,
    mode: "text-to-image",
    provider: "pollinations",
    model: body.model,
    params: { aspect: body.aspect, width, height, seed },
    status: "running",
    progress: 10,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const { url, headers, demo: isDemo } = pollinationsImageRequest({
    prompt: body.prompt,
    width,
    height,
    seed,
    model: body.model,
  });

  let upstream;

  try {
    upstream = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(90_000),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut =
      error?.name === "TimeoutError" || error?.name === "AbortError";

    await db
      .update(generation)
      .set({
        status: "failed",
        errorCode: timedOut ? "timeout" : "network_error",
        errorMessage: String(error?.message ?? error),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(generation.id, generationId));

    return fail(
      timedOut
        ? "O provedor demorou demais para responder. Tente novamente."
        : "Não foi possível falar com o provedor de imagens.",
      timedOut ? "timeout" : "network_error",
      timedOut ? 504 : 502,
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const buffer = await upstream.arrayBuffer();

  if (!upstream.ok || !contentType.startsWith("image/")) {
    const readable = /json|text/i.test(contentType);
    const detail = readable
      ? sanitize(Buffer.from(buffer).toString("utf8"))
      : "";

    const code =
      upstream.status === 429
        ? "rate_limited"
        : upstream.status === 402
          ? "payment_required"
          : "provider_error";

    await db
      .update(generation)
      .set({
        status: "failed",
        errorCode: code,
        errorMessage: `HTTP ${upstream.status}${detail ? `: ${detail}` : ""}`.slice(
          0,
          500,
        ),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(generation.id, generationId));

    if (code === "payment_required") {
      return fail(
        "O provedor recusou a geração (limite de créditos do modo gratuito). Tente de novo em instantes ou configure POLLINATIONS_API_KEY.",
        code,
        402,
      );
    }

    return fail(
      code === "rate_limited"
        ? "O provedor está limitando as requisições. Aguarde e tente de novo."
        : "O provedor não conseguiu gerar a imagem. Tente outro prompt.",
      code,
      code === "rate_limited" ? 429 : 502,
    );
  }

  if (buffer.byteLength > MAX_BYTES) {
    await db
      .update(generation)
      .set({
        status: "failed",
        errorCode: "too_large",
        errorMessage: "Imagem maior que 15 MB",
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(generation.id, generationId));

    return fail("A imagem gerada excedeu 15 MB.", "too_large", 502);
  }

  const assetId = randomUUID();
  const mimeType = contentType.split(";")[0].trim();
  const ext = extensionFor(mimeType);
  const checksum = createHash("sha256")
    .update(Buffer.from(buffer))
    .digest("hex");
  const opfsPath = `${session.user.id}/${body.organizationId}/${assetId}.${ext}`;

  await db.insert(asset).values({
    id: assetId,
    organizationId: body.organizationId,
    createdBy: session.user.id,
    kind: "image",
    mimeType,
    bytes: buffer.byteLength,
    width,
    height,
    checksum,
    provider: "pollinations",
    providerUrl: url.toString(),
    source: "generated",
  });

  await db
    .update(generation)
    .set({
      status: "ready",
      progress: 100,
      outputAssetId: assetId,
      outputUrl: url.toString(),
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(generation.id, generationId));

  return new Response(buffer, {
    status: 200,
    headers: {
      "content-type": mimeType,
      "content-length": String(buffer.byteLength),
      "cache-control": "private, no-store",
      "x-asset-id": assetId,
      "x-generation-id": generationId,
      "x-opfs-path": opfsPath,
      "x-provider": "pollinations",
      "x-model": body.model,
      "x-seed": String(seed),
      "x-demo": String(isDemo),
    },
  });
}

function sanitize(text) {
  return text
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
