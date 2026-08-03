// Génère les types TypeScript du schéma Directus → src/schema.gen.ts.
// Source : snapshots/schema.yaml (artefact versionné, lui-même dérivé du DSL).
// DRY (docs/02 §Accès) : les types de contenu sont DÉRIVÉS, jamais ré-écrits ;
// `schema.gen.ts` ne se modifie pas à la main (régénérer via `pnpm directus:types`).
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { repoRoot } from "./compose.ts";

const SNAP = resolve(repoRoot, "packages/directus/snapshots/schema.yaml");
const OUT = resolve(repoRoot, "packages/directus/src/schema.gen.ts");

interface FieldDef {
  collection: string;
  field: string;
  type: string;
  meta: { special: string[] | null } | null;
  schema?: { is_primary_key?: boolean; is_nullable?: boolean } | null;
}
interface RelationDef {
  related_collection: string | null;
  meta: {
    many_collection: string;
    many_field: string;
    one_collection: string | null;
    one_field: string | null;
  };
}
interface Snapshot {
  collections: { collection: string; meta: { singleton?: boolean } }[];
  fields: FieldDef[];
  relations: RelationDef[];
}

const snap = parse(readFileSync(SNAP, "utf8")) as Snapshot;

/** snake_case collection → PascalCase nom d'interface. */
const pascal = (name: string) =>
  name.replace(/(^|_)([a-z])/g, (_, __, c: string) => c.toUpperCase());

/** Type scalaire TS depuis le type Directus. */
function scalar(type: string): string {
  switch (type) {
    case "integer":
    case "bigInteger":
    case "float":
    case "decimal":
      return "number";
    case "boolean":
      return "boolean";
    case "json":
      // Repeaters/objets : forme non décrite par le snapshot → affiné côté vue.
      return "unknown";
    case "csv":
      return "string[]";
    default:
      // uuid, string, text, hash, date, time, dateTime, timestamp…
      return "string";
  }
}

/** Type d'un champ relationnel ou scalaire, nullabilité incluse. */
function fieldType(f: FieldDef): string {
  const special = f.meta?.special ?? [];
  const nullable = f.schema?.is_nullable !== false; // défaut Directus = nullable
  const nul = (t: string) => (nullable ? `${t} | null` : t);

  // m2o / fichier unique : ce champ porte une FK (many_field de la relation).
  const m2o = snap.relations.find(
    (r) => r.meta.many_collection === f.collection && r.meta.many_field === f.field,
  );
  if (m2o?.related_collection) {
    const rel = m2o.related_collection;
    if (rel === "directus_files") return nul("string | DirectusFile");
    if (rel.startsWith("directus_")) return nul("string"); // users/system : juste l'id
    return nul(`string | ${pascal(rel)}`);
  }

  // o2m / files : ce champ est le `one_field` d'une relation → tableau de jonction.
  const o2m = snap.relations.find(
    (r) => r.meta.one_collection === f.collection && r.meta.one_field === f.field,
  );
  if (o2m) return `${pascal(o2m.meta.many_collection)}[] | string[] | null`;

  // Champ alias relationnel sans relation résolue (sécurité) → unknown.
  if (special.includes("m2o") || special.includes("file") || special.includes("files")) {
    return nul("string");
  }

  return nul(scalar(f.type));
}

function emitCollection(collection: string): string {
  const fields = snap.fields.filter(
    (f) => f.collection === collection && !(f.meta?.special ?? []).includes("no-data"),
  );
  const lines = fields.map((f) => {
    if (f.schema?.is_primary_key) return `  ${f.field}: string;`;
    return `  ${f.field}: ${fieldType(f)};`;
  });
  return `export interface ${pascal(collection)} {\n${lines.join("\n")}\n}`;
}

// ── Génération ────────────────────────────────────────────────────────────────
const userCollections = snap.collections.filter((c) => !c.collection.startsWith("directus_"));

const interfaces = userCollections.map((c) => emitCollection(c.collection)).join("\n\n");

const schemaEntries = userCollections
  .map((c) => {
    const t = pascal(c.collection);
    return `  ${c.collection}: ${c.meta.singleton ? t : `${t}[]`};`;
  })
  .join("\n");

const header = `// ⚠️ FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
// Source : packages/directus/snapshots/schema.yaml — régénérer : pnpm directus:types
// Types de contenu Directus dérivés du schéma (DRY, docs/02 §Accès).
// biome-ignore-all lint/style/useNamingConvention: noms de champs = colonnes Directus (snake_case).

/** Fichier Directus (sous-ensemble utile côté lecture). */
export interface DirectusFile {
  id: string;
  filename_download: string;
  title: string | null;
  description: string | null;
  type: string | null;
  width: number | null;
  height: number | null;
}`;

// `directus_files` est déclarée dans le Schema (collection système) : sans elle,
// le SDK ne sait pas typer la **sélection imbriquée** d'un champ fichier
// (`fields: [{ story_photo: ["width", "height"] }]`), utile quand la vue a besoin
// des dimensions natives d'une image.
const body = `${header}\n\n${interfaces}\n\n/** Schéma consommé par le SDK Directus (createDirectus<Schema>). */
export interface Schema {\n${schemaEntries}\n  directus_files: DirectusFile[];\n}\n`;

writeFileSync(OUT, body);
console.log(`✓ types Directus → ${OUT} (${userCollections.length} collections)`);
