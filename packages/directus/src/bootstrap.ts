// Bootstrap idempotent du schéma Directus + rôles/permissions.
// Re-jouable à volonté : ne crée que ce qui manque. Source : schema.ts (docs/02).
//
//   pnpm --filter @encre/directus bootstrap   (ou : make cms-bootstrap)
//
// Pré-requis : la stack tourne et l'API répond (make cms-up).

import { bootstrapAccess } from "./access.ts";
import {
  ensureCollection,
  ensureField,
  ensureRelation,
  listCollections,
  listFields,
  listRelations,
} from "./api.ts";
import { allCollections, type CollectionDef } from "./schema.ts";

type Json = Record<string, unknown>;

/** Clé primaire uuid auto-générée, commune à toutes les collections de contenu. */
const PK = {
  field: "id",
  type: "uuid",
  meta: { hidden: true, readonly: true, interface: "input", special: ["uuid"] },
  schema: { is_primary_key: true, length: 36, has_auto_increment: false },
};

function collectionMeta(def: CollectionDef): Json {
  const hasStatus = def.fields.some((s) => s.field === "status");
  const hasSort = def.fields.some((s) => s.field === "sort");
  return {
    ...(def.singleton ? { singleton: true } : {}),
    ...(def.icon ? { icon: def.icon } : {}),
    ...(def.note ? { note: def.note } : {}),
    ...(def.color ? { color: def.color } : {}),
    ...(hasSort ? { sort_field: "sort" } : {}),
    ...(hasStatus
      ? { archive_field: "status", archive_value: "archived", unarchive_value: "draft" }
      : {}),
  };
}

const created = { collections: 0, fields: 0, relations: 0 };

async function ensureSchema(): Promise<void> {
  // Pass A — collections (avec seulement la pk ; les champs suivent, idempotents).
  for (const def of allCollections) {
    const isNew = await ensureCollection({
      collection: def.collection,
      meta: collectionMeta(def),
      schema: { name: def.collection },
      fields: [PK],
    });
    if (isNew) {
      created.collections++;
      console.log(`  + collection ${def.collection}`);
    }
  }

  // Pass B — champs (colonnes scalaires, dividers, répéteurs, colonnes de relation).
  for (const def of allCollections) {
    const have = await listFields(def.collection);
    for (const s of def.fields) {
      const made = await ensureField(
        def.collection,
        { field: s.field, type: s.type, meta: s.meta, schema: s.schema },
        have,
      );
      if (made) {
        have.add(s.field);
        created.fields++;
      }
    }
  }

  // Pass C — relations & collections de jonction (M2M fichiers).
  const relations = await listRelations();
  const cols = await listCollections();
  for (const def of allCollections) {
    for (const s of def.fields) {
      if (s.junction) {
        const j = s.junction(def.collection);
        const jName = (j.collection as { collection: string }).collection;
        if (!cols.has(jName)) {
          await ensureCollection(j.collection as Json & { collection: string });
          cols.add(jName);
          created.collections++;
          console.log(`  + jonction ${jName}`);
        }
        for (const rel of j.relations) {
          const made = await ensureRelation(
            rel as Json & { collection: string; field: string },
            relations,
          );
          if (made) {
            relations.add(
              `${(rel as { collection: string }).collection}.${(rel as { field: string }).field}`,
            );
            created.relations++;
          }
        }
      }
      if (s.relation) {
        const rel = s.relation(def.collection);
        const made = await ensureRelation(
          rel as Json & { collection: string; field: string },
          relations,
        );
        if (made) {
          relations.add(`${def.collection}.${s.field}`);
          created.relations++;
        }
      }
    }
  }
}

async function main(): Promise<void> {
  console.log("→ Bootstrap schéma Directus (docs/02)…");
  await ensureSchema();
  console.log(
    `  schéma : +${created.collections} collections, +${created.fields} champs, +${created.relations} relations`,
  );
  console.log("→ Rôles & permissions…");
  await bootstrapAccess();
  console.log("  rôles : Éditrice + API (lecture, published-only) + token statique");
  console.log("✓ Bootstrap terminé.");
}

main().catch((err) => {
  console.error("\n✗ Bootstrap échoué :\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
