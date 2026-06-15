// @vitest-environment node
//
// Double opt-in newsletter — docs/03-api-contracts.md §3, §5.6-5.7.
// Couvre les primitives crypto (token jamais stocké en clair, comparaison à
// temps constant, expiration) et la purge RGPD sous Postgres réel (PGlite).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, newsletterSubscribers } from "@encre/db";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  CONFIRMATION_TTL_MS,
  generateConfirmationToken,
  hashToken,
  purgeExpiredPending,
  tokenMatchesHash,
} from "../server/utils/newsletter";

describe("primitives double opt-in", () => {
  it("génère un token opaque dont seul le hash est destiné au stockage", () => {
    const { token, tokenHash } = generateConfirmationToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(tokenHash).toBe(hashToken(token));
    expect(tokenHash).not.toBe(token); // jamais le clair
  });

  it("valide le bon token et rejette un mauvais token (temps constant)", () => {
    const { token, tokenHash } = generateConfirmationToken();
    expect(tokenMatchesHash(token, tokenHash)).toBe(true);
    expect(tokenMatchesHash("mauvais-token", tokenHash)).toBe(false);
    expect(tokenMatchesHash(token, null)).toBe(false);
  });
});

const MIGRATION = fileURLToPath(
  new URL("../../../packages/db/migrations/0000_messy_yellowjacket.sql", import.meta.url),
);

describe("purge RGPD des pending expirés (docs/03 §3.4)", () => {
  let pg: PGlite;
  let db: Database;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(readFileSync(MIGRATION, "utf8"));
    db = drizzle(pg) as unknown as Database;
  });

  beforeEach(async () => {
    await pg.exec('TRUNCATE TABLE "app"."newsletter_subscribers";');
  });

  it("supprime les pending expirés (DB + Resend) et épargne le reste", async () => {
    const now = new Date("2026-06-15T00:00:00Z");
    const past = new Date(now.getTime() - 1000);
    const future = new Date(now.getTime() + CONFIRMATION_TTL_MS);

    await db.insert(newsletterSubscribers).values([
      // pending expiré avec contact Resend → purgé + suppression contact
      { email: "expire@x.fr", status: "pending", expiresAt: past, resendContactId: "ct_1" },
      // pending encore valide → conservé
      { email: "valide@x.fr", status: "pending", expiresAt: future },
      // confirmé → preuve de consentement conservée même sans expiration
      { email: "confirme@x.fr", status: "confirmed", expiresAt: null },
    ]);

    const removed: string[] = [];
    const purged = await purgeExpiredPending(
      db,
      async (email) => {
        removed.push(email);
      },
      now,
    );

    expect(purged).toBe(1);
    expect(removed).toEqual(["expire@x.fr"]); // contact Resend supprimé

    const remaining = (await db.select().from(newsletterSubscribers)).map((s) => s.email).sort();
    expect(remaining).toEqual(["confirme@x.fr", "valide@x.fr"]);
  });
});
