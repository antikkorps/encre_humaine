// Réconciliation admin — corrige les écarts que le bootstrap (additif-only) ne peut
// PAS appliquer : il ne repatche jamais le `meta` d'un CHAMP EXISTANT. À lancer
// pointé sur l'instance cible (comme bootstrap), ex. :
//   DIRECTUS_URL=https://cms.encrehumaine.fr pnpm --filter @encre/directus exec tsx src/reconcile.ts
// Idempotent : ne patche que ce qui manque, relançable sans risque. N'écrit AUCUN
// contenu (uniquement des `meta` de champs → visibilité/édition dans l'admin).
import { get, patch } from "./api.ts";

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

// 2) Sous-champ `icon` (1re position, demi-largeur) des répéteurs de `offers`.
const ICON_SUBFIELD = {
  field: "icon",
  name: "icon",
  type: "string",
  meta: { field: "icon", interface: "input", width: "half" },
};
const ICON_REPEATERS = ["outcomes", "context_items", "mission_includes"];

type FieldMeta = { meta: { options?: { choices?: { value: string }[]; fields?: { field: string }[] } | null } };

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
    if (fields.some((f) => f.field === "icon")) {
      console.log(`= offers.${field} : sous-champ « icon » déjà présent`);
      continue;
    }
    await patch(`/fields/offers/${field}`, {
      meta: { options: { ...(cur.meta.options ?? {}), fields: [ICON_SUBFIELD, ...fields] } },
    });
    console.log(`+ offers.${field} : sous-champ « icon » ajouté`);
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
