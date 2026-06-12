import { createDirectus, rest, staticToken } from "@directus/sdk";
import type { Schema } from "@encre/directus/schema";

/**
 * Client Directus côté serveur (lecture seule) — docs/02 §Accès, docs/03 §0.
 * Typé via le schéma généré (`@encre/directus/schema`, DRY). Le token est
 * *published-only* et reste STRICTEMENT serveur : jamais exposé au client
 * (docs/06 §1). L'URL publique de Directus sert d'endpoint REST.
 *
 * Le rôle API associé au token ne voit que `status = published` : les requêtes
 * ne ramènent jamais de brouillon, même sans filtre explicite.
 */
let client: ReturnType<typeof build> | null = null;

function build() {
  const config = useRuntimeConfig();
  const url = config.public.directusPublicUrl;
  const token = config.directusReadToken;
  if (!url || !token) {
    throw createError({
      statusCode: 500,
      statusMessage: "Directus non configuré (DIRECTUS_PUBLIC_URL / DIRECTUS_READ_TOKEN).",
    });
  }
  return createDirectus<Schema>(url).with(staticToken(token)).with(rest());
}

/** Client Directus typé, mémoïsé (la config runtime est stable au runtime). */
export function directusServer() {
  if (!client) client = build();
  return client;
}

// Types de contenu réexportés pour les endpoints/pages (import unique).
export type { Schema } from "@encre/directus/schema";
