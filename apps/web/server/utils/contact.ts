import { contactLeads, type Database, lt } from "@encre/db";

/**
 * Rétention RGPD des soumissions de contact — docs/01-data-model.md §8.
 * Les leads de contact sont conservés 3 ans à compter de leur création, puis
 * supprimés (minimisation). Aucune dépendance externe (pas d'IP persistée, pas
 * de contact tiers à nettoyer) → un simple DELETE suffit.
 */
export const CONTACT_LEAD_RETENTION_MS = 3 * 365 * 24 * 60 * 60 * 1000; // ~3 ans

/**
 * Supprime les leads de contact plus vieux que la durée de rétention. `now` est
 * injectable pour les tests. Renvoie le nombre de lignes supprimées.
 */
export async function purgeOldContactLeads(db: Database, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - CONTACT_LEAD_RETENTION_MS);
  const deleted = await db
    .delete(contactLeads)
    .where(lt(contactLeads.createdAt, cutoff))
    .returning({ id: contactLeads.id });
  return deleted.length;
}
