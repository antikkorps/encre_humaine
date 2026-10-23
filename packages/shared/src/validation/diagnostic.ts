import * as v from "valibot";

/**
 * Déblocage du rapport d'un diagnostic — `POST /api/diagnostics/unlock`
 * (docs/11-diagnostics.md). Les réponses ne sont que des index ou des clés : le
 * serveur recalcule tout (`@encre/shared/diagnostics`) et refuse un
 * questionnaire incomplet. Le consentement au rapport est obligatoire.
 */
const AnswerSchema = v.union([
  v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2)),
  v.pipe(v.string(), v.maxLength(40)),
]);

/** Source du lien (`?source=`) : courte, sans caractère spécial, sinon ignorée. */
const SourceSchema = v.pipe(
  v.optional(v.unknown()),
  v.transform((s) => (typeof s === "string" && /^[\w-]{1,64}$/.test(s) ? s : undefined)),
);

export const DiagnosticUnlockSchema = v.object({
  kind: v.picklist(["b2b", "b2c"]),
  answers: v.pipe(
    v.record(v.pipe(v.string(), v.maxLength(40)), AnswerSchema),
    v.check((a) => Object.keys(a).length <= 20, "Trop de réponses."),
  ),
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(254)),
  consentReport: v.literal(true),
  consentNewsletter: v.optional(v.boolean(), false),
  source: SourceSchema,
  turnstileToken: v.pipe(v.string(), v.nonEmpty()),
});
export type DiagnosticUnlockPayload = v.InferOutput<typeof DiagnosticUnlockSchema>;
