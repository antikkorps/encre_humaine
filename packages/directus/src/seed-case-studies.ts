// Création des cas concrets d'un seed ciblé (runs 17, 18…) — partagé pour que la
// règle de tri et d'idempotence ne vive qu'à un endroit.

import { get, patch, post } from "./api.ts";

type CaseStudy = { readonly title: string; readonly offer_scopes: readonly string[] };

/**
 * Crée les cas qui n'existent pas encore (clé = le titre), rangés dans l'ordre
 * donné à la suite des cas déjà en place. Le tri n'est posé que sur un cas encore
 * non trié : le glisser-déposer d'Éléonore dans l'admin reste souverain.
 * Sans `apply`, n'écrit rien et se contente d'annoncer (`act`).
 */
export async function seedCaseStudies(
  studies: readonly CaseStudy[],
  { apply, act }: { apply: boolean; act: (msg: string) => void },
): Promise<void> {
  const existing = await get<{ sort: number | null }[]>("/items/case_studies?limit=-1&fields=sort");
  const offset = existing.reduce((max, c) => Math.max(max, c.sort ?? 0), 0);

  for (const [i, study] of studies.entries()) {
    const [found] = await get<{ id: string; sort: number | null }[]>(
      `/items/case_studies?filter[title][_eq]=${encodeURIComponent(study.title)}&limit=1&fields=id,sort`,
    );
    if (!found) {
      act(`case_studies : création de « ${study.title} » (position ${offset + i + 1})`);
      if (apply) {
        await post("/items/case_studies", {
          ...study,
          offer_scopes: [...study.offer_scopes],
          sort: offset + i + 1,
          status: "published",
        });
      }
      continue;
    }
    console.log(`= case_studies : « ${study.title} » existe déjà`);
    if (found.sort === null || found.sort === undefined) {
      act(`case_studies : « ${study.title} » → position ${offset + i + 1}`);
      if (apply) await patch(`/items/case_studies/${found.id}`, { sort: offset + i + 1 });
    }
  }
}
