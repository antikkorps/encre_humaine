import { serverDb } from "~~/server/utils/db";
import { purgeExpiredPending } from "~~/server/utils/newsletter";
import { removeNewsletterContact } from "~~/server/utils/resend";

/**
 * Tâche planifiée — purge RGPD des inscriptions newsletter non confirmées de
 * plus de 30 jours (docs/03-api-contracts.md §3.4). Programmée via
 * `nitro.scheduledTasks` (nuxt.config). Supprime le contact Resend puis la
 * ligne DB ; conserve la preuve de consentement des `confirmed` (docs/01 §8).
 */
export default defineTask({
  meta: {
    name: "newsletter:purge",
    description: "Purge des inscriptions newsletter pending expirées (RGPD).",
  },
  async run() {
    const db = serverDb();
    const purged = await purgeExpiredPending(db, removeNewsletterContact);
    console.info(`[newsletter:purge] ${purged} inscription(s) pending expirée(s) supprimée(s).`);
    return { result: { purged } };
  },
});
