import { describe, expect, it } from "vitest";
import { computeB2b } from "./b2b.ts";
import { B2C_SEQUENCE_LENGTH, b2cSequence, computeB2c, setB2cAnswer } from "./b2c.ts";
import type { Answers } from "./types.ts";

/**
 * Moteur des diagnostics — docs/11-diagnostics.md. Les scénarios « recette »
 * reprennent le §13 du cahier des charges d'Éléonore (v1.0, 2026-10-22).
 * Codage des réponses : index 0/1/2 = Oui/En partie/Non ou 1re/2e/3e situation
 * (2/1/0 points) ; clés pour les menus.
 */

const B2B_SCORED = [
  "a_practices",
  "a_onboarding",
  "a_indicators",
  "b_key_person",
  "b_reviews",
  "b_training_plan",
  "c_support",
  "c_tension",
  "c_consistency",
] as const;

function b2b(choice: number, extra: Answers = {}, overrides: Answers = {}): Answers {
  const answers: Answers = { profile: "leader", size: "50-149", priority: "unknown", ...extra };
  for (const id of B2B_SCORED) answers[id] = choice;
  return { ...answers, ...overrides };
}

describe("B2B — recette", () => {
  it("tout au maximum : 100 partout, base solide, offre du besoin seule", () => {
    const r = computeB2b(b2b(0, { priority: "tensions" }));
    expect(r.scores).toEqual({ A: 100, B: 100, C: 100 });
    expect(r.global).toBe(100);
    expect(r.globalLevel).toBe("high");
    expect(r.solidBase).toBe(true);
    expect(r.cards).toEqual([{ offer: "managers", role: "need" }]);
  });

  it("tout au minimum : 0 partout, bases à poser, Audit RH en premier", () => {
    const r = computeB2b(b2b(2, { priority: "departures" }));
    expect(r.scores).toEqual({ A: 0, B: 0, C: 0 });
    expect(r.global).toBe(0);
    expect(r.globalLevel).toBe("low");
    expect(r.cards[0]).toEqual({ offer: "audit", role: "score" });
  });

  it("thème C le plus faible + priorité Tensions : une carte, même direction", () => {
    // A 100, B 83, C 17 → global 67 (< 70, sinon la règle « base solide » s'applique).
    const r = computeB2b(
      b2b(
        0,
        { priority: "tensions" },
        { b_reviews: 1, c_support: 2, c_tension: 2, c_consistency: 1 },
      ),
    );
    expect(r.cards).toEqual([{ offer: "managers", role: "score" }]);
    expect(r.sameDirection).toBe(true);
  });

  it("thème A le plus faible + priorité Tensions : Audit RH puis Expert au Manager", () => {
    const r = computeB2b(
      b2b(1, { priority: "tensions" }, { a_practices: 2, a_onboarding: 2, a_indicators: 2 }),
    );
    expect(r.cards).toEqual([
      { offer: "audit", role: "score" },
      { offer: "managers", role: "need" },
    ]);
    expect(r.sameDirection).toBe(false);
  });

  it("priorité « Je ne sais pas encore » : une seule carte, celle du score", () => {
    const r = computeB2b(b2b(1, {}, { b_key_person: 2 }));
    expect(r.cards).toEqual([{ offer: "talents", role: "score" }]);
  });

  it.each([
    ["lt10", "small"],
    ["10-19", "small"],
    ["20-49", null],
    ["150-300", null],
    ["gt300", "large"],
  ])("taille %s → mention %s", (size, note) => {
    expect(computeB2b(b2b(1, { size })).sizeNote).toBe(note);
  });
});

describe("B2B — règles de détail", () => {
  it("niveaux : < 40 bas, 40 à 69 intermédiaire, 70 et plus haut", () => {
    // A = 2/6 → 33 ; B = 3/6 → 50 ; C = 5/6 → 83.
    const r = computeB2b(
      b2b(
        0,
        {},
        {
          a_practices: 1,
          a_onboarding: 1,
          a_indicators: 2,
          b_key_person: 1,
          b_reviews: 1,
          b_training_plan: 1,
          c_consistency: 1,
        },
      ),
    );
    expect(r.scores).toEqual({ A: 33, B: 50, C: 83 });
    expect(r.levels).toEqual({ A: "low", B: "mid", C: "high" });
    expect(r.global).toBe(55);
  });

  it("trois thèmes sous 40 : l'offre du score est l'Audit RH, même si un autre est plus bas", () => {
    // A = 33, B = 0, C = 33 → B est le plus faible, mais tout est sous 40.
    const r = computeB2b(b2b(2, { priority: "unknown" }, { a_practices: 0, c_support: 0 }));
    expect(r.cards).toEqual([{ offer: "audit", role: "score" }]);
  });

  it("égalité : le thème de la priorité l'emporte s'il est ex æquo, sinon l'ordre A, B, C", () => {
    const tie = b2b(1, {}, { b_key_person: 2, c_tension: 2 }); // B = C = 33, A = 50
    expect(computeB2b({ ...tie, priority: "tensions" }).cards[0]?.offer).toBe("managers");
    expect(computeB2b({ ...tie, priority: "growth" }).cards[0]?.offer).toBe("talents");
  });

  it("score global ≥ 70 sans priorité : base solide, carte du score", () => {
    const r = computeB2b(b2b(0, {}, { c_consistency: 1 }));
    expect(r.solidBase).toBe(true);
    expect(r.cards).toEqual([{ offer: "managers", role: "score" }]);
  });

  it("conseils : 3 au plus, thème le plus faible d'abord puis réponse la plus faible", () => {
    const r = computeB2b(
      b2b(
        0,
        {},
        { a_practices: 1, b_key_person: 2, b_reviews: 1, b_training_plan: 2, c_support: 1 },
      ),
    );
    // B = 1/6 (17) le plus faible : ses 2 réponses à 0 d'abord, puis sa réponse à 1.
    expect(r.tips).toEqual(["b_key_person", "b_training_plan", "b_reviews"]);
  });

  it("refuse un questionnaire incomplet", () => {
    const { c_tension: _, ...incomplete } = b2b(0);
    expect(() => computeB2b(incomplete)).toThrow(/c_tension/);
  });
});

function direction(choice: number, overrides: Answers = {}): Answers {
  const answers: Answers = { situation: "employed", orientation: "direction", difficulty: "pro" };
  for (const id of b2cSequence("direction").slice(3)) answers[id] = choice;
  return { ...answers, ...overrides };
}

function position(choice: number, overrides: Answers = {}): Answers {
  const answers: Answers = { situation: "job_seeking", orientation: "position", difficulty: "pro" };
  for (const id of b2cSequence("position").slice(3)) answers[id] = choice;
  return { ...answers, ...overrides };
}

describe("B2C — recette", () => {
  it("Direction, clarté du projet à 50 : Clarifier son projet", () => {
    // 6/12 : trois « Oui », trois « Non » sur les questions de clarté.
    const r = computeB2c(direction(0, { d_drivers: 2, d_skills: 2, d_values: 2 }));
    expect(r.scores.A).toBe(50);
    expect(r.offer).toBe("clarify");
    expect(r.message).toBe("need_direction");
  });

  it("Direction, clarté du projet à 83 : Se (re)positionner, direction qui se dessine", () => {
    const r = computeB2c(direction(0, { d_drivers: 1, d_values: 1 }));
    expect(r.scores.A).toBe(83);
    expect(r.offer).toBe("reposition");
    expect(r.message).toBe("direction_emerging");
  });

  it("Poste, question clé « Non » et lisibilité à 100 : Clarifier son projet", () => {
    const r = computeB2c(position(0, { p_target: 2 }));
    expect(r.scores.B).toBe(100);
    expect(r.offer).toBe("clarify");
    expect(r.message).toBe("need_direction");
  });

  it("Poste, question clé « Oui » et lisibilité à 33 : Se (re)positionner, cap posé", () => {
    const r = computeB2c(
      position(1, { p_target: 0, p_cv: 2, p_pitch: 2, p_linkedin: 1, p_targeting: 1 }),
    );
    expect(r.scores.B).toBe(33);
    expect(r.offer).toBe("reposition");
    expect(r.message).toBe("course_set");
  });

  it("Poste, lisibilité 70 et plus : bien avancé·e", () => {
    expect(computeB2c(position(0)).message).toBe("well_advanced");
  });

  it("après une rupture : la mention dédiée s'ajoute", () => {
    expect(computeB2c(direction(1, { situation: "after_break" })).ruptureNote).toBe(true);
    expect(computeB2c(direction(1)).ruptureNote).toBe(false);
  });
});

describe("B2C — parcours", () => {
  it("12 écrans par parcours, questions communes en tête", () => {
    for (const path of ["direction", "position"] as const) {
      const seq = b2cSequence(path);
      expect(seq).toHaveLength(B2C_SEQUENCE_LENGTH);
      expect(seq.slice(0, 3)).toEqual(["situation", "orientation", "difficulty"]);
    }
  });

  it("changer de parcours efface les réponses du parcours abandonné", () => {
    const answers = setB2cAnswer(direction(0), "orientation", "position");
    expect(Object.keys(answers).some((k) => k.startsWith("d_"))).toBe(false);
    expect(answers.situation).toBe("employed");
  });

  it("répondre à nouveau la même orientation garde les réponses", () => {
    const answers = setB2cAnswer(direction(0), "orientation", "direction");
    expect(answers.d_values).toBe(0);
  });

  it("la difficulté personnelle n'entre ni dans les scores ni dans le résultat", () => {
    const r = computeB2c(direction(0, { difficulty: "hard" }));
    expect(JSON.stringify(r)).not.toContain("hard");
  });
});

describe("réponses sensibles", () => {
  it("la difficulté personnelle (Q3 B2C) est désignée comme sensible", async () => {
    const { SENSITIVE_ANSWERS } = await import("./b2c.ts");
    expect(SENSITIVE_ANSWERS).toContain("difficulty");
  });
});

describe("réponse sensible absente", () => {
  it("le résultat se calcule sans elle : elle ne quitte jamais le navigateur", () => {
    const { difficulty: _, ...withoutSensitive } = direction(0);
    expect(() => computeB2c(withoutSensitive)).not.toThrow();
  });
});
