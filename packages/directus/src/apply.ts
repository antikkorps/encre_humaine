// Rejoue snapshots/schema.yaml sur l'instance Directus courante (docs/02 §8).
// Reproductible sur une instance vierge. Les rôles/permissions se font via bootstrap.ts.
import { resolve } from "node:path";
import { compose, repoRoot } from "./compose.ts";

const CONTAINER_PATH = "/directus/snapshot.yaml";
const SRC = resolve(repoRoot, "packages/directus/snapshots/schema.yaml");

compose(["cp", SRC, `directus:${CONTAINER_PATH}`]);
// L'image Directus n'expose pas `directus` dans le PATH ; le CLI est /directus/cli.js.
compose(["exec", "-T", "directus", "node", "cli.js", "schema", "apply", "--yes", CONTAINER_PATH]);
console.log("✓ snapshot appliqué");
