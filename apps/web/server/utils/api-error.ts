import { type ErrorCode, errorEnvelope, STATUS_BY_CODE } from "@encre/shared";

/**
 * Lève une erreur Nitro portant l'enveloppe uniforme — docs/03-api-contracts.md §0.
 * Le corps de réponse suit `{ error: { code, message } }` (via `data`), le statut
 * HTTP est celui mappé par code. À utiliser dans tous les endpoints publics.
 */
export function throwApiError(code: ErrorCode, message: string): never {
  throw createError({
    statusCode: STATUS_BY_CODE[code],
    statusMessage: message,
    data: errorEnvelope(code, message),
  });
}
