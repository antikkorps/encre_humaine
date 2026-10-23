// @vitest-environment node
//
// Déblocage d'un diagnostic côté serveur (docs/11-diagnostics.md) : recalcul de
// référence, réponse sensible jamais enregistrée, version du consentement,
// appareil dérivé sans garder l'UA, email du rapport.
import { B2B_TEXTS, B2C_TEXTS } from "@encre/shared/diagnostics";
import { describe, expect, it } from "vitest";
import { renderDiagnosticEmail } from "../server/utils/diagnostic-email";
import {
  consentVersion,
  deviceFromUserAgent,
  prepareDiagnostic,
} from "../server/utils/diagnostics";

const B2C_ANSWERS = {
  situation: "employed",
  orientation: "direction",
  difficulty: "hard",
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

describe("prepareDiagnostic", () => {
  it("recalcule le résultat et ne garde jamais la réponse sensible", () => {
    const prepared = prepareDiagnostic("b2c", B2C_ANSWERS);
    expect(prepared.answers).not.toHaveProperty("difficulty");
    expect(JSON.stringify(prepared)).not.toContain("hard");
    expect(prepared.result).toMatchObject({ path: "direction", offer: "clarify" });
  });

  it("ignore les réponses étrangères au parcours", () => {
    const prepared = prepareDiagnostic("b2c", { ...B2C_ANSWERS, p_cv: 0, intrus: "x" });
    expect(prepared.answers).not.toHaveProperty("p_cv");
    expect(prepared.answers).not.toHaveProperty("intrus");
  });

  it("refuse un questionnaire incomplet", () => {
    const { d_funding: _, ...incomplete } = B2C_ANSWERS;
    expect(() => prepareDiagnostic("b2c", incomplete)).toThrow();
  });
});

describe("consentVersion / deviceFromUserAgent", () => {
  it("la version change avec le texte du consentement", () => {
    expect(consentVersion("Texte A")).toMatch(/^[0-9a-f]{12}$/);
    expect(consentVersion("Texte A")).not.toBe(consentVersion("Texte B"));
  });

  it("dérive mobile / desktop sans garder l'UA", () => {
    expect(deviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148")).toBe(
      "mobile",
    );
    expect(deviceFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
    expect(deviceFromUserAgent(undefined)).toBeNull();
  });
});

describe("renderDiagnosticEmail", () => {
  it("B2B : objet avec le niveau, rapport en ligne et rendez-vous, textes échappés", () => {
    const answers = {
      profile: "leader",
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
    const prepared = prepareDiagnostic("b2b", answers);
    const texts = { ...B2B_TEXTS, title: "Vos <RH>" };
    const email = renderDiagnosticEmail({
      kind: "b2b",
      texts,
      answers: prepared.answers,
      result: prepared.result,
      reportUrl: "https://encrehumaine.fr/diagnostic/rapport/abc",
      bookingUrl: "https://cal.com/e/rdv-30",
      email: "d@exemple.fr",
    });
    // A 0, B 50, C 100 → global 50 → « En structuration ».
    expect(email.subject).toBe("Votre diagnostic : En structuration");
    expect(email.html).toContain("https://encrehumaine.fr/diagnostic/rapport/abc");
    expect(email.html).toContain("cal.com/e/rdv-30");
    expect(email.html).toContain("Vos &lt;RH&gt;");
    expect(email.text).toContain("Audit RH");
  });

  it("B2C : objet fixe, jamais la difficulté personnelle", () => {
    const prepared = prepareDiagnostic("b2c", B2C_ANSWERS);
    const email = renderDiagnosticEmail({
      kind: "b2c",
      texts: B2C_TEXTS,
      answers: prepared.answers,
      result: prepared.result,
      reportUrl: "https://encrehumaine.fr/diagnostic/rapport/xyz",
      bookingUrl: "",
      email: "p@exemple.fr",
    });
    expect(email.subject).toBe("Votre point sur votre projet professionnel");
    expect(email.html).not.toContain("période très difficile");
    expect(email.html).toContain("/contact?pour=particulier");
  });
});
