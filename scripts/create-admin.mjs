import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { auth } from "../lib/auth.js";
import { db } from "../lib/db/index.js";
import { account, user } from "../lib/db/schema.js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("uso: node --env-file=.env.local scripts/create-admin.mjs <email> <senha>");
  process.exit(1);
}

const [existing] = await db
  .select({ id: user.id })
  .from(user)
  .where(eq(user.email, email))
  .limit(1);

let userId = existing?.id;

if (!userId) {
  const temporary = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const created = await auth.api.signUpEmail({
    body: { name: email.split("@")[0], email, password: temporary },
  });
  userId = created.user.id;
}

const hashed = await hashPassword(password);

await db
  .update(account)
  .set({ password: hashed, updatedAt: new Date() })
  .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));

await db
  .update(user)
  .set({ role: "admin", emailVerified: true })
  .where(eq(user.id, userId));

console.log(`admin pronto: ${email} (${userId})`);
process.exit(0);
