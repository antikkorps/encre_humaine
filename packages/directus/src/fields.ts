// DSL compact de définition de champs → payloads Directus (field + relation + junction).
// Objectif : décrire le modèle de docs/02 de façon lisible, sans répéter le verbeux
// format Directus partout. Le moteur (bootstrap.ts) consomme les `Spec` produites ici.

type Json = Record<string, unknown>;

/** Relation à créer après le champ (clé étrangère). */
type RelationFor = (collection: string) => Json;
/** Collection de jonction (M2M) à créer, paramétrée par la collection parente. */
type JunctionFor = (collection: string) => { collection: Json; fields: Json[]; relations: Json[] };

export type Spec = {
  field: string;
  type: string;
  meta: Json;
  schema: Json | null;
  relation?: RelationFor;
  junction?: JunctionFor;
};

type Opt = {
  note?: string;
  required?: boolean;
  half?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  default?: unknown;
};

const width = (o?: Opt) => (o?.half ? "half" : "full");

function base(field: string, type: string, meta: Json, schema: Json | null, o?: Opt): Spec {
  return {
    field,
    type,
    schema,
    meta: {
      width: width(o),
      ...(o?.note ? { note: o.note } : {}),
      ...(o?.required ? { required: true } : {}),
      ...(o?.readonly ? { readonly: true } : {}),
      ...(o?.hidden ? { hidden: true } : {}),
      ...meta,
    },
  };
}

// ── Champs scalaires ─────────────────────────────────────────────────────────

export const input = (field: string, o?: Opt): Spec =>
  base(field, "string", { interface: "input" }, { is_nullable: !o?.required }, o);

export const slug = (field = "slug", o?: Opt): Spec =>
  base(
    field,
    "string",
    {
      interface: "input",
      options: { slug: true, trim: true },
      note: o?.note ?? "Identifiant d'URL (kebab-case)",
    },
    { is_nullable: false, is_unique: true },
    { ...o, required: true },
  );

export const textarea = (field: string, o?: Opt): Spec =>
  base(field, "text", { interface: "input-multiline" }, { is_nullable: !o?.required }, o);

export const richtext = (field: string, o?: Opt): Spec =>
  base(field, "text", { interface: "input-rich-text-html" }, { is_nullable: !o?.required }, o);

export const bool = (field: string, def = false, o?: Opt): Spec =>
  base(
    field,
    "boolean",
    { interface: "boolean", special: ["cast-boolean"] },
    { default_value: def, is_nullable: false },
    o,
  );

export const integer = (field: string, o?: Opt): Spec =>
  base(
    field,
    "integer",
    { interface: "input" },
    { is_nullable: !o?.required, default_value: o?.default ?? null },
    o,
  );

export const datetime = (field: string, o?: Opt): Spec =>
  base(field, "timestamp", { interface: "datetime" }, { is_nullable: !o?.required }, o);

/** Liste de mots-clés (interface tags → JSON). */
export const tags = (field: string, o?: Opt): Spec =>
  base(
    field,
    "json",
    { interface: "tags", special: ["cast-json"], options: { placeholder: "Ajouter…" } },
    { is_nullable: true },
    o,
  );

/** Choix d'une liste : libellé affiché + valeur stockée (texte ou entier). */
export type Choice<V extends string | number = string> = { text: string; value: V };

/**
 * Meta commun à toutes les listes de choix. `display: "labels"` est indispensable :
 * sans lui, la vue LISTE de l'admin affiche la valeur brute stockée (`b2c`,
 * `general`…) alors que le formulaire affiche le libellé — deux vocabulaires pour
 * un même champ, source de confusion pour l'éditrice (retour Éléonore 2026-08-06).
 * `reconcile.ts` resynchronise ce meta sur les champs DÉJÀ créés (bootstrap additif).
 */
const choiceMeta = <V extends string | number>(iface: string, choices: Choice<V>[]): Json => ({
  interface: iface,
  options: { choices },
  display: "labels",
  display_options: { choices, showAsDot: false },
});

/** Liste déroulante (une valeur texte). */
export const select = (field: string, choices: Choice[], o?: Opt & { default?: string }): Spec =>
  base(
    field,
    "string",
    choiceMeta("select-dropdown", choices),
    { is_nullable: !o?.required, default_value: o?.default ?? null },
    o,
  );

/** Liste déroulante à valeurs entières (ex. une note de 1 à 5). */
export const selectInt = (field: string, choices: Choice<number>[], o?: Opt): Spec =>
  base(
    field,
    "integer",
    choiceMeta("select-dropdown", choices),
    { is_nullable: true, default_value: null },
    o,
  );

/**
 * Choix MULTIPLES (cases à cocher) → colonne JSON (tableau de valeurs).
 * Pensé pour « en plus de X, aussi sur Y et Z » : une case cochée = une surface
 * d'affichage supplémentaire, aucune case = le comportement par défaut du champ.
 */
export const selectMulti = (field: string, choices: Choice[], o?: Opt): Spec =>
  base(
    field,
    "json",
    { ...choiceMeta("select-multiple-checkbox", choices), special: ["cast-json"] },
    { is_nullable: true },
    o,
  );

/** Séparateur visuel (alias, aucune colonne) — sert à grouper proprement (ex. « SEO »). */
export const divider = (field: string, label: string): Spec => ({
  field,
  type: "alias",
  schema: null,
  meta: {
    interface: "presentation-divider",
    special: ["alias", "no-data"],
    options: { title: label },
    width: "full",
  },
});

// ── Répéteurs (interface « list » → JSON, pas de table relationnelle) ─────────

type Sub = {
  field: string;
  type?: string;
  interface?: string;
  options?: Json;
  width?: "half" | "full";
};

export const repeater = (field: string, subfields: Sub[], o?: Opt): Spec =>
  base(
    field,
    "json",
    {
      interface: "list",
      special: ["cast-json"],
      options: {
        fields: subfields.map((s) => ({
          field: s.field,
          name: s.field,
          type: s.type ?? "string",
          meta: {
            field: s.field,
            interface: s.interface ?? "input",
            width: s.width ?? "full",
            ...(s.options ? { options: s.options } : {}),
          },
        })),
      },
    },
    { is_nullable: true },
    o,
  );

// ── Statut, SEO, audit, tri ──────────────────────────────────────────────────

const STATUS_CHOICES = [
  { text: "$t:published", value: "published" },
  { text: "$t:draft", value: "draft" },
  { text: "$t:archived", value: "archived" },
];

/** Bloc statut workflow — Nuxt ne lit que `published`. */
export const status = (): Spec =>
  base(
    "status",
    "string",
    {
      interface: "select-dropdown",
      special: undefined,
      display: "labels",
      display_options: { showAsDot: true, choices: STATUS_CHOICES },
      options: { choices: STATUS_CHOICES },
      width: "half",
    },
    { default_value: "draft", is_nullable: false },
  );

/** Champ de tri manuel. */
export const sort = (): Spec =>
  base("sort", "integer", { interface: "input", hidden: true }, { is_nullable: true }, {});

/** Champs système d'audit Directus (qui/quand). */
export const auditFields = (): Spec[] => [
  base(
    "date_created",
    "timestamp",
    {
      interface: "datetime",
      readonly: true,
      hidden: true,
      special: ["date-created"],
      width: "half",
    },
    { is_nullable: true },
  ),
  base(
    "date_updated",
    "timestamp",
    {
      interface: "datetime",
      readonly: true,
      hidden: true,
      special: ["date-updated"],
      width: "half",
    },
    { is_nullable: true },
  ),
  base(
    "user_created",
    "uuid",
    {
      interface: "select-dropdown-m2o",
      readonly: true,
      hidden: true,
      special: ["user-created"],
      width: "half",
    },
    { is_nullable: true },
  ),
  base(
    "user_updated",
    "uuid",
    {
      interface: "select-dropdown-m2o",
      readonly: true,
      hidden: true,
      special: ["user-updated"],
      width: "half",
    },
    { is_nullable: true },
  ),
];

/** Bloc SEO réutilisable (docs/02 §3). `og_image` = relation fichier. */
export const seoBlock = (): Spec[] => [
  divider("seo_divider", "SEO"),
  input("meta_title", { note: "Fallback : titre de l'item + nom du site" }),
  textarea("meta_description"),
  imageFile("og_image", { note: "Fallback : site_settings.default_og_image" }),
  bool("no_index", false, { note: "Exclure cette page de l'indexation", half: true }),
];

// ── Relations fichiers / M2O ─────────────────────────────────────────────────

const fileRelation =
  (field: string): RelationFor =>
  (collection) => ({
    collection,
    field,
    related_collection: "directus_files",
    schema: { on_delete: "SET NULL" },
    meta: { sort_field: null },
  });

/** Image unique (M2O → directus_files), interface aperçu image. */
export const imageFile = (field: string, o?: Opt): Spec => ({
  ...base(field, "uuid", { interface: "file-image", special: ["file"] }, { is_nullable: true }, o),
  relation: fileRelation(field),
});

/** Fichier quelconque (M2O → directus_files), ex. PDF de ressource. */
export const file = (field: string, o?: Opt): Spec => ({
  ...base(field, "uuid", { interface: "file", special: ["file"] }, { is_nullable: true }, o),
  relation: fileRelation(field),
});

/** Relation Many-to-One vers une autre collection (pk uuid). */
export const m2o = (field: string, related: string, o?: Opt): Spec => ({
  ...base(
    field,
    "uuid",
    { interface: "select-dropdown-m2o", special: ["m2o"], display: "related-values" },
    { is_nullable: true },
    o,
  ),
  relation: (collection) => ({
    collection,
    field,
    related_collection: related,
    schema: { on_delete: "SET NULL" },
    meta: { sort_field: null },
  }),
});

/** Relation Many-to-Many vers directus_files (galerie d'images), via jonction `<coll>_files`. */
export const files = (field: string, o?: Opt): Spec => ({
  field,
  type: "alias",
  schema: null,
  meta: {
    interface: "files",
    special: ["files"],
    options: {},
    width: "full",
    ...(o?.note ? { note: o.note } : {}),
  },
  junction: (collection) => {
    const jc = `${collection}_files`;
    return {
      collection: {
        collection: jc,
        meta: { hidden: true, icon: "import_export" },
        schema: { name: jc },
        fields: [
          {
            field: "id",
            type: "integer",
            meta: { hidden: true },
            schema: { is_primary_key: true, has_auto_increment: true },
          },
          { field: `${collection}_id`, type: "uuid", meta: { hidden: true }, schema: {} },
          { field: "directus_files_id", type: "uuid", meta: { hidden: true }, schema: {} },
          { field: "sort", type: "integer", meta: { hidden: true }, schema: {} },
        ],
      },
      fields: [],
      relations: [
        {
          collection: jc,
          field: `${collection}_id`,
          related_collection: collection,
          schema: { on_delete: "SET NULL" },
          meta: { one_field: field, sort_field: "sort", junction_field: "directus_files_id" },
        },
        {
          collection: jc,
          field: "directus_files_id",
          related_collection: "directus_files",
          schema: { on_delete: "SET NULL" },
          meta: { one_field: null, junction_field: `${collection}_id` },
        },
      ],
    };
  },
});
