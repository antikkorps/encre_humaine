import type { ContactLead, Order } from "@encre/db";
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

/** Charge utile d'un envoi (inférée du SDK → pas de type à maintenir à la main). */
type EmailPayload = Parameters<ReturnType<typeof resend>["emails"]["send"]>[0];

/**
 * Envoie un email via Resend en FAISANT REMONTER les erreurs. Indispensable :
 * le SDK ne lève PAS — `emails.send` renvoie `{ data, error }`. Sans ce contrôle,
 * un refus (domaine non vérifié, quota, adresse invalide…) passerait pour un
 * succès silencieux. On lève → l'appelant peut retenter / l'API répond en erreur
 * au lieu d'un faux « envoyé » (docs/03 §3.1).
 */
async function sendEmail(payload: EmailPayload): Promise<void> {
  const { error } = await resend().emails.send(payload);
  if (error) {
    throw createError({
      statusCode: 502,
      statusMessage: `Envoi email Resend échoué : ${error.message ?? error.name}`,
    });
  }
}

/**
 * Crée ou met à jour le contact Resend de l'audience (docs/03 §3.1-3.2).
 * `unsubscribed` pilote l'état de diffusion : `true` tant que le double opt-in
 * n'est pas confirmé (un `pending` ne reçoit AUCUN broadcast), `false` une fois
 * confirmé. Renvoie l'id du contact (à stocker) ou `null`.
 */
export async function upsertNewsletterContact(opts: {
  email: string;
  firstName?: string;
  unsubscribed: boolean;
}): Promise<string | null> {
  const { resendAudienceId } = useRuntimeConfig();
  const r = resend();

  const created = await r.contacts.create({
    audienceId: resendAudienceId,
    email: opts.email,
    firstName: opts.firstName,
    unsubscribed: opts.unsubscribed,
  });
  if (created.data?.id) return created.data.id;

  // Contact déjà présent → mise à jour de l'état d'abonnement (par email).
  const updated = await r.contacts.update({
    audienceId: resendAudienceId,
    email: opts.email,
    firstName: opts.firstName,
    unsubscribed: opts.unsubscribed,
  });
  return updated.data?.id ?? null;
}

/** Supprime le contact Resend de l'audience (purge RGPD, docs/03 §3.4). */
export async function removeNewsletterContact(email: string): Promise<void> {
  const { resendAudienceId } = useRuntimeConfig();
  await resend().contacts.remove({ audienceId: resendAudienceId, email });
}

/** Envoie l'email de confirmation double opt-in avec lien tokenisé (docs/03 §3.1). */
export async function sendNewsletterConfirmation(opts: {
  email: string;
  firstName?: string | null;
  token: string;
}): Promise<void> {
  const config = useRuntimeConfig();
  // Lien vers la PAGE de confirmation (GET inerte) : elle affiche un bouton qui
  // POST l'action réelle. Un GET ne confirme jamais → scanners/prefetch d'emails
  // ne peuvent pas auto-confirmer (audit sécu #3, double opt-in préservé).
  const link = new URL("/newsletter/confirmation", config.public.baseUrl);
  link.searchParams.set("token", opts.token);
  link.searchParams.set("email", opts.email);

  await sendEmail({
    from: config.newsletterFrom,
    to: opts.email,
    subject: "Confirmez votre inscription — L'Encre Humaine",
    text: [
      opts.firstName ? `Bonjour ${opts.firstName},` : "Bonjour,",
      "",
      "Merci de votre intérêt pour la newsletter de L'Encre Humaine.",
      "Pour finaliser votre inscription, confirmez votre adresse :",
      "",
      link.toString(),
      "",
      "Ce lien expire dans 30 jours. Si vous n'êtes pas à l'origine de cette",
      "demande, ignorez simplement ce message.",
      "",
      "L'Encre Humaine",
    ].join("\n"),
  });
}

/**
 * Notifie Eléonore d'un nouveau lead de contact (docs/03 §2).
 * `reply_to` = email du visiteur → réponse directe. Best-effort côté appelant.
 */
export async function sendContactNotification(lead: ContactLead): Promise<void> {
  const config = useRuntimeConfig();
  await sendEmail({
    from: config.newsletterFrom,
    to: config.contactNotifyTo,
    replyTo: lead.email,
    subject: `Nouveau message ${lead.audience} — ${lead.firstName}`,
    text: [
      `De : ${lead.firstName} <${lead.email}>`,
      `Audience : ${lead.audience}`,
      lead.sourcePage ? `Page : ${lead.sourcePage}` : "",
      "",
      lead.message,
    ]
      .filter(Boolean)
      .join("\n"),
  });
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
      await sendEmail({
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
      await sendEmail({
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
