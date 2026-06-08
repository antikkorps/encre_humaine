import { defineConfig } from "drizzle-kit";

/**
 * Config drizzle-kit — docs/01-data-model.md §9, docs/07-deploy.md §4.
 * Migrations versionnées dans `migrations/`, appliquées sur le schéma `app`.
 * Jamais de `push` auto en prod.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  schemaFilter: ["app"],
  dbCredentials: {
    url:
      process.env.APP_DATABASE_URL ??
      "postgres://app_user:app@localhost:5432/encre?search_path=app",
  },
  strict: true,
  verbose: true,
});
