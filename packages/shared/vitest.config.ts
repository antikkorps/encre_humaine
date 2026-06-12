import { defineConfig } from "vitest/config";

// Schémas/env partagés — environnement Node (pas de DOM).
export default defineConfig({
  test: {
    name: "shared",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
