import { createDb, type Database } from "@encre/db";

/**
 * Client Drizzle côté serveur (schéma `app`) — docs/01-data-model.md §9.
 * Mémoïsé : une seule pool postgres-js pour tout le runtime Nitro.
 * La chaîne de connexion vient du runtimeConfig (secret, jamais exposé client).
 */
let db: Database | null = null;

export function serverDb(): Database {
  if (db) return db;
  const { appDatabaseUrl } = useRuntimeConfig();
  if (!appDatabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Base de données non configurée (APP_DATABASE_URL).",
    });
  }
  db = createDb(appDatabaseUrl);
  return db;
}
