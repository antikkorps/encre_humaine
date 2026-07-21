import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_CHOICES } from "../../../packages/directus/src/icons.ts";

// Invariant : toute icône proposée à Éléonore dans Directus (ICON_CHOICES) doit être
// embarquée dans le `clientBundle` de @nuxt/icon — sinon elle est éditable côté CMS
// mais s'affiche VIDE sur le site (`fallbackToApi: false`).
describe("icônes — miroir ICON_CHOICES / clientBundle", () => {
  const config = readFileSync(resolve(process.cwd(), "nuxt.config.ts"), "utf8");
  const bundled = new Set(config.match(/material-symbols:[a-z0-9-]+/g) ?? []);

  it("embarque chaque choix d'icône du CMS", () => {
    const missing = ICON_CHOICES.map((c) => `material-symbols:${c.value}`).filter(
      (key) => !bundled.has(key),
    );
    expect(missing).toEqual([]);
  });
});
