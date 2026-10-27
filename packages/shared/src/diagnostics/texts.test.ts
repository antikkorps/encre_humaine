import { describe, expect, it } from "vitest";
import { B2B_QUESTIONS } from "./b2b.ts";
import { B2C_PATHS } from "./b2c.ts";
import { B2B_TEXTS, B2C_TEXTS, mergeTexts, questionLabel } from "./texts.ts";

/**
 * Textes des diagnostics : référence = cahier des charges ; Directus les
 * surcharge clé par clé. Une saisie incomplète ou cassée dans l'admin ne doit
 * jamais casser le questionnaire.
 */
describe("textes de référence", () => {
  it("couvrent chaque question du code, avec le bon nombre de réponses", () => {
    const all = [...B2B_QUESTIONS.map((q) => [q, B2B_TEXTS] as const)];
    for (const path of Object.values(B2C_PATHS))
      for (const q of path) all.push([q, B2C_TEXTS] as never);
    for (const [q, texts] of all) {
      const t = texts.questions[q.id];
      expect(t?.label, q.id).toBeTruthy();
      expect(t?.options.length, q.id).toBe(q.kind === "select" ? q.options.length : 3);
      if (q.kind !== "select") expect(t?.tip, q.id).toBeTruthy();
    }
  });
});

describe("mergeTexts", () => {
  it("prend le texte de l'admin quand il est rempli, la référence sinon", () => {
    const merged = mergeTexts(B2B_TEXTS, {
      title: "Vos RH, en vrai",
      intro: "  ",
      questions: [{ key: "a_practices", label: "Nouvelle question", tip: "" }],
      messages: [{ key: "same_direction", text: "Même cap." }],
    });
    expect(merged.title).toBe("Vos RH, en vrai");
    expect(merged.intro).toBe(B2B_TEXTS.intro);
    expect(merged.questions.a_practices?.label).toBe("Nouvelle question");
    expect(merged.questions.a_practices?.tip).toBe(B2B_TEXTS.questions.a_practices?.tip);
    expect(merged.messages.same_direction).toBe("Même cap.");
  });

  it("textes d'invitation au diagnostic (offres, hubs) : admin sinon référence", () => {
    const merged = mergeTexts(B2C_TEXTS, { promo_title: "Lequel choisir ?", promo_label: " " });
    expect(merged.promo.title).toBe("Lequel choisir ?");
    expect(merged.promo.label).toBe(B2C_TEXTS.promo.label);
    expect(merged.promo.hubLabel).toBe(B2C_TEXTS.promo.hubLabel);
    expect(B2B_TEXTS.promo.title).toBe("Pas sûr d’avoir besoin de ça ?");
  });

  it("ignore une liste de réponses au mauvais nombre de lignes", () => {
    const merged = mergeTexts(B2B_TEXTS, {
      questions: [
        { key: "a_onboarding", options: "Seulement deux\nlignes" },
        { key: "c_tension", options: "Un\nDeux\nTrois" },
      ],
    });
    expect(merged.questions.a_onboarding?.options).toEqual(
      B2B_TEXTS.questions.a_onboarding?.options,
    );
    expect(merged.questions.c_tension?.options).toEqual(["Un", "Deux", "Trois"]);
  });

  it("ignore les clés inconnues et les lignes sans clé", () => {
    const merged = mergeTexts(B2B_TEXTS, {
      questions: [{ key: "inconnue", label: "x" }, { label: "sans clé" }],
    });
    expect(merged.questions.inconnue).toBeUndefined();
  });

  it("garde les offres et leur lien d'origine si l'admin le casse", () => {
    const merged = mergeTexts(B2B_TEXTS, {
      offers: [{ key: "audit", name: "Audit", url: "javascript:alert(1)" }],
    });
    expect(merged.offers.audit?.name).toBe("Audit");
    expect(merged.offers.audit?.url).toBe(B2B_TEXTS.offers.audit?.url);
  });
});

describe("questionLabel", () => {
  it("applique la variante du profil, sinon la formulation de base", () => {
    expect(questionLabel(B2B_TEXTS, "a_indicators", "leader")).toBe(
      B2B_TEXTS.questions.a_indicators?.variant,
    );
    expect(questionLabel(B2B_TEXTS, "a_indicators", "hr")).toBe(
      B2B_TEXTS.questions.a_indicators?.label,
    );
    expect(questionLabel(B2B_TEXTS, "a_practices", "hr")).toBe(
      B2B_TEXTS.questions.a_practices?.variant,
    );
  });
});
