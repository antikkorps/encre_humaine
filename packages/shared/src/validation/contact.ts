import * as v from "valibot";

/** Audience commune (cohérente avec l'enum Drizzle `audience`). */
export const AudienceSchema = v.picklist(["organisation", "particulier"]);
export type Audience = v.InferOutput<typeof AudienceSchema>;

/**
 * Payload du formulaire de contact — docs/03-api-contracts.md §2.
 * Réutilisé client (formulaire) + serveur (endpoint) — DRY.
 */
export const ContactPayloadSchema = v.object({
  firstName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  email: v.pipe(v.string(), v.trim(), v.email()),
  audience: AudienceSchema,
  message: v.pipe(v.string(), v.trim(), v.minLength(10), v.maxLength(2000)),
  sourcePage: v.optional(v.pipe(v.string(), v.maxLength(255))),
  turnstileToken: v.pipe(v.string(), v.nonEmpty()),
});

export type ContactPayload = v.InferOutput<typeof ContactPayloadSchema>;
