import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";

export * from "./schema/index.ts";

/**
 * Client Drizzle (postgres-js). docs/01-data-model.md §9 :
 * le schéma + client vivent ici, importés par `apps/web` via workspace:*.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

// Types dérivés du schéma (jamais ré-écrits à la main) — docs/01 §9, §10.
export type Order = InferSelectModel<typeof schema.orders>;
export type NewOrder = InferInsertModel<typeof schema.orders>;
export type ContactLead = InferSelectModel<typeof schema.contactLeads>;
export type NewContactLead = InferInsertModel<typeof schema.contactLeads>;
export type NewsletterSubscriber = InferSelectModel<typeof schema.newsletterSubscribers>;
export type NewNewsletterSubscriber = InferInsertModel<typeof schema.newsletterSubscribers>;
