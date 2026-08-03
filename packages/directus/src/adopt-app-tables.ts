// Adoption des tables de l'APPLICATION dans l'admin Directus — en LECTURE SEULE.
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
//   1. `directus_user` n'a qu'un `SELECT` sur la table (infra/postgres/init.sql) ;
//   2. les champs sont marqués `readonly` dans l'admin ;
//   3. la policy Éditrice ne reçoit que l'action `read`.
// Une fausse manœuvre ne peut donc ni modifier ni supprimer un message.
//
// Idempotent : relançable, ne réécrit que ce qui diffère. Si la table n'est pas
// visible (search path non mis à jour, droits absents), on **avertit et on passe**
// — le bootstrap ne doit pas échouer pour ça.

import { get, patch } from "./api.ts";

const COLLECTION = "contact_leads";

/** Meta de collection : libellés FR, tri par défaut, note explicative. */
const COLLECTION_META = {
  icon: "inbox",
  note: "Messages reçus via le formulaire de contact. Lecture seule : ils sont enregistrés automatiquement par le site.",
  display_template: "{{first_name}} — {{audience}}",
  sort_field: "-created_at",
  hidden: false,
  translations: [
    {
      language: "fr-FR",
      translation: "Messages reçus",
      singular: "message",
      plural: "messages",
    },
  ],
};

/**
 * Meta des colonnes : libellé lisible, largeur, et `readonly` partout — y compris
 * `status`, qui reste piloté par l'application.
 */
const FIELD_META: Record<string, { name: string; width?: "half" | "full"; interface?: string }> = {
  created_at: { name: "Reçu le", width: "half" },
  first_name: { name: "Prénom", width: "half" },
  email: { name: "E-mail", width: "half" },
  audience: { name: "Public", width: "half" },
  source_page: { name: "Page d'origine", width: "half" },
  status: { name: "Statut", width: "half" },
  notification_sent: { name: "Notification envoyée", width: "half" },
  message: { name: "Message", width: "full", interface: "input-multiline" },
  updated_at: { name: "Mis à jour le", width: "half" },
};

/** La table est-elle visible par Directus (search path + droits) ? */
async function isVisible(): Promise<boolean> {
  try {
    await get(`/collections/${COLLECTION}`);
    return true;
  } catch {
    return false;
  }
}

export async function adoptContactLeads(): Promise<void> {
  if (!(await isVisible())) {
    console.warn(
      `  ⚠ table ${COLLECTION} invisible pour Directus — vérifier DB_SEARCH_PATH (directus,app) et le GRANT SELECT sur app.contact_leads`,
    );
    return;
  }

  await patch(`/collections/${COLLECTION}`, { meta: COLLECTION_META });
  console.log(`~ ${COLLECTION} : collection exposée en lecture seule`);

  for (const [field, meta] of Object.entries(FIELD_META)) {
    try {
      await patch(`/fields/${COLLECTION}/${field}`, {
        meta: {
          note: null,
          readonly: true,
          width: meta.width ?? "full",
          ...(meta.interface ? { interface: meta.interface } : {}),
          translations: [{ language: "fr-FR", translation: meta.name }],
        },
      });
    } catch (err) {
      // Une colonne absente (schéma applicatif qui évolue) ne doit pas bloquer.
      console.warn(`  ⚠ ${COLLECTION}.${field} : meta non appliqué (${(err as Error).message})`);
    }
  }
  console.log(`~ ${COLLECTION} : ${Object.keys(FIELD_META).length} champs en lecture seule`);
}
