// @vitest-environment node
//
// Logique de parcours des diagnostics (docs/11-diagnostics.md) : écrans, textes
// à trous, lien Cal.com pré-rempli pour préparer le rendez-vous.
import { B2B_TEXTS, B2C_TEXTS, computeB2b, computeB2c } from "@encre/shared/diagnostics";
import { describe, expect, it } from "vitest";
import {
  bookingHref,
  bookingNote,
  contactFallbackPath,
  diagnosticQuestions,
  fillTemplate,
  themeScores,
} from "~/utils/diagnostic-flow";

const screens = (kind: "b2b" | "b2c", answers: Record<string, number | string>) =>
  diagnosticQuestions(kind, answers).map((q) => q.id);

const B2B_ANSWERS = {
  profile: "leader",
  size: "50-149",
  priority: "tensions",
  a_practices: 1,
  a_onboarding: 2,
  a_indicators: 1,
  b_key_person: 1,
  b_reviews: 0,
  b_training_plan: 1,
  c_support: 0,
  c_tension: 0,
  c_consistency: 1,
};

describe("diagnosticScreens", () => {
  it("B2B : les 12 questions dans l'ordre", () => {
    const ids = screens("b2b", {});
    expect(ids).toHaveLength(12);
    expect(ids[0]).toBe("profile");
    expect(ids[11]).toBe("priority");
  });

  it("B2C : le parcours suit l'orientation, Direction tant qu'elle n'est pas choisie", () => {
    expect(screens("b2c", {})[3]).toBe("d_one_sentence");
    expect(screens("b2c", { orientation: "position" })[3]).toBe("p_target");
  });
});

describe("fillTemplate", () => {
  it("remplace les repères connus et laisse le reste intact", () => {
    expect(fillTemplate("Priorité : {priorite}. {autre}", { priorite: "le recrutement" })).toBe(
      "Priorité : le recrutement. {autre}",
    );
  });
});

describe("bookingHref", () => {
  it("pré-remplit email et note sans perdre les paramètres existants", () => {
    const href = bookingHref("https://cal.com/e/rdv-30?duration=30", {
      email: "a@b.fr",
      notes: "Score 55",
    });
    const url = new URL(href);
    expect(url.searchParams.get("duration")).toBe("30");
    expect(url.searchParams.get("email")).toBe("a@b.fr");
    expect(url.searchParams.get("notes")).toBe("Score 55");
  });

  it("sans agenda configuré, aucun lien", () => {
    expect(bookingHref("", { notes: "x" })).toBe("");
  });

  it("un agenda relatif (erreur de saisie) ne casse rien : aucun lien", () => {
    expect(bookingHref("/cal", { notes: "x" })).toBe("");
  });
});

describe("bookingNote", () => {
  it("B2B : profil, taille, scores, offres et priorité, en clair", () => {
    const note = bookingNote("b2b", B2B_ANSWERS, computeB2b(B2B_ANSWERS), B2B_TEXTS);
    expect(note).toContain("Dirigeant·e");
    expect(note).toContain("50 à 149");
    expect(note).toMatch(/Score global \d+\/100/);
    expect(note).toContain("Tensions ou difficultés managériales");
    expect(note).toContain("Audit RH");
  });

  it("B2C : situation, scores et offre ; jamais la difficulté personnelle", () => {
    const answers = {
      situation: "after_break",
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
    const note = bookingNote("b2c", answers, computeB2c(answers), B2C_TEXTS);
    expect(note).toContain("Après un licenciement ou une rupture");
    expect(note).toContain("Clarté du projet");
    expect(note).toContain("Clarifier son projet");
    expect(note).not.toContain("période très difficile");
  });
});

describe("themeScores / contactFallbackPath", () => {
  it("B2B : trois thèmes nommés, avec score et niveau", () => {
    const rows = themeScores("b2b", B2B_TEXTS, computeB2b(B2B_ANSWERS));
    expect(rows.map((r) => r.label)).toEqual([
      "Structuration RH",
      "Compétences et GEPP",
      "Management",
    ]);
    expect(rows[0]).toMatchObject({ score: expect.any(Number), level: expect.any(String) });
  });

  it("repli vers la page Contact du bon public", () => {
    expect(contactFallbackPath("b2b")).toBe("/contact?pour=organisation");
    expect(contactFallbackPath("b2c")).toBe("/contact?pour=particulier");
  });
});
