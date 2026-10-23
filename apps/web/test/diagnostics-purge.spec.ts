// @vitest-environment node
//
// Purge RGPD des diagnostics (docs/11-diagnostics.md) : conservation 3 ans,
// vérifiée sous Postgres réel (PGlite) en rejouant les migrations de la table.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, diagnostics } from "@encre/db";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import {
  DIAGNOSTIC_RETENTION_MS,
  purgeOldDiagnostics,
  recentReportExists,
} from "../server/utils/diagnostics";

// 0000 crée le schéma `app` et l'enum `lead_status` ; 0004 la table. Les GRANT
// (0005) visent un rôle absent de PGlite et sont ignorés.
const MIGRATIONS = ["0000_messy_yellowjacket.sql", "0004_diagnostics.sql"].map((file) =>
  fileURLToPath(new URL(`../../../packages/db/migrations/${file}`, import.meta.url)),
);

describe("purge RGPD des diagnostics", () => {
  let db: Database;

  beforeAll(async () => {
    const pg = new PGlite();
    for (const migration of MIGRATIONS) await pg.exec(readFileSync(migration, "utf8"));
    db = drizzle(pg) as unknown as Database;
  });

  it("supprime au-delà de 3 ans et épargne les récents", async () => {
    const now = new Date("2026-10-23T00:00:00Z");
    const row = (createdAt: Date, hash: string) => ({
      kind: "b2b" as const,
      email: "d@exemple.fr",
      consentReport: true,
      consentTextVersion: "v1",
      answers: {},
      result: {},
      reportTokenHash: hash,
      createdAt,
    });
    await db
      .insert(diagnostics)
      .values([
        row(new Date(now.getTime() - DIAGNOSTIC_RETENTION_MS - 1000), "ancien"),
        row(new Date(now.getTime() - 1000), "recent"),
      ]);
    expect(await purgeOldDiagnostics(db, now)).toBe(1);
    const left = await db.select({ hash: diagnostics.reportTokenHash }).from(diagnostics);
    expect(left).toEqual([{ hash: "recent" }]);
  });
});

// Anti-abus (revue du 2026-10-23) : un même email ne reçoit pas plus d'un
// rapport du même diagnostic toutes les 10 minutes, quelle que soit l'IP.
describe("limite d'envoi par adresse", () => {
  it("bloque un 2e rapport récent pour la même adresse et le même diagnostic", async () => {
    const pg = new PGlite();
    for (const migration of MIGRATIONS) await pg.exec(readFileSync(migration, "utf8"));
    const db = drizzle(pg) as unknown as Database;
    const now = new Date("2026-10-23T12:00:00Z");
    await db.insert(diagnostics).values({
      kind: "b2b",
      email: "victime@exemple.fr",
      consentReport: true,
      consentTextVersion: "v1",
      answers: {},
      result: {},
      reportTokenHash: "h1",
      createdAt: new Date(now.getTime() - 60_000),
    });
    expect(await recentReportExists(db, "victime@exemple.fr", "b2b", now)).toBe(true);
    expect(await recentReportExists(db, "victime@exemple.fr", "b2c", now)).toBe(false);
    expect(
      await recentReportExists(
        db,
        "victime@exemple.fr",
        "b2b",
        new Date(now.getTime() + 11 * 60_000),
      ),
    ).toBe(false);
  });
});
