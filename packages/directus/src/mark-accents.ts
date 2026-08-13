// Pose les mises en avant « gras doré » demandées par Éléonore (mail du
// 2026-08-13) DANS le contenu déjà saisi, sans le réécrire.
//
//   pnpm --filter @encre/directus mark:accents
//
// Pourquoi un script plutôt qu'un seed : les textes de la home ont été retravaillés
// par Éléonore dans l'admin ; ils ne ressemblent plus à ceux de `content-home.ts`.
// Un seed les écraserait. Ici on se contente d'ENTOURER un fragment existant de
// `**…**` — la convention lue par le site (cf. apps/web/utils/accent.ts) — ce qui
// laisse la phrase intacte.
//
// Garde-fous :
//   - fragment introuvable → on n'écrit RIEN et on affiche la valeur en place,
//     à corriger dans l'admin (le texte a dû bouger depuis le mail) ;
//   - fragment déjà entouré → rien à faire (relançable sans risque) ;
//   - seule la PREMIÈRE occurrence est marquée.
//
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds
// admin), comme le bootstrap.

import { get, patch } from "./api.ts";

interface Accent {
  collection: string;
  field: string;
  /** Fragment à mettre en gras doré, tel qu'il apparaît dans le texte. */
  fragment: string;
}

const ACCENTS: Accent[] = [
  // « Vous vous reconnaissez ? » → conclusion (l'italique a été retiré côté site).
  { collection: "home_page", field: "recognition_conclusion", fragment: "visibilité" },
  // « Ce que je vous aide à construire » → dernière phrase du titre.
  { collection: "home_page", field: "build_title", fragment: "Des parcours mieux compris." },
  // « Ma méthode » → chapô.
  { collection: "home_page", field: "method_subtitle", fragment: "réalité" },
  // « L'Encre Humaine » → titre (toute la phrase), introduction, citation.
  { collection: "home_page", field: "why_title", fragment: "Structurer sans déshumaniser." },
  {
    collection: "home_page",
    field: "why_subtitle",
    fragment: "sens, de repères et de perspectives",
  },
  { collection: "home_page", field: "why_conclusion", fragment: "repères" },
  // « Derrière L'Encre Humaine ».
  { collection: "home_page", field: "intro_title", fragment: "Eléonore Morée" },
  // « Pour les particuliers ».
  {
    collection: "home_page",
    field: "b2c_section_text",
    fragment: "trajectoire professionnelle plus lisible",
  },
];

/** Entoure la première occurrence de `fragment` par `**…**` (ou null si rien à faire). */
function mark(value: string, fragment: string): string | null {
  if (value.includes(`**${fragment}**`)) return null;
  const at = value.indexOf(fragment);
  if (at === -1) return null;
  return `${value.slice(0, at)}**${fragment}**${value.slice(at + fragment.length)}`;
}

async function main(): Promise<void> {
  console.log("→ Mises en avant dorées (run 11)…");

  // Une passe par collection : une seule lecture et un seul PATCH par singleton.
  const collections = [...new Set(ACCENTS.map((a) => a.collection))];
  for (const collection of collections) {
    const wanted = ACCENTS.filter((a) => a.collection === collection);
    const fields = [...new Set(wanted.map((a) => a.field))];
    const current = await get<Record<string, unknown>>(
      `/items/${collection}?fields=${fields.join(",")}`,
    );

    const payload: Record<string, string> = {};
    for (const { field, fragment } of wanted) {
      // Une même passe peut marquer deux fragments du même champ.
      const value = payload[field] ?? current[field];
      if (typeof value !== "string" || value.trim() === "") {
        console.log(`  ⚠ ${collection}.${field} : vide → « ${fragment} » non posé`);
        continue;
      }
      const marked = mark(value, fragment);
      if (marked === null) {
        const done = value.includes(`**${fragment}**`);
        console.log(
          done
            ? `  = ${collection}.${field} : « ${fragment} » déjà en avant`
            : `  ⚠ ${collection}.${field} : « ${fragment} » INTROUVABLE → à faire dans l'admin\n      valeur en place : ${value}`,
        );
        continue;
      }
      payload[field] = marked;
      console.log(`  + ${collection}.${field} : « ${fragment} » en gras doré`);
    }

    if (Object.keys(payload).length) await patch(`/items/${collection}`, payload);
  }

  console.log("✓ Terminé (aucune phrase réécrite, seuls des ** ont été ajoutés).");
}

main().catch((e) => {
  console.error("✗ Mises en avant échouées :", e instanceof Error ? e.message : e);
  process.exit(1);
});
