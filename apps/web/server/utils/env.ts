import { parseServerEnv, type ServerEnv } from "@encre/shared/env";

let cached: ServerEnv | null = null;

/**
 * Accès mémoïsé à l'environnement validé (docs/06 §5).
 * La validation dure est faite une fois au boot (server/plugins/00.validate-env).
 */
export function serverEnv(): ServerEnv {
  if (!cached) cached = parseServerEnv();
  return cached;
}
