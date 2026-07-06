// Réconciliation admin — corrige les écarts que le bootstrap (additif-only) ne peut
// PAS appliquer : il ne repatche jamais le `meta` d'un CHAMP EXISTANT. À lancer
// pointé sur l'instance cible (comme bootstrap), ex. :
//   DIRECTUS_URL=https://cms.encrehumaine.fr pnpm --filter @encre/directus reconcile
// Idempotent : ne patche que ce qui diffère, relançable sans risque. N'écrit AUCUN
// contenu (uniquement des `meta` de champs → visibilité/édition dans l'admin).
import { get, patch } from "./api.ts";
import { ICON_CHOICES } from "./icons.ts";

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

// 2) Sous-champ `icon` (1re position, demi-largeur) des répéteurs de `offers`,
//    en select-dropdown fermé (choix = ICON_CHOICES, miroir du clientBundle).
const ICON_SUBFIELD = {
  field: "icon",
  name: "icon",
  type: "string",
  meta: {
    field: "icon",
    interface: "select-dropdown",
    width: "half",
    options: { choices: [...ICON_CHOICES], allowNone: true },
  },
};
const ICON_REPEATERS = ["outcomes", "context_items", "mission_includes"];

type SubField = { field: string; meta?: { interface?: string } };
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
  for (const field of ICON_REPEATERS) {
    const cur = await get<FieldMeta>(`/fields/offers/${field}`);
    const fields = cur.meta.options?.fields ?? [];
    const existing = fields.find((f) => f.field === "icon");
    if (existing?.meta?.interface === "select-dropdown") {
      console.log(`= offers.${field} : sous-champ « icon » déjà en liste déroulante`);
      continue;
    }
    const others = fields.filter((f) => f.field !== "icon");
    await patch(`/fields/offers/${field}`, {
      meta: { options: { ...(cur.meta.options ?? {}), fields: [ICON_SUBFIELD, ...others] } },
    });
    console.log(
      existing
        ? `~ offers.${field} : sous-champ « icon » → liste déroulante`
        : `+ offers.${field} : sous-champ « icon » ajouté (liste déroulante)`,
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
