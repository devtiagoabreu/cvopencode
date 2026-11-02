import { headers as nextHeaders } from "next/headers";
import { and, desc, eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asset, assetDevice, generation } from "@/lib/db/app-schema";
import { getWorkspaceAccess } from "@/lib/tenant";

export async function GET(request) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });

  if (!session) {
    return Response.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const deviceId = searchParams.get("deviceId") ?? "";
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 24), 1),
    60,
  );

  if (!organizationId) {
    return Response.json(
      { error: "organizationId é obrigatório." },
      { status: 400 },
    );
  }

  const access = await getWorkspaceAccess(session.user, organizationId);

  if (!access.allowed) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const rows = await db
    .select({
      id: asset.id,
      kind: asset.kind,
      mimeType: asset.mimeType,
      bytes: asset.bytes,
      width: asset.width,
      height: asset.height,
      provider: asset.provider,
      createdAt: asset.createdAt,
      prompt: generation.prompt,
      mode: generation.mode,
      model: generation.model,
      opfsPath: assetDevice.opfsPath,
    })
    .from(asset)
    .leftJoin(
      assetDevice,
      and(
        eq(assetDevice.assetId, asset.id),
        eq(assetDevice.deviceId, deviceId),
      ),
    )
    .leftJoin(generation, eq(generation.outputAssetId, asset.id))
    .where(
      and(
        eq(asset.organizationId, organizationId),
        isNull(asset.deletedAt),
      ),
    )
    .orderBy(desc(asset.createdAt))
    .limit(limit);

  return Response.json({
    assets: rows.map((row) => ({
      ...row,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : row.createdAt,
      cached: Boolean(row.opfsPath),
    })),
  });
}
