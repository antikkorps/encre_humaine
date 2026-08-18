// Réconciliation admin — corrige les écarts que le bootstrap (additif-only) ne peut
// PAS appliquer : il ne repatche jamais le `meta` d'un CHAMP EXISTANT. À lancer
// pointé sur l'instance cible (comme bootstrap), ex. :
//   DIRECTUS_URL=https://cms.encrehumaine.fr pnpm --filter @encre/directus reconcile
// Idempotent : ne patche que ce qui diffère, relançable sans risque. N'écrit AUCUN
// contenu (uniquement des `meta` de champs → visibilité/édition dans l'admin).
import { get, patch } from "./api.ts";
import { ICON_SUBFIELD } from "./icons.ts";
import { allCollections } from "./schema.ts";

// 1) Listes de choix (`select-dropdown` et cases à cocher multiples) : choix + rendu
//    en vue liste, resynchronisés
//    depuis schema.ts — source unique, aucune liste dupliquée ici. Le bootstrap étant
//    additif-only, un select déjà créé conserve indéfiniment ses anciens libellés :
//    c'est donc ici que les renommages (ex. périmètres de FAQ) atterrissent en prod.

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
  ["resources_page", "explore_cards"],
  ["shop_page", "catalog_items"],
  ["shop_page", "why_items"],
];

type SubField = {
  field: string;
  meta?: { interface?: string; options?: { choices?: unknown[] } };
};
type Choice = { text?: string; value?: string | number };
type FieldMeta = {
  meta: {
    interface?: string | null;
    display?: string | null;
    display_options?: Record<string, unknown> | null;
    options?: { choices?: Choice[]; fields?: SubField[] } | null;
  };
};
/** Spec de champ telle que produite par `fields.ts` (partie utile ici). */
type SelectSpec = {
  interface?: string;
  display?: string;
  display_options?: Record<string, unknown>;
  options?: { choices?: Choice[] };
};

/** Interfaces pilotées par une liste de choix (fields.ts : select / selectInt / selectMulti). */
const CHOICE_INTERFACES = new Set(["select-dropdown", "select-multiple-checkbox"]);

/** Empreinte comparable d'une liste de choix (ordre significatif : c'est l'ordre du menu). */
const choiceKey = (choices: Choice[] | undefined): string =>
  JSON.stringify((choices ?? []).map((c) => [c.value ?? "", c.text ?? ""]));

/** Vrai si l'instance porte déjà exactement les choix + le rendu voulus. */
function selectUpToDate(cur: FieldMeta["meta"], want: SelectSpec): boolean {
  if (choiceKey(cur.options?.choices) !== choiceKey(want.options?.choices)) return false;
  if ((cur.display ?? null) !== (want.display ?? null)) return false;
  const curOpts = cur.display_options ?? {};
  return Object.entries(want.display_options ?? {}).every(
    ([k, v]) => JSON.stringify(curOpts[k]) === JSON.stringify(v),
  );
}

async function reconcileSelects(): Promise<void> {
  let changed = 0;
  for (const def of allCollections) {
    for (const spec of def.fields) {
      const want = spec.meta as SelectSpec;
      if (!want.interface || !CHOICE_INTERFACES.has(want.interface)) continue;
      if (!want.options?.choices) continue;
      const path = `/fields/${def.collection}/${spec.field}`;
      const cur = await get<FieldMeta>(path);
      if (selectUpToDate(cur.meta, want)) continue;
      await patch(path, {
        meta: {
          // Les autres options éventuelles de l'instance sont préservées.
          options: { ...(cur.meta.options ?? {}), choices: want.options.choices },
          display: want.display ?? null,
          display_options: {
            ...(cur.meta.display_options ?? {}),
            ...(want.display_options ?? {}),
          },
        },
      });
      console.log(`~ ${def.collection}.${spec.field} : choix & affichage resynchronisés`);
      changed++;
    }
  }
  if (!changed) console.log("= listes de choix : déjà alignées sur schema.ts");
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
  await reconcileSelects();
  await reconcileIconSubfields();
  console.log("✓ Réconciliation terminée.");
}

main().catch((err) => {
  console.error("\n✗ Réconciliation échouée :\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
