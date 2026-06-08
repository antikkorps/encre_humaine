/**
 * Enveloppe d'erreur uniforme — docs/03-api-contracts.md §0.
 * Toute réponse d'erreur des endpoints Nitro suit cette forme.
 */

export type ErrorCode =
  | "validation_error"
  | "turnstile_failed"
  | "rate_limited"
  | "invalid_signature"
  | "not_found"
  | "internal_error";

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
  };
}

export function errorEnvelope(code: ErrorCode, message: string): ErrorEnvelope {
  return { error: { code, message } };
}

/** Statut HTTP cohérent par code (docs/03 §2, §3 ; docs/06 §1-2). */
export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  validation_error: 422,
  turnstile_failed: 403,
  rate_limited: 429,
  invalid_signature: 400,
  not_found: 404,
  internal_error: 500,
};
