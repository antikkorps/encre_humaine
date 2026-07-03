// Résolution de la config d'accès à Directus pour les scripts de bootstrap/snapshot.
// Priorité : variables d'environnement du process, puis `infra/env/.env` (dev local).
// Aucun secret en dur ; en CI/prod, on passe par l'environnement.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const envFile = resolve(repoRoot, "infra/env/.env");

/** Parse paresseux d'un fichier .env (KEY=VALUE), sans dépendance externe. */
function loadEnvFile(path: string): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    // Retire un éventuel commentaire en fin de ligne + guillemets entourants.
    let value = trimmed.slice(eq + 1).trim();
    const hash = value.indexOf(" #");
    if (hash !== -1) value = value.slice(0, hash).trim();
    value = value.replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

const fileEnv = loadEnvFile(envFile);

function get(key: string, fallback?: string): string {
  const v = process.env[key] ?? fileEnv[key] ?? fallback;
  if (v === undefined) throw new Error(`Variable manquante : ${key} (ni env ni ${envFile})`);
  return v;
}

const hostPort = process.env.HOST_DIRECTUS_PORT ?? "8055";

export const config = {
  /** URL de l'API Directus. En local : http://127.0.0.1:8055 (overlay dev). */
  url: process.env.DIRECTUS_URL ?? `http://127.0.0.1:${hostPort}`,
  adminEmail: get("DIRECTUS_ADMIN_EMAIL"),
  adminPassword: get("DIRECTUS_ADMIN_PASSWORD"),
  /** Token statique lecture seule (published-only) du rôle API consommé par Nuxt. */
  readToken: get("DIRECTUS_READ_TOKEN"),
  /** Compte éditeur (Eléonore) — rôle Éditrice. */
  editorEmail: get("DIRECTUS_EDITOR_EMAIL", "eleonore@encrehumaine.fr"),
  /**
   * Mot de passe INITIAL de l'éditrice (changé à la 1re connexion). OPTIONNEL :
   * vide → le bootstrap ne crée pas le compte (cas dev/CI). Jamais réécrit sur un
   * compte existant (re-runs idempotents sans réinitialiser son mot de passe).
   */
  editorPassword: process.env.DIRECTUS_EDITOR_PASSWORD ?? fileEnv.DIRECTUS_EDITOR_PASSWORD ?? "",
  /** URL publique du site → Project URL Directus (logo cliquable vers le site). Vide = ignoré. */
  siteUrl: process.env.BASE_URL ?? fileEnv.BASE_URL ?? "",
  /** Tableau de bord Umami (dérivé de ANALYTICS_SCRIPT_URL) → lien barre de modules. Vide = ignoré. */
  umamiUrl: (process.env.ANALYTICS_SCRIPT_URL ?? fileEnv.ANALYTICS_SCRIPT_URL ?? "").replace(
    /\/script\.js$/,
    "",
  ),
};
