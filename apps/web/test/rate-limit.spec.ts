// @vitest-environment node
//
// Rate-limiting fenêtre glissante — docs/06-security.md §2.
// Horloge injectée (pas d'attente réelle) : on vérifie le seuil, le blocage,
// puis la libération une fois la fenêtre écoulée.
import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  rateLimitSize,
  resetRateLimits,
  sweepRateLimits,
} from "../server/utils/rate-limit";

const OPTS = { limit: 5, windowMs: 60_000 };

describe("consumeRateLimit (fenêtre glissante)", () => {
  beforeEach(() => resetRateLimits());

  it("autorise jusqu'à la limite puis bloque", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(consumeRateLimit("contact:1.2.3.4", OPTS, now).allowed).toBe(true);
    }
    const blocked = consumeRateLimit("contact:1.2.3.4", OPTS, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("isole les clés (IP différentes)", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) consumeRateLimit("contact:1.1.1.1", OPTS, now);
    expect(consumeRateLimit("contact:2.2.2.2", OPTS, now).allowed).toBe(true);
  });

  it("libère après la fenêtre glissante", () => {
    const start = 1_000_000;
    for (let i = 0; i < 5; i++) consumeRateLimit("contact:9.9.9.9", OPTS, start);
    expect(consumeRateLimit("contact:9.9.9.9", OPTS, start).allowed).toBe(false);
    // 1 ms après la sortie de fenêtre du premier hit → de nouveau autorisé.
    expect(consumeRateLimit("contact:9.9.9.9", OPTS, start + 60_001).allowed).toBe(true);
  });
});

describe("sweepRateLimits (purge mémoire)", () => {
  beforeEach(() => resetRateLimits());

  it("supprime les clés périmées et garde les actives", () => {
    const start = 1_000_000;
    consumeRateLimit("contact:1.1.1.1", OPTS, start); // périmera
    consumeRateLimit("contact:2.2.2.2", OPTS, start + 9 * 60_000); // encore récente
    expect(rateLimitSize()).toBe(2);

    // Balayage à 10 min + 1 ms après le 1er hit : 1.1.1.1 dépasse la marge (10 min),
    // 2.2.2.2 (hit à +9 min) reste dans la marge → conservée.
    sweepRateLimits(start + 10 * 60_000 + 1);
    expect(rateLimitSize()).toBe(1);
  });

  it("ne purge jamais une clé dont la fenêtre est encore active", () => {
    const now = 1_000_000;
    consumeRateLimit("contact:3.3.3.3", OPTS, now);
    sweepRateLimits(now + 1_000); // bien avant la marge de 10 min
    expect(rateLimitSize()).toBe(1);
  });
});
