import { defineConfig } from "vitest/config";

// Schéma Drizzle — environnement Node.
export default defineConfig({
  test: {
    name: "db",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
