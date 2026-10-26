// Textes des diagnostics B2B / B2C — docs/11-diagnostics.md. Un singleton par
// diagnostic, même liste de champs (DRY). Le code porte la structure (questions,
// barème, règles) ; Éléonore ajuste ici les MOTS, sans déploiement. Chaque ligne
// de répéteur est rattachée à la structure par sa `key` : la changer détache le
// texte, qui retombe alors sur la référence du cahier des charges.
import * as f from "./fields.ts";
import type { CollectionDef } from "./schema.ts";

const KEY = {
  field: "key",
  name: "Clé (ne pas modifier)",
  width: "half" as const,
  note: "Repère technique qui relie ce texte au questionnaire.",
};

function diagnosticFields(): ReturnType<typeof f.input>[] {
  return [
    f.divider("intro_divider", "Accueil du questionnaire"),
    f.input("title"),
    f.textarea("intro"),
    f.input("cta_label", { note: "Bouton de prise de rendez-vous du rapport" }),
    f.divider("levels_divider", "Niveaux (moins de 40 / 40 à 69 / 70 et plus)"),
    f.input("level_low", { half: true }),
    f.input("level_mid", { half: true }),
    f.input("level_high", { half: true }),
    f.repeater("themes", [KEY, { field: "label", name: "Nom du thème" }], {
      note: "Nom des scores affichés",
    }),
    f.divider("questions_divider", "Questions"),
    f.repeater(
      "questions",
      [
        KEY,
        { field: "label", name: "Question", interface: "input-multiline" },
        {
          field: "label_variant",
          name: "Variante (selon le profil)",
          interface: "input-multiline",
          note: "Formulation pour le profil Dirigeant·e ou DRH, quand elle existe",
        },
        {
          field: "options",
          name: "Réponses (une par ligne)",
          interface: "input-multiline",
          note: "Garder le même nombre de lignes et le même ordre : l'ordre fait le barème (1re = 2 points, 2e = 1, 3e = 0)",
        },
        { field: "tip", name: "Conseil (si réponse < 2 points)", interface: "input-multiline" },
      ],
      { note: "Textes des questions, réponses et conseils" },
    ),
    f.divider("result_divider", "Résultat"),
    f.repeater(
      "offers",
      [
        KEY,
        { field: "name", name: "Nom de l'offre" },
        { field: "price", name: "Prix et durée" },
        { field: "description", name: "Phrase de description", interface: "input-multiline" },
        { field: "url", name: "Lien (page de l'offre)" },
      ],
      { note: "Cartes d'offre recommandées" },
    ),
    f.repeater("messages", [KEY, { field: "text", name: "Texte", interface: "input-multiline" }], {
      note: "Messages du rapport. {priorite} et {niveau} sont remplacés automatiquement.",
    }),
    f.divider("unlock_divider", "Déblocage par email"),
    f.input("unlock_title"),
    f.textarea("unlock_body"),
    f.textarea("consent_label", {
      note: "Case obligatoire. Modifier ce texte change la version du consentement enregistrée.",
    }),
    f.textarea("newsletter_label", { note: "Case facultative" }),
    f.input("unlock_button"),
    f.input("email_subject", { note: "Objet de l'email du rapport ({niveau} possible)" }),
    f.divider("promo_divider", "Invitations au diagnostic sur le site"),
    f.input("promo_title", { note: "Encart en bas de chaque page d'offre de ce public : titre" }),
    f.textarea("promo_body", { note: "Encart en bas des pages d'offre : phrase sous le titre" }),
    f.input("promo_label", { half: true, note: "Encart en bas des pages d'offre : bouton" }),
    f.input("promo_hub_label", {
      half: true,
      note: "Second bouton du hub, à côté de « Prendre rendez-vous »",
    }),
  ];
}

export const diagnosticSingletons: CollectionDef[] = [
  {
    collection: "diagnostic_b2b",
    singleton: true,
    icon: "quiz",
    note: "Textes du diagnostic RH (organisations) — /organisations/diagnostic",
    fields: diagnosticFields(),
  },
  {
    collection: "diagnostic_b2c",
    singleton: true,
    icon: "explore",
    note: "Textes du diagnostic projet professionnel (particuliers) — /particuliers/diagnostic",
    fields: diagnosticFields(),
  },
];
