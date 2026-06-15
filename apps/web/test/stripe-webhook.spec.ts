// @vitest-environment node
//
// Idempotence du webhook Stripe — docs/03-api-contracts.md §5.1 (invariant projet).
// Prouve que deux `checkout.session.completed` identiques (rejeu Stripe) ne créent
// QU'UNE commande et n'envoient QU'UN jeu d'emails. Tourne contre un Postgres réel
// embarqué (PGlite) pour valider le vrai `ON CONFLICT DO NOTHING` — pas un mock.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { type Database, orders } from "@encre/db";
import { drizzle } from "drizzle-orm/pglite";
import type Stripe from "stripe";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type OrderEmailer, recordCheckoutSession } from "../server/utils/orders";

const MIGRATION = fileURLToPath(
  new URL("../../../packages/db/migrations/0000_messy_yellowjacket.sql", import.meta.url),
);

let pg: PGlite;
let db: Database;

beforeAll(async () => {
  pg = new PGlite();
  // `--> statement-breakpoint` commence par `--` → ligne de commentaire SQL :
  // le fichier entier est exécutable tel quel par PGlite.
  await pg.exec(readFileSync(MIGRATION, "utf8"));
  db = drizzle(pg) as unknown as Database;
});

beforeEach(async () => {
  await pg.exec('TRUNCATE TABLE "app"."orders";');
});

/** Compteur d'envois pour vérifier « 1 commande → 1 jeu d'emails ». */
function countingEmailer() {
  const sent = { customer: 0, owner: 0 };
  const emailer: OrderEmailer = {
    async sendCustomerConfirmation() {
      sent.customer++;
    },
    async sendOwnerNotification() {
      sent.owner++;
    },
  };
  return { emailer, sent };
}

/** Session Checkout payée minimale, suffisante pour `sessionToOrder`. */
function paidSession(id = "cs_test_idem"): Stripe.Checkout.Session {
  return {
    id,
    payment_status: "paid",
    payment_intent: "pi_test_1",
    customer: "cus_test_1",
    customer_email: "client@example.com",
    customer_details: { email: "client@example.com", name: "Camille Client" },
    currency: "eur",
    amount_total: 3193,
    total_details: { amount_shipping: 293 },
    collected_information: {
      shipping_details: {
        name: "Camille Client",
        address: { line1: "1 rue de la Paix", postal_code: "75002", city: "Paris", country: "FR" },
      },
    },
    line_items: {
      data: [
        {
          description: "Serious game — Cohésion",
          quantity: 1,
          price: { unit_amount: 2900, currency: "eur", product: "prod_test_1" },
        },
      ],
    },
  } as unknown as Stripe.Checkout.Session;
}

describe("webhook Stripe — idempotence (docs/03 §5.1)", () => {
  it("deux fois le même checkout.session.completed → 1 commande, 1 jeu d'emails", async () => {
    const session = paidSession();
    const { emailer, sent } = countingEmailer();

    const first = await recordCheckoutSession(db, session, emailer);
    const second = await recordCheckoutSession(db, session, emailer);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false); // rejeu : aucune insertion

    const rows = await db.select().from(orders);
    expect(rows).toHaveLength(1);
    expect(sent).toEqual({ customer: 1, owner: 1 });
  });

  it("mappe correctement la session vers la commande (snapshot)", async () => {
    const { emailer } = countingEmailer();
    await recordCheckoutSession(db, paidSession("cs_test_map"), emailer);

    const [row] = await db.select().from(orders);
    if (!row) throw new Error("commande non insérée");
    expect(row.email).toBe("client@example.com");
    expect(row.amountTotal).toBe(3193);
    expect(row.amountShipping).toBe(293);
    expect(row.vatApplied).toBe(false);
    expect(row.items).toEqual([
      {
        stripeProductId: "prod_test_1",
        name: "Serious game — Cohésion",
        quantity: 1,
        unitAmount: 2900,
        currency: "eur",
      },
    ]);
  });

  it("un échec d'envoi d'email ne fait pas échouer la persistance (best-effort)", async () => {
    const failing: OrderEmailer = {
      async sendCustomerConfirmation() {
        throw new Error("Resend indisponible");
      },
      async sendOwnerNotification() {},
    };

    const res = await recordCheckoutSession(db, paidSession("cs_test_email_fail"), failing);
    expect(res.created).toBe(true);
    expect(await db.select().from(orders)).toHaveLength(1);
  });
});
