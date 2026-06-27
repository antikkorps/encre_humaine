import { purgeOldContactLeads } from "~~/server/utils/contact";
import { serverDb } from "~~/server/utils/db";

/**
 * Tâche planifiée — purge RGPD des leads de contact de plus de 3 ans
 * (docs/01-data-model.md §8). Programmée via `nitro.scheduledTasks` (nuxt.config).
 */
export default defineTask({
  meta: {
    name: "contact:purge",
    description: "Purge des leads de contact au-delà de la rétention (RGPD).",
  },
  async run() {
    const db = serverDb();
    const purged = await purgeOldContactLeads(db);
    console.info(`[contact:purge] ${purged} lead(s) de contact expiré(s) supprimé(s).`);
    return { result: { purged } };
  },
});
