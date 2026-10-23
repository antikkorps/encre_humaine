import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garde-fou : les droits de Directus sur le schéma `app` restent ÉTROITS.
 * Éléonore consulte les demandes de contact dans l'admin, peut changer leur
 * statut (ranger) et les supprimer (spam, demande d'effacement) — rien d'autre :
 * le contenu d'une demande ne se modifie pas, et aucune autre table applicative
 * (commandes, abonnés) n'est visible. Toute nouvelle permission doit passer ici.
 */
const MIGRATIONS = join(import.meta.dirname, "../../migrations");

function directusGrants(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .flatMap((f) => readFileSync(join(MIGRATIONS, f), "utf8").split("\n"))
    .filter((line) => /^\s*GRANT\b/i.test(line) && /\bdirectus_user\b/.test(line))
    .map((line) => line.trim().replace(/\s+/g, " ").replace(/;$/, ""));
}

describe("droits de directus_user sur le schéma app", () => {
  it("se limitent à lire, ranger (statut) et supprimer les demandes de contact", () => {
    expect(directusGrants().sort()).toEqual(
      [
        "GRANT USAGE ON SCHEMA app TO directus_user",
        "GRANT SELECT ON app.contact_leads TO directus_user",
        "GRANT UPDATE (status) ON app.contact_leads TO directus_user",
        "GRANT DELETE ON app.contact_leads TO directus_user",
      ].sort(),
    );
  });
});
