// Seed CIBLÉ des textes des diagnostics (docs/11-diagnostics.md) — remplit les
// singletons `diagnostic_b2b` / `diagnostic_b2c` avec les textes du cahier des
// charges, UNIQUEMENT là où un champ est vide (jamais d'écrasement du texte
// d'Éléonore). Idempotent.
//
//   pnpm --filter @encre/directus seed:diagnostics            (aperçu)
//   pnpm --filter @encre/directus seed:diagnostics -- --apply (applique)
//
// `bootstrap` (nouveaux singletons) AVANT ce script.

import { pathToFileURL } from "node:url";
import { DIAGNOSTIC_TEXTS } from "./content-diagnostics.ts";
import { fillEmpty } from "./seed-singleton.ts";

export async function seedDiagnosticTexts(options: {
  apply: boolean;
  act: (msg: string) => void;
}): Promise<void> {
  for (const [collection, values] of Object.entries(DIAGNOSTIC_TEXTS)) {
    await fillEmpty(collection, values, options);
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);
  console.log(
    apply ? "→ Textes des diagnostics (écriture)…" : "→ Textes des diagnostics — APERÇU…",
  );
  await seedDiagnosticTexts({ apply, act });
  console.log(apply ? "\n✓ Textes appliqués." : "\n✓ Aperçu terminé (ajouter --apply).");
}

// Exécuté seulement en script : le seed complet l'importe sans le lancer.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error("\n✗ Textes des diagnostics :", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
