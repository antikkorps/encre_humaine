// Client REST Directus minimal (fetch natif, zéro dépendance) + helpers idempotents.
// On parle directement à l'API d'administration avec un token admin obtenu par login.
import { config } from "./env.ts";

type Json = Record<string, unknown>;

let token: string | null = null;

async function login(): Promise<string> {
  if (token) return token;
  const res = await fetch(`${config.url}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.adminEmail, password: config.adminPassword }),
  });
  if (!res.ok) {
    throw new Error(`Login admin Directus échoué (${res.status}). Stack démarrée ? (make cms-up)`);
  }
  const body = (await res.json()) as { data: { access_token: string } };
  token = body.data.access_token;
  return token;
}

async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const t = await login();
  const res = await fetch(`${config.url}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${t}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}\n${text}`);
  }
  if (!text) return undefined as T;
  const parsed = JSON.parse(text) as { data?: T };
  return (parsed.data ?? (parsed as unknown)) as T;
}

export const get = <T = unknown>(path: string) => api<T>("GET", path);
export const post = <T = unknown>(path: string, body: unknown) => api<T>("POST", path, body);
export const patch = <T = unknown>(path: string, body: unknown) => api<T>("PATCH", path, body);
export const del = (path: string) => api<void>("DELETE", path);

export const serverHealthUrl = `${config.url}/server/health`;

// ── Helpers idempotents ──────────────────────────────────────────────────────

export async function listCollections(): Promise<Set<string>> {
  const data = await get<{ collection: string }[]>("/collections");
  return new Set(data.map((c) => c.collection));
}

export async function listFields(collection: string): Promise<Set<string>> {
  const data = await get<{ field: string }[]>(`/fields/${collection}`);
  return new Set(data.map((f) => f.field));
}

export async function listRelations(): Promise<Set<string>> {
  const data = await get<{ collection: string; field: string }[]>("/relations");
  return new Set(data.map((r) => `${r.collection}.${r.field}`));
}

/** Crée une collection si absente ; renvoie true si créée. */
export async function ensureCollection(payload: Json & { collection: string }): Promise<boolean> {
  const existing = await listCollections();
  if (existing.has(payload.collection)) return false;
  await post("/collections", payload);
  return true;
}

/** Ajoute un champ si absent ; renvoie true si créé. */
export async function ensureField(
  collection: string,
  field: Json & { field: string },
  existing?: Set<string>,
): Promise<boolean> {
  const have = existing ?? (await listFields(collection));
  if (have.has(field.field)) return false;
  await post(`/fields/${collection}`, field);
  return true;
}

/** Crée une relation si absente (clé `collection.field`). */
export async function ensureRelation(
  payload: Json & { collection: string; field: string },
  existing?: Set<string>,
): Promise<boolean> {
  const have = existing ?? (await listRelations());
  if (have.has(`${payload.collection}.${payload.field}`)) return false;
  await post("/relations", payload);
  return true;
}

/** Récupère l'id d'une policy par nom, ou null. */
export async function findPolicy(name: string): Promise<string | null> {
  const data = await get<{ id: string; name: string }[]>(
    `/policies?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`,
  );
  return data[0]?.id ?? null;
}

export async function findRole(name: string): Promise<string | null> {
  const data = await get<{ id: string; name: string }[]>(
    `/roles?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`,
  );
  return data[0]?.id ?? null;
}

export async function findUserByEmail(email: string): Promise<string | null> {
  const data = await get<{ id: string }[]>(
    `/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1`,
  );
  return data[0]?.id ?? null;
}
