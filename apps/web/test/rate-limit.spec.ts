// @vitest-environment node
//
// Rate-limiting fenêtre glissante — docs/06-security.md §2.
// Horloge injectée (pas d'attente réelle) : on vérifie le seuil, le blocage,
// puis la libération une fois la fenêtre écoulée.
import { beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimits } from "../server/utils/rate-limit";

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
