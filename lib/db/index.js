import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis;

const sql =
  globalForDb.__cvopencodeSql ??
  postgres(process.env.DATABASE_URL, {
    max: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__cvopencodeSql = sql;
}

export const db = drizzle(sql, { schema });
export { sql };
