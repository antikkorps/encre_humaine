import * as v from "valibot";

/**
 * Inscription newsletter — docs/03-api-contracts.md §3.1.
 * Friction minimale : prénom optionnel + email + Turnstile.
 */
export const NewsletterSubscribeSchema = v.object({
  firstName: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80))),
  email: v.pipe(v.string(), v.trim(), v.email()),
  turnstileToken: v.pipe(v.string(), v.nonEmpty()),
});

export type NewsletterSubscribe = v.InferOutput<typeof NewsletterSubscribeSchema>;

/**
 * Confirmation double opt-in (query) — docs/03-api-contracts.md §3.2.
 */
export const NewsletterConfirmSchema = v.object({
  token: v.pipe(v.string(), v.nonEmpty()),
  email: v.pipe(v.string(), v.trim(), v.email()),
});

export type NewsletterConfirm = v.InferOutput<typeof NewsletterConfirmSchema>;
