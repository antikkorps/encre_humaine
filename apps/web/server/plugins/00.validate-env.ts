import { serverEnv } from "../utils/env";

/**
 * Validation d'environnement au démarrage — docs/06-security.md §5,
 * docs/07-deploy.md §10.4. Si une variable requise manque/est malformée,
 * l'erreur est levée au boot et `web` refuse de démarrer.
 */
export default defineNitroPlugin(() => {
  try {
    serverEnv();
  } catch (err) {
    console.error("[boot] Échec de la validation d'environnement.");
    console.error(err instanceof Error ? err.message : err);
    throw err;
  }
});
