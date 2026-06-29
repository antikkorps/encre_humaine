// @vitest-environment node
//
// Purge RGPD des leads de contact — docs/01-data-model.md §8.
// Vérifie, sous Postgres réel (PGlite), que seuls les leads au-delà de la
// rétention sont supprimés et que les récents sont épargnés.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { contactLeads, type Database } from "@encre/db";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CONTACT_LEAD_RETENTION_MS, purgeOldContactLeads } from "../server/utils/contact";

const MIGRATION = fileURLToPath(
  new URL("../../../packages/db/migrations/0000_messy_yellowjacket.sql", import.meta.url),
);

describe("purge RGPD des leads de contact (docs/01 §8)", () => {
  let pg: PGlite;
  let db: Database;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(readFileSync(MIGRATION, "utf8"));
    db = drizzle(pg) as unknown as Database;
  });

  beforeEach(async () => {
    await pg.exec('TRUNCATE TABLE "app"."contact_leads";');
  });

  it("supprime les leads au-delà de 3 ans et épargne les récents", async () => {
    const now = new Date("2026-06-27T00:00:00Z");
    const old = new Date(now.getTime() - CONTACT_LEAD_RETENTION_MS - 1000); // > 3 ans
    const recent = new Date(now.getTime() - 1000); // hier

    await db.insert(contactLeads).values([
      {
        firstName: "Vieux",
        email: "vieux@x.fr",
        audience: "organisation",
        message: "ancien message à purger",
        createdAt: old,
      },
      {
        firstName: "Récent",
        email: "recent@x.fr",
        audience: "particulier",
        message: "message récent conservé",
        createdAt: recent,
      },
    ]);

    const purged = await purgeOldContactLeads(db, now);
    expect(purged).toBe(1);

    const remaining = (await db.select().from(contactLeads)).map((l) => l.email);
    expect(remaining).toEqual(["recent@x.fr"]);
  });
});
