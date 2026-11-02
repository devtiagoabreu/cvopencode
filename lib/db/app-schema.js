import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const device = pgTable("device", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const generation = pgTable(
  "generation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by").notNull(),
    prompt: text("prompt").notNull(),
    mode: text("mode").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    params: jsonb("params").$type().notNull().default({}),
    status: text("status").notNull().default("queued"),
    progress: integer("progress").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    externalId: text("external_id"),
    outputUrl: text("output_url"),
    outputAssetId: text("output_asset_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("generation_org_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

export const asset = pgTable(
  "asset",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by").notNull(),
    kind: text("kind").notNull(),
    mimeType: text("mime_type").notNull(),
    bytes: bigint("bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    checksum: text("checksum"),
    provider: text("provider"),
    providerUrl: text("provider_url"),
    source: text("source").notNull().default("generated"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("asset_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const assetDevice = pgTable(
  "asset_device",
  {
    assetId: text("asset_id").notNull(),
    deviceId: text("device_id").notNull(),
    opfsPath: text("opfs_path").notNull(),
    cachedAt: timestamp("cached_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.assetId, table.deviceId] }),
    index("asset_device_device_idx").on(table.deviceId),
  ],
);
