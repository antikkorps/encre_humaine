// Réconciliation admin — corrige les écarts que le bootstrap (additif-only) ne peut
// PAS appliquer : il ne repatche jamais le `meta` d'un CHAMP EXISTANT. À lancer
// pointé sur l'instance cible (comme bootstrap), ex. :
//   DIRECTUS_URL=https://cms.encrehumaine.fr pnpm --filter @encre/directus reconcile
// Idempotent : ne patche que ce qui diffère, relançable sans risque. N'écrit AUCUN
// contenu (uniquement des `meta` de champs → visibilité/édition dans l'admin).
import { get, patch } from "./api.ts";
import { allCollections } from "./schema.ts";

// 1) Listes de choix (`select-dropdown` et cases à cocher multiples) : choix + rendu
//    en vue liste, resynchronisés
//    depuis schema.ts — source unique, aucune liste dupliquée ici. Le bootstrap étant
//    additif-only, un select déjà créé conserve indéfiniment ses anciens libellés :
//    c'est donc ici que les renommages (ex. périmètres de FAQ) atterrissent en prod.

// 2) Sous-champs des RÉPÉTEURS, resynchronisés depuis schema.ts. Un répéteur est
//    un champ JSON dont la liste de sous-champs vit dans son `meta` : ajouter une
//    colonne à un répéteur déjà créé (ex. le lien par bloc d'offre, run 15) ou
//    enrichir la liste d'icônes ne passe donc QUE par ici. schema.ts fait foi —
//    `fields.subField` produit la même forme à la création et à la réconciliation.

// 3) `note` et `hidden` des champs : ce sont les seules explications que l'éditrice
//    lit dans l'admin, et un champ retiré d'une page doit disparaître de son
//    formulaire. Le bootstrap les fige à la création, on les rattrape ici.

type Json = Record<string, unknown>;
type SubField = { field: string };
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
  if ((cur.interface ?? null) !== (want.interface ?? null)) return false;
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
          // L'interface est poussée : un champ né en saisie libre (ex. `offers.icon`
          // avant le run 15) doit pouvoir devenir une liste fermée.
          interface: want.interface,
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

/**
 * Empreinte comparable de la liste de sous-champs d'un répéteur (ordre significatif).
 * Projection sur les seules clés que `fields.subField` produit : Directus en ajoute
 * d'autres de son côté (tri interne, `note: null`…) et comparer le brut ferait
 * repatcher à chaque exécution.
 */
const subFieldsKey = (fields: unknown): string =>
  JSON.stringify(
    (Array.isArray(fields) ? fields : []).map((raw) => {
      const f = (raw ?? {}) as { field?: string; name?: string; type?: string; meta?: Json };
      const meta = (f.meta ?? {}) as {
        interface?: string;
        width?: string;
        note?: string;
        options?: Json;
      };
      return [
        f.field ?? "",
        f.name ?? "",
        f.type ?? "",
        meta.interface ?? "",
        meta.width ?? "",
        meta.note ?? "",
        meta.options ?? null,
      ];
    }),
  );

async function reconcileRepeaters(): Promise<void> {
  let changed = 0;
  for (const def of allCollections) {
    for (const spec of def.fields) {
      const want = spec.meta as { interface?: string; options?: { fields?: SubField[] } };
      if (want.interface !== "list" || !want.options?.fields) continue;
      const path = `/fields/${def.collection}/${spec.field}`;
      const cur = await get<FieldMeta>(path);
      if (subFieldsKey(cur.meta.options?.fields) === subFieldsKey(want.options.fields)) continue;
      const before = (cur.meta.options?.fields ?? []).map((f) => f.field);
      const after = want.options.fields.map((f) => f.field);
      await patch(path, {
        // Les autres options du répéteur (template, tri…) sont préservées.
        meta: { options: { ...(cur.meta.options ?? {}), fields: want.options.fields } },
      });
      const added = after.filter((f) => !before.includes(f));
      const removed = before.filter((f) => !after.includes(f));
      const detail = [
        added.length ? `+${added.join(", +")}` : "",
        removed.length ? `-${removed.join(", -")}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      console.log(
        `~ ${def.collection}.${spec.field} : sous-champs resynchronisés${detail ? ` (${detail})` : ""}`,
      );
      changed++;
    }
  }
  if (!changed) console.log("= répéteurs : sous-champs déjà alignés sur schema.ts");
}

async function reconcileNotes(): Promise<void> {
  let changed = 0;
  for (const def of allCollections) {
    for (const spec of def.fields) {
      const want = spec.meta as { note?: string; hidden?: boolean };
      // On ne pousse QUE ce que schema.ts déclare : un `note` posé à la main dans
      // l'admin sur un champ non documenté ici n'est jamais effacé.
      if (want.note === undefined && want.hidden === undefined) continue;
      const path = `/fields/${def.collection}/${spec.field}`;
      const cur = await get<{ meta: { note?: string | null; hidden?: boolean | null } }>(path);
      const patchMeta: Record<string, unknown> = {};
      if (want.note !== undefined && (cur.meta.note ?? null) !== want.note) {
        patchMeta.note = want.note;
      }
      if (want.hidden !== undefined && (cur.meta.hidden ?? false) !== want.hidden) {
        patchMeta.hidden = want.hidden;
      }
      if (!Object.keys(patchMeta).length) continue;
      await patch(path, { meta: patchMeta });
      console.log(
        `~ ${def.collection}.${spec.field} : ${Object.keys(patchMeta).join(" + ")} à jour`,
      );
      changed++;
    }
  }
  if (!changed) console.log("= notes & visibilité : déjà alignées sur schema.ts");
}

async function main(): Promise<void> {
  console.log("→ Réconciliation admin (meta de champs existants)…");
  await reconcileSelects();
  await reconcileRepeaters();
  await reconcileNotes();
  console.log("✓ Réconciliation terminée.");
}

main().catch((err) => {
  console.error("\n✗ Réconciliation échouée :\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
