import type { Order } from "@encre/db";
import { Resend } from "resend";
import type { OrderEmailer } from "./orders";

/**
 * Client Resend côté serveur — docs/03-api-contracts.md §1-3.
 * Mémoïsé. Clé API et adresses depuis le runtimeConfig (jamais côté client).
 */
let client: Resend | null = null;

export function resend(): Resend {
  if (client) return client;
  const { resendApiKey } = useRuntimeConfig();
  if (!resendApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Resend non configuré (RESEND_API_KEY).",
    });
  }
  client = new Resend(resendApiKey);
  return client;
}

/** Formate un montant en centimes vers une chaîne lisible (ex. 2900 → 29,00 €). */
function formatAmount(cents: number, currency: string): string {
  const value = (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  return `${value} ${currency.toUpperCase() === "EUR" ? "€" : currency.toUpperCase()}`;
}

/** Récapitulatif texte des lignes d'une commande. */
function orderLines(order: Order): string {
  return order.items
    .map((it) => `- ${it.quantity} × ${it.name} (${formatAmount(it.unitAmount, it.currency)})`)
    .join("\n");
}

/**
 * Émetteur d'emails de commande branché sur Resend (docs/03 §1).
 * Contenu transactionnel sobre ; la mise en forme riche viendra avec les
 * templates Phase 2. Les envois sont best-effort (gérés par `recordCheckoutSession`).
 */
export function resendOrderEmailer(): OrderEmailer {
  const config = useRuntimeConfig();
  const from = config.newsletterFrom;
  const owner = config.contactNotifyTo;

  return {
    async sendCustomerConfirmation(order: Order) {
      await resend().emails.send({
        from,
        to: order.email,
        subject: "Votre commande — L'Encre Humaine",
        text: [
          order.name ? `Bonjour ${order.name},` : "Bonjour,",
          "",
          "Merci pour votre commande. Voici le récapitulatif :",
          "",
          orderLines(order),
          "",
          `Total : ${formatAmount(order.amountTotal, order.currency)}`,
          order.amountShipping
            ? `dont livraison : ${formatAmount(order.amountShipping, order.currency)}`
            : "",
          "",
          "TVA non applicable, art. 293 B du CGI.",
          "",
          "Nous revenons vers vous pour l'expédition.",
          "L'Encre Humaine",
        ]
          .filter((l) => l !== null)
          .join("\n"),
      });
    },

    async sendOwnerNotification(order: Order) {
      await resend().emails.send({
        from,
        to: owner,
        subject: `Nouvelle commande — ${formatAmount(order.amountTotal, order.currency)}`,
        text: [
          `Commande ${order.id}`,
          `Client : ${order.name ?? "—"} <${order.email}>`,
          "",
          orderLines(order),
          "",
          `Total : ${formatAmount(order.amountTotal, order.currency)}`,
          order.shipping
            ? `Livraison : ${[order.shipping.line1, order.shipping.postalCode, order.shipping.city, order.shipping.country].filter(Boolean).join(", ")}`
            : "Pas d'adresse de livraison.",
        ].join("\n"),
      });
    },
  };
}
