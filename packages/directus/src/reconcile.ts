// Réconciliation admin — corrige les écarts que le bootstrap (additif-only) ne peut
// PAS appliquer : il ne repatche jamais le `meta` d'un CHAMP EXISTANT. À lancer
// pointé sur l'instance cible (comme bootstrap), ex. :
//   DIRECTUS_URL=https://cms.encrehumaine.fr pnpm --filter @encre/directus reconcile
// Idempotent : ne patche que ce qui diffère, relançable sans risque. N'écrit AUCUN
// contenu (uniquement des `meta` de champs → visibilité/édition dans l'admin).
import { get, patch } from "./api.ts";
import { ICON_SUBFIELD } from "./icons.ts";

// 1) Choix du select `faq_items.scope` (le bootstrap ne met pas à jour les choix
//    d'un select existant). Liste complète = miroir de FAQ_SCOPE (schema.ts).
const FAQ_SCOPE_CHOICES = [
  { text: "Contact", value: "contact" },
  { text: "Audit", value: "audit" },
  { text: "Compétences", value: "competences" },
  { text: "Managers", value: "managers" },
  { text: "Particuliers", value: "b2c" },
  { text: "Booster recherche", value: "booster" },
  { text: "Général", value: "general" },
];

// 2) Sous-champ `icon` (1re position, demi-largeur) des répéteurs éditoriaux, en
//    select-dropdown fermé (choix = ICON_CHOICES, miroir du clientBundle). Le
//    patch remet aussi la liste de choix à jour quand ICON_CHOICES s'enrichit.
const ICON_SUB_DIRECTUS = {
  field: "icon",
  name: "icon",
  type: "string",
  meta: {
    field: "icon",
    interface: ICON_SUBFIELD.interface,
    width: ICON_SUBFIELD.width,
    options: ICON_SUBFIELD.options,
  },
};
const ICON_CHOICE_COUNT = ICON_SUBFIELD.options.choices.length;
// [collection, champ répéteur] — les hubs affichent l'icône depuis le run 7 ;
// l'accueil (défis + « ce que je vous aide à construire ») s'y ajoute au run 8.
const ICON_REPEATERS: [string, string][] = [
  ["offers", "outcomes"],
  ["offers", "context_items"],
  ["offers", "mission_includes"],
  ["org_hub_page", "observe_items"],
  ["b2c_hub_page", "outcomes"],
  ["home_page", "recognition_items"],
  ["home_page", "build_blocks"],
  ["home_page", "b2c_cards"],
];

type SubField = {
  field: string;
  meta?: { interface?: string; options?: { choices?: unknown[] } };
};
type FieldMeta = {
  meta: { options?: { choices?: { value: string }[]; fields?: SubField[] } | null };
};

async function reconcileFaqScope(): Promise<void> {
  const cur = await get<FieldMeta>("/fields/faq_items/scope");
  const values = (cur.meta.options?.choices ?? []).map((c) => c.value);
  if (values.includes("booster")) {
    console.log("= faq_items.scope : choix « booster » déjà présent");
    return;
  }
  await patch("/fields/faq_items/scope", {
    meta: { options: { ...(cur.meta.options ?? {}), choices: FAQ_SCOPE_CHOICES } },
  });
  console.log("+ faq_items.scope : choix « booster » ajouté");
}

async function reconcileIconSubfields(): Promise<void> {
  for (const [collection, field] of ICON_REPEATERS) {
    const cur = await get<FieldMeta>(`/fields/${collection}/${field}`);
    const fields = cur.meta.options?.fields ?? [];
    const existing = fields.find((f) => f.field === "icon");
    const upToDate =
      existing?.meta?.interface === "select-dropdown" &&
      (existing.meta.options?.choices?.length ?? 0) === ICON_CHOICE_COUNT;
    if (upToDate) {
      console.log(`= ${collection}.${field} : sous-champ « icon » déjà à jour`);
      continue;
    }
    const others = fields.filter((f) => f.field !== "icon");
    await patch(`/fields/${collection}/${field}`, {
      meta: { options: { ...(cur.meta.options ?? {}), fields: [ICON_SUB_DIRECTUS, ...others] } },
    });
    console.log(
      existing
        ? `~ ${collection}.${field} : sous-champ « icon » mis à jour (liste déroulante)`
        : `+ ${collection}.${field} : sous-champ « icon » ajouté (liste déroulante)`,
    );
  }
}

async function main(): Promise<void> {
  console.log("→ Réconciliation admin (meta de champs existants)…");
  await reconcileFaqScope();
  await reconcileIconSubfields();
  console.log("✓ Réconciliation terminée.");
}

main().catch((err) => {
  console.error("\n✗ Réconciliation échouée :\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
