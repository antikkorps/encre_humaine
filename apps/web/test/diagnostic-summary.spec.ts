// @vitest-environment node
//
// Version lisible d'un diagnostic, pour Éléonore (copie par email et champ
// « Réponses en clair » de l'admin) : questions et réponses en toutes lettres,
// jamais la réponse sensible B2C.
import { B2B_TEXTS, B2C_TEXTS } from "@encre/shared/diagnostics";
import { describe, expect, it } from "vitest";
import { diagnosticSummary } from "~/utils/diagnostic-summary";
import { renderDiagnosticOwnerEmail } from "../server/utils/diagnostic-email";
import { prepareDiagnostic } from "../server/utils/diagnostics";

const B2B_ANSWERS = {
  profile: "hr",
  size: "50-149",
  priority: "unknown",
  a_practices: 2,
  a_onboarding: 2,
  a_indicators: 2,
  b_key_person: 1,
  b_reviews: 1,
  b_training_plan: 1,
  c_support: 0,
  c_tension: 0,
  c_consistency: 0,
};

const B2C_ANSWERS = {
  situation: "employed",
  orientation: "direction",
  d_one_sentence: 0,
  d_drivers: 1,
  d_skills: 2,
  d_values: 1,
  d_constraints: 0,
  d_options: 2,
  d_tested: 1,
  d_support: 0,
  d_funding: 2,
};

const b2b = () => {
  const p = prepareDiagnostic("b2b", B2B_ANSWERS);
  return diagnosticSummary("b2b", B2B_TEXTS, p.answers, p.result);
};
const b2c = (answers: Record<string, number | string> = B2C_ANSWERS) => {
  const p = prepareDiagnostic("b2c", answers);
  return diagnosticSummary("b2c", B2C_TEXTS, p.answers, p.result);
};

describe("diagnosticSummary", () => {
  it("B2B : scores, offres, puis chaque question avec sa réponse en clair", () => {
    const text = b2b();
    expect(text).toContain("Score global : 50/100");
    expect(text).toContain("Audit RH");
    const q = B2B_TEXTS.questions.c_support;
    expect(text).toContain(q?.label ?? "?");
    expect(text).toContain(`→ ${q?.options[0]}`);
    // Aucun code technique (clé de menu brute, index) n'apparaît comme réponse.
    expect(text).not.toMatch(/→ (\d|50-149|unknown)$/m);
  });

  it("B2B : la question suit le profil (variante RH)", () => {
    const q = B2B_TEXTS.questions.a_practices;
    expect(q?.variant).toBeTruthy();
    expect(b2b()).toContain(q?.variant ?? "?");
    expect(b2b()).not.toContain(`. ${q?.label}`);
  });

  it("B2C : 12 questions numérotées, Q3 signalée non conservée", () => {
    const text = b2c();
    expect(text.match(/^\d+\. /gm)).toHaveLength(12);
    expect(text).toContain(B2C_TEXTS.questions.difficulty?.label ?? "?");
    expect(text).toContain("non conservée");
  });

  it("B2C : jamais la réponse sensible, même si elle arrive", () => {
    const text = b2c({ ...B2C_ANSWERS, difficulty: "hard" });
    for (const option of B2C_TEXTS.questions.difficulty?.options ?? []) {
      expect(text).not.toContain(option);
    }
  });
});

describe("renderDiagnosticOwnerEmail", () => {
  it("objet parlant, email du prospect, résumé, lien du rapport et source", () => {
    const mail = renderDiagnosticOwnerEmail({
      kind: "b2b",
      email: "drh@exemple.fr",
      summary: "RÉSUMÉ",
      reportUrl: "https://encrehumaine.fr/diagnostic/rapport/abc",
      source: "linkedin",
      consentNewsletter: true,
    });
    expect(mail.subject).toBe("Nouveau diagnostic RH — drh@exemple.fr");
    expect(mail.text).toContain("RÉSUMÉ");
    expect(mail.text).toContain("https://encrehumaine.fr/diagnostic/rapport/abc");
    expect(mail.text).toContain("Source : linkedin");
    expect(mail.text).toContain("Newsletter : oui");
  });

  it("B2C : objet « projet », pas de ligne source vide", () => {
    const mail = renderDiagnosticOwnerEmail({
      kind: "b2c",
      email: "p@exemple.fr",
      summary: "R",
      reportUrl: "https://encrehumaine.fr/diagnostic/rapport/x",
      source: null,
      consentNewsletter: false,
    });
    expect(mail.subject).toBe("Nouveau diagnostic projet — p@exemple.fr");
    expect(mail.text).not.toContain("Source");
    expect(mail.text).toContain("Newsletter : non");
  });
});
