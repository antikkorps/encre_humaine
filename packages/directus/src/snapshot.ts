// Exporte le schéma Directus courant → snapshots/schema.yaml (artefact versionné, docs/02 §8).
// Couvre le modèle de données (collections/champs/relations). Les rôles/permissions
// sont gérés par bootstrap.ts (le snapshot Directus ne les couvre pas).
import { resolve } from "node:path";
import { compose, repoRoot } from "./compose.ts";

const CONTAINER_PATH = "/directus/snapshot.yaml";
const OUT = resolve(repoRoot, "packages/directus/snapshots/schema.yaml");

// L'image Directus n'expose pas `directus` dans le PATH ; le CLI est /directus/cli.js.
compose([
  "exec",
  "-T",
  "directus",
  "node",
  "cli.js",
  "schema",
  "snapshot",
  "--yes",
  CONTAINER_PATH,
]);
compose(["cp", `directus:${CONTAINER_PATH}`, OUT]);
console.log(`✓ snapshot → ${OUT}`);
