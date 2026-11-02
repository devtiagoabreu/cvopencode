import { headers as nextHeaders } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asset, assetDevice, device } from "@/lib/db/app-schema";
import { getWorkspaceAccess } from "@/lib/tenant";

const bodySchema = z.object({
  deviceId: z.string().min(4).max(100),
  opfsPath: z.string().min(4).max(500),
  deviceName: z.string().max(120).optional(),
  userAgent: z.string().max(500).optional(),
});

export async function POST(request, { params }) {
  const session = await auth.api.getSession({ headers: await nextHeaders() });

  if (!session) {
    return Response.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { id } = await params;

  let body;

  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const [row] = await db
    .select({ organizationId: asset.organizationId })
    .from(asset)
    .where(eq(asset.id, id))
    .limit(1);

  if (!row) {
    return Response.json({ error: "Mídia não encontrada." }, { status: 404 });
  }

  const access = await getWorkspaceAccess(session.user, row.organizationId);

  if (!access.allowed) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  await db
    .insert(device)
    .values({
      id: body.deviceId,
      userId: session.user.id,
      name: body.deviceName ?? "Navegador",
      userAgent: body.userAgent,
    })
    .onConflictDoUpdate({
      target: device.id,
      set: { lastSeenAt: new Date(), userId: session.user.id },
    });

  await db
    .insert(assetDevice)
    .values({
      assetId: id,
      deviceId: body.deviceId,
      opfsPath: body.opfsPath,
    })
    .onConflictDoUpdate({
      target: [assetDevice.assetId, assetDevice.deviceId],
      set: { opfsPath: body.opfsPath, cachedAt: new Date() },
    });

  return Response.json({ ok: true });
}
