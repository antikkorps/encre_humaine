import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Schéma Postgres `app` — docs/01-data-model.md §2.
 * Nos migrations Drizzle ne touchent QUE ce schéma. Directus et Umami
 * gèrent les leurs. Aucune FK croisée entre schémas.
 */
export const app = pgSchema("app");
