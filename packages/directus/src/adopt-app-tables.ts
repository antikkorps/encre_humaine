// Adoption des tables de l'APPLICATION dans l'admin Directus — contenu en LECTURE
// SEULE ; seuls le statut (ranger) et la suppression (nettoyer) sont ouverts.
//
// Pourquoi : les messages du formulaire de contact vivent dans `app.contact_leads`
// (Postgres, migrations Drizzle), pas dans Directus. Eléonore n'avait donc aucun
// moyen de les consulter : elle dépendait entièrement de l'email de notification.
// Le jour où cet email s'est mis à être supprimé par Resend (adresse mise en liste
// de suppression après un rebond), les messages sont restés invisibles — alors
// qu'ils étaient bien enregistrés. Cf. docs/09-contact.md.
//
// Ce module NE CRÉE NI NE MODIFIE aucune table : la structure appartient aux
// migrations Drizzle. Il pose seulement le *meta* Directus (libellés, ordre,
// champs en lecture seule) au-dessus d'une table déjà présente, ce que Directus
// autorise dès lors que `app` figure dans son `DB_SEARCH_PATH`.
//
// Trois garde-fous se cumulent :
//   1. `directus_user` n'a que `SELECT`, `UPDATE (status)` et `DELETE` sur ces
//      tables (migrations 0001, 0003, 0005, test `directus-grants`) ;
//   2. tous les champs sauf `status` sont `readonly` dans l'admin ;
//   3. la policy Éditrice : `read`, `update` limité à `status`, `delete`.
// Le contenu d'une demande ne se réécrit donc jamais. Éléonore la « clôture »
// (archivage natif : la liste par défaut masque les clôturées) ou la supprime
// (spam, demande d'effacement) — demande du 2026-10-23.
//
// Idempotent : relançable, ne réécrit que ce qui diffère. Si la table n'est pas
// visible (search path non mis à jour, droits absents), on **avertit et on passe**
// — le bootstrap ne doit pas échouer pour ça.

import { get, patch } from "./api.ts";
import { APP_TABLES, type AppTable, type FieldMeta } from "./app-tables.ts";

/** La table est-elle visible par Directus (search path + droits) ? */
async function isVisible(collection: string): Promise<boolean> {
  try {
    await get(`/collections/${collection}`);
    return true;
  } catch {
    return false;
  }
}

/** `sort` = rang dans la config : une colonne ajoutée plus tard ne tombe pas en bas du formulaire. */
function fieldMeta(meta: FieldMeta, sort: number): Record<string, unknown> {
  return {
    note: null,
    sort,
    readonly: !meta.editable,
    width: meta.width ?? "full",
    ...(meta.interface ? { interface: meta.interface } : {}),
    ...(meta.options
      ? { options: meta.options, display: "labels", display_options: meta.options }
      : {}),
    translations: [{ language: "fr-FR", translation: meta.name }],
  };
}

async function adoptTable({ collection, meta, fields }: AppTable): Promise<void> {
  if (!(await isVisible(collection))) {
    console.warn(
      `  ⚠ table ${collection} invisible pour Directus — vérifier DB_SEARCH_PATH (directus,app) et le GRANT SELECT sur app.${collection}`,
    );
    return;
  }
  await patch(`/collections/${collection}`, { meta });
  for (const [i, [field, m]] of Object.entries(fields).entries()) {
    try {
      await patch(`/fields/${collection}/${field}`, { meta: fieldMeta(m, i + 1) });
    } catch (err) {
      // Une colonne absente (schéma applicatif qui évolue) ne doit pas bloquer.
      console.warn(`  ⚠ ${collection}.${field} : meta non appliqué (${(err as Error).message})`);
    }
  }
  console.log(`~ ${collection} : exposée (lecture seule sauf statut, suppression)`);
}

export async function adoptAppTables(): Promise<void> {
  for (const table of APP_TABLES) await adoptTable(table);
}
