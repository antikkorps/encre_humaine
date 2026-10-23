import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { DiagnosticUnlockSchema } from "./diagnostic.ts";

/** Déblocage d'un rapport de diagnostic — docs/11-diagnostics.md. */
const valid = {
  kind: "b2b",
  answers: { profile: "leader", a_practices: 0 },
  email: "  dirigeant@exemple.fr ",
  consentReport: true,
  consentNewsletter: false,
  turnstileToken: "tok",
};

describe("DiagnosticUnlockSchema", () => {
  it("accepte un déblocage complet et nettoie l'email", () => {
    const r = v.safeParse(DiagnosticUnlockSchema, valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.output.email).toBe("dirigeant@exemple.fr");
  });

  it.each([
    ["consentement non coché", { consentReport: false }],
    ["email invalide", { email: "pas-un-email" }],
    ["diagnostic inconnu", { kind: "b2x" }],
    ["sans Turnstile", { turnstileToken: "" }],
    ["réponse d'un type inattendu", { answers: { a_practices: { $gt: 0 } } }],
    [
      "trop de réponses",
      { answers: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`q${i}`, 0])) },
    ],
  ])("refuse : %s", (_, patch) => {
    expect(v.safeParse(DiagnosticUnlockSchema, { ...valid, ...patch }).success).toBe(false);
  });

  it("borne la source du lien (lettres, chiffres, tirets) et l'ignore sinon", () => {
    const ok = v.safeParse(DiagnosticUnlockSchema, { ...valid, source: "email-dirigeants_oct" });
    expect(ok.success && ok.output.source).toBe("email-dirigeants_oct");
    const bad = v.safeParse(DiagnosticUnlockSchema, { ...valid, source: "<script>" });
    expect(bad.success && bad.output.source).toBeUndefined();
  });
});
