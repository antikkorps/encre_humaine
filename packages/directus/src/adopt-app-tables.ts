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
//   1. `directus_user` n'a que `SELECT`, `UPDATE (status)` et `DELETE` sur la
//      table (migrations 0001 et 0003, test `directus-grants`) ;
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

const COLLECTION = "contact_leads";

/** Meta de collection : libellés FR, tri par défaut, note explicative. */
const COLLECTION_META = {
  icon: "inbox",
  note: "Demandes reçues via le formulaire de contact (« Être rappelé·e » : téléphone et créneau de rappel). Enregistrées par le site : seul le statut se modifie. « Archiver » = clôturer (masquée de la liste, gardée) ; la corbeille supprime définitivement.",
  display_template: "{{first_name}} — {{phone}} — {{audience}}",
  sort_field: "-created_at",
  hidden: false,
  // Archivage natif sur le statut : « Archiver » = clôturer, et la liste par
  // défaut n'affiche que ce qui reste à traiter.
  archive_field: "status",
  archive_value: "closed",
  unarchive_value: "new",
  archive_app_filter: true,
  translations: [
    {
      language: "fr-FR",
      translation: "Messages reçus",
      singular: "message",
      plural: "messages",
    },
  ],
};

type FieldMeta = {
  name: string;
  width?: "half" | "full";
  interface?: string;
  /** Seul `status` est éditable ; tout le reste vient du formulaire du site. */
  editable?: boolean;
  options?: Record<string, unknown>;
};

/** Valeurs de `app.lead_status` (enum Postgres) avec leur libellé dans l'admin. */
const STATUS_CHOICES = [
  { text: "Nouvelle", value: "new" },
  { text: "Recontactée", value: "contacted" },
  { text: "Clôturée", value: "closed" },
];

/** Meta des colonnes : libellé lisible, largeur, lecture seule sauf `status`. */
const FIELD_META: Record<string, FieldMeta> = {
  created_at: { name: "Reçu le", width: "half" },
  first_name: { name: "Prénom", width: "half" },
  phone: { name: "Téléphone", width: "half" },
  email: { name: "E-mail", width: "half" },
  callback_days: { name: "Jour(s) de rappel", width: "half" },
  callback_slot: { name: "Moment de la journée", width: "half" },
  audience: { name: "Public", width: "half" },
  source_page: { name: "Page d'origine", width: "half" },
  status: {
    name: "Statut",
    width: "half",
    interface: "select-dropdown",
    editable: true,
    options: { choices: STATUS_CHOICES },
  },
  notification_sent: { name: "Notification envoyée", width: "half" },
  message: { name: "Ce qui l'amène", width: "full", interface: "input-multiline" },
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
  console.log(`~ ${COLLECTION} : collection exposée (statut modifiable, suppression)`);

  for (const [field, meta] of Object.entries(FIELD_META)) {
    try {
      await patch(`/fields/${COLLECTION}/${field}`, {
        meta: {
          note: null,
          readonly: !meta.editable,
          width: meta.width ?? "full",
          ...(meta.interface ? { interface: meta.interface } : {}),
          ...(meta.options
            ? { options: meta.options, display: "labels", display_options: meta.options }
            : {}),
          translations: [{ language: "fr-FR", translation: meta.name }],
        },
      });
    } catch (err) {
      // Une colonne absente (schéma applicatif qui évolue) ne doit pas bloquer.
      console.warn(`  ⚠ ${COLLECTION}.${field} : meta non appliqué (${(err as Error).message})`);
    }
  }
  console.log(
    `~ ${COLLECTION} : ${Object.keys(FIELD_META).length} champs (lecture seule sauf statut)`,
  );
}
