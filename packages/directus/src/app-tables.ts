// Tables de l'APPLICATION exposées dans l'admin Directus (cf. adopt-app-tables.ts).
// Même règle pour toutes : contenu en lecture seule, statut modifiable (archivage
// natif = clôturer), suppression autorisée — demande d'Éléonore du 2026-10-23.

export type FieldMeta = {
  name: string;
  width?: "half" | "full";
  interface?: string;
  /** Seul `status` est éditable ; tout le reste vient du site. */
  editable?: boolean;
  options?: Record<string, unknown>;
};

export type AppTable = {
  collection: string;
  meta: Record<string, unknown>;
  fields: Record<string, FieldMeta>;
};

/** Valeurs de `app.lead_status` (enum Postgres) avec leur libellé dans l'admin. */
const STATUS_FIELD: FieldMeta = {
  name: "Statut",
  width: "half",
  interface: "select-dropdown",
  editable: true,
  options: {
    choices: [
      { text: "Nouveau", value: "new" },
      { text: "Recontacté", value: "contacted" },
      { text: "Clôturé", value: "closed" },
    ],
  },
};

/** Archivage natif sur le statut : la liste par défaut ne montre que le « à traiter ». */
const ARCHIVE_ON_STATUS = {
  sort_field: "-created_at",
  hidden: false,
  archive_field: "status",
  archive_value: "closed",
  unarchive_value: "new",
  archive_app_filter: true,
};

const TIDY_NOTE =
  "Seul le statut se modifie. « Archiver » = clôturer (masqué de la liste, gardé) ; la corbeille supprime définitivement.";

const CONTACT_LEADS: AppTable = {
  collection: "contact_leads",
  meta: {
    icon: "inbox",
    note: `Demandes reçues via le formulaire de contact (« Être rappelé·e »). ${TIDY_NOTE}`,
    display_template: "{{first_name}} — {{phone}} — {{audience}}",
    ...ARCHIVE_ON_STATUS,
    translations: [
      { language: "fr-FR", translation: "Messages reçus", singular: "message", plural: "messages" },
    ],
  },
  fields: {
    created_at: { name: "Reçu le", width: "half" },
    first_name: { name: "Prénom", width: "half" },
    phone: { name: "Téléphone", width: "half" },
    email: { name: "E-mail", width: "half" },
    callback_days: { name: "Jour(s) de rappel", width: "half" },
    callback_slot: { name: "Moment de la journée", width: "half" },
    audience: { name: "Public", width: "half" },
    source_page: { name: "Page d'origine", width: "half" },
    status: STATUS_FIELD,
    notification_sent: { name: "Notification envoyée", width: "half" },
    message: { name: "Ce qui l'amène", width: "full", interface: "input-multiline" },
    updated_at: { name: "Mis à jour le", width: "half" },
  },
};

const DIAGNOSTICS: AppTable = {
  collection: "diagnostics",
  meta: {
    icon: "quiz",
    note: `Diagnostics débloqués par email (/organisations/diagnostic, /particuliers/diagnostic). Réponses et résultat servent à préparer le rendez-vous. ${TIDY_NOTE}`,
    display_template: "{{email}} — {{kind}}",
    ...ARCHIVE_ON_STATUS,
    translations: [
      {
        language: "fr-FR",
        translation: "Diagnostics reçus",
        singular: "diagnostic",
        plural: "diagnostics",
      },
    ],
  },
  fields: {
    created_at: { name: "Reçu le", width: "half" },
    kind: { name: "Diagnostic (b2b = RH, b2c = projet)", width: "half" },
    email: { name: "E-mail", width: "half" },
    status: STATUS_FIELD,
    // Ce qu'Éléonore lit (retour du 2026-10-27) ; les deux champs bruts restent
    // pour l'export, repliés plus bas.
    summary: { name: "Réponses en clair", width: "full", interface: "input-multiline" },
    result: { name: "Résultat (codes techniques)", width: "full", interface: "input-code" },
    answers: { name: "Réponses (codes techniques)", width: "full", interface: "input-code" },
    booking_clicked_at: { name: "A cliqué sur le rendez-vous le", width: "half" },
    consent_newsletter: { name: "Newsletter demandée", width: "half" },
    consent_report: { name: "Consentement rapport", width: "half" },
    consent_text_version: { name: "Version du consentement", width: "half" },
    source: { name: "Source du lien", width: "half" },
    device: { name: "Appareil", width: "half" },
    report_token_hash: { name: "Empreinte du lien de rapport", width: "full" },
    updated_at: { name: "Mis à jour le", width: "half" },
  },
};

export const APP_TABLES: AppTable[] = [CONTACT_LEADS, DIAGNOSTICS];
