import * as v from "valibot";

/**
 * Inscription newsletter — docs/03-api-contracts.md §3.1.
 * Friction minimale : prénom optionnel + email + Turnstile.
 */
export const NewsletterSubscribeSchema = v.object({
  firstName: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80))),
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(254)), // RFC 5321
  turnstileToken: v.pipe(v.string(), v.nonEmpty()),
});

export type NewsletterSubscribe = v.InferOutput<typeof NewsletterSubscribeSchema>;

/**
 * Confirmation double opt-in (query) — docs/03-api-contracts.md §3.2.
 */
export const NewsletterConfirmSchema = v.object({
  // Token réel ~43 car. base64url ; borne haute pour éviter de parser des
  // entrées arbitrairement longues (le hash gèrerait, mais inutile de gaspiller).
  token: v.pipe(v.string(), v.nonEmpty(), v.maxLength(256)),
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(254)),
});

export type NewsletterConfirm = v.InferOutput<typeof NewsletterConfirmSchema>;
