import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { contactLeads } from "./contact-leads.ts";
import { newsletterSubscribers } from "./newsletter-subscribers.ts";
import { orders } from "./orders.ts";

/**
 * Tests de structure (offline). L'idempotence réelle du webhook
 * (double INSERT ON CONFLICT → 1 ligne) sera testée avec PGlite au moment
 * de l'endpoint webhook — docs/03 §5.1 / BACKLOG Phase 1.
 */
describe("schéma app", () => {
  it("orders est dans le schéma app", () => {
    expect(getTableConfig(orders).schema).toBe("app");
  });

  it("orders porte un index unique sur stripe_session_id (idempotence)", () => {
    const { indexes } = getTableConfig(orders);
    const unique = indexes.find((i) => i.config.name === "orders_stripe_session_ux");
    expect(unique?.config.unique).toBe(true);
    expect(unique?.config.columns.map((c) => (c as { name: string }).name)).toContain(
      "stripe_session_id",
    );
  });

  it("contact_leads ne contient AUCUNE colonne IP (RGPD, docs/01 §6)", () => {
    const cols = getTableConfig(contactLeads).columns.map((c) => c.name);
    expect(cols).not.toContain("ip");
    expect(cols).not.toContain("consent_ip");
  });

  it("newsletter_subscribers a un index unique sur email", () => {
    const { indexes } = getTableConfig(newsletterSubscribers);
    const unique = indexes.find((i) => i.config.name === "subscribers_email_ux");
    expect(unique?.config.unique).toBe(true);
  });

  it("montants en entiers (centimes), pas de float monétaire", () => {
    const cols = getTableConfig(orders).columns;
    for (const name of ["amount_total", "amount_shipping", "amount_vat"]) {
      const col = cols.find((c) => c.name === name);
      expect(col?.columnType).toBe("PgInteger");
    }
  });
});
