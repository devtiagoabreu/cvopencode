import { and, eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { member } from "./db/schema.js";

export async function getWorkspaceAccess(user, organizationId) {
  const [row] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, user.id),
      ),
    )
    .limit(1);

  const isPlatformAdmin = user.role === "admin";

  return {
    allowed: Boolean(row) || isPlatformAdmin,
    isPlatformAdmin,
    role: row?.role ?? null,
  };
}
