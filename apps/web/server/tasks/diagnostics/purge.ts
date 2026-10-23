import { serverDb } from "~~/server/utils/db";
import { purgeOldDiagnostics } from "~~/server/utils/diagnostics";

/**
 * Tâche planifiée — purge RGPD des diagnostics de plus de 3 ans
 * (docs/11-diagnostics.md). Programmée via `nitro.scheduledTasks` (nuxt.config).
 */
export default defineTask({
  meta: {
    name: "diagnostics:purge",
    description: "Purge des diagnostics au-delà de la rétention (RGPD).",
  },
  async run() {
    const purged = await purgeOldDiagnostics(serverDb());
    console.info(`[diagnostics:purge] ${purged} diagnostic(s) expiré(s) supprimé(s).`);
    return { result: { purged } };
  },
});
