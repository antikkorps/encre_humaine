import { index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, primaryId, updatedAt } from "./_helpers.ts";
import { app } from "./_schema.ts";
import { subscriberStatusEnum } from "./enums.ts";

/**
 * Table `newsletter_subscribers` — registre de consentement (double opt-in).
 * docs/01-data-model.md §7. Resend héberge la liste de diffusion ; cette
 * table est la preuve RGPD + le pilotage du flow + la purge des non-confirmés.
 * Seul le HASH du token est stocké (jamais le token en clair).
 */
export const newsletterSubscribers = app.table(
  "newsletter_subscribers",
  {
    id: primaryId(),
    email: text("email").notNull(),
    firstName: text("first_name"),

    status: subscriberStatusEnum("status").notNull().default("pending"),

    // Double opt-in : hash du token de confirmation
    tokenHash: text("token_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }), // requestedAt + 30j → purge

    // Preuve de consentement (RGPD)
    consentIp: text("consent_ip"), // justifié : preuve de consentement
    consentUserAgent: text("consent_user_agent"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

    // Synchro Resend
    resendContactId: text("resend_contact_id"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("subscribers_email_ux").on(t.email),
    index("subscribers_status_ix").on(t.status),
    index("subscribers_expires_ix").on(t.expiresAt),
  ],
);
