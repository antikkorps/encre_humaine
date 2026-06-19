// Rôles, policies & permissions (modèle d'accès Directus 11) — docs/02 §6.
//  - Éditrice : CRUD sur tout le contenu + fichiers ; aucune structure/réglage.
//  - API (lecture) : lecture seule, status=published uniquement → token statique (Nuxt).
//  - Administrateur : rôle système par défaut (Franck), non recréé ici.

import { del, findPolicy, findRole, findUserByEmail, get, patch, post } from "./api.ts";
import { config } from "./env.ts";
import { allCollections } from "./schema.ts";

type Action = "create" | "read" | "update" | "delete" | "share";

const API_USER_EMAIL = "api-readonly@encrehumaine.fr";

/** Collections de contenu + indicateur « possède un champ status ». */
function contentTargets(): { collection: string; hasStatus: boolean; junction?: string }[] {
  const out: { collection: string; hasStatus: boolean; junction?: string }[] = [];
  for (const def of allCollections) {
    const hasStatus = def.fields.some((s) => s.field === "status");
    out.push({ collection: def.collection, hasStatus });
    for (const s of def.fields) {
      if (s.junction) out.push({ collection: `${def.collection}_${s.field}`, hasStatus: false });
    }
  }
  return out;
}

async function ensurePolicy(name: string, body: Record<string, unknown>): Promise<string> {
  const existing = await findPolicy(name);
  if (existing) {
    await patch(`/policies/${existing}`, body);
    return existing;
  }
  const created = await post<{ id: string }>("/policies", { name, ...body });
  return created.id;
}

async function ensureRole(name: string, body: Record<string, unknown>): Promise<string> {
  const existing = await findRole(name);
  if (existing) {
    await patch(`/roles/${existing}`, body);
    return existing;
  }
  const created = await post<{ id: string }>("/roles", { name, ...body });
  return created.id;
}

/** Lie un rôle à une policy (junction directus_access) si pas déjà lié. */
async function ensureAccess(role: string, policy: string): Promise<void> {
  const found = await get<{ id: string }[]>(
    `/access?filter[role][_eq]=${role}&filter[policy][_eq]=${policy}&limit=1`,
  );
  if (found.length === 0) await post("/access", { role, policy, sort: 1 });
}

/** Remplace les permissions d'une policy (purge puis recrée) — idempotent par reconstruction. */
async function resetPermissions(
  policy: string,
  rules: {
    collection: string;
    action: Action;
    fields?: string[];
    filter?: Record<string, unknown>;
  }[],
): Promise<void> {
  const existing = await get<{ id: number }[]>(
    `/permissions?filter[policy][_eq]=${policy}&limit=-1&fields=id`,
  );
  for (const p of existing) await del(`/permissions/${p.id}`);
  for (const r of rules) {
    await post("/permissions", {
      policy,
      collection: r.collection,
      action: r.action,
      fields: r.fields ?? ["*"],
      permissions: r.filter ?? {},
      validation: {},
    });
  }
}

export async function bootstrapAccess(): Promise<void> {
  const targets = contentTargets();

  // ── Policy + rôle Éditrice ────────────────────────────────────────────────
  const editorPolicy = await ensurePolicy("Éditrice — contenu", {
    icon: "edit",
    description: "CRUD complet sur le contenu et les fichiers. Aucune structure/réglage.",
    app_access: true,
    admin_access: false,
  });
  const editorRules: { collection: string; action: Action }[] = [];
  for (const t of targets) {
    for (const action of ["create", "read", "update", "delete"] as Action[]) {
      editorRules.push({ collection: t.collection, action });
    }
  }
  for (const action of ["create", "read", "update", "delete"] as Action[]) {
    editorRules.push({ collection: "directus_files", action });
  }
  await resetPermissions(editorPolicy, editorRules);
  const editorRole = await ensureRole("Éditrice", {
    icon: "edit_note",
    description: "Eléonore — édition du contenu (docs/02 §6).",
  });
  await ensureAccess(editorRole, editorPolicy);

  // ── Policy + rôle API lecture (published-only) ────────────────────────────
  const apiPolicy = await ensurePolicy("API — lecture published", {
    icon: "cloud_download",
    description: "Lecture seule, status=published uniquement. Consommé par le serveur Nuxt.",
    app_access: false,
    admin_access: false,
  });
  const apiRules: { collection: string; action: Action; filter?: Record<string, unknown> }[] = [];
  for (const t of targets) {
    apiRules.push({
      collection: t.collection,
      action: "read",
      filter: t.hasStatus ? { status: { _eq: "published" } } : {},
    });
  }
  apiRules.push({ collection: "directus_files", action: "read" });
  await resetPermissions(apiPolicy, apiRules);
  const apiRole = await ensureRole("API (lecture)", {
    icon: "api",
    description: "Token serveur Nuxt — lecture seule published (docs/02 §6).",
  });
  await ensureAccess(apiRole, apiPolicy);

  // ── Utilisateur API à token statique ──────────────────────────────────────
  const existingUser = await findUserByEmail(API_USER_EMAIL);
  if (existingUser) {
    await patch(`/users/${existingUser}`, {
      role: apiRole,
      token: config.readToken,
      status: "active",
    });
  } else {
    await post("/users", {
      email: API_USER_EMAIL,
      first_name: "API",
      last_name: "Lecture",
      role: apiRole,
      token: config.readToken,
      status: "active",
    });
  }
}
