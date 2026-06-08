import { boolean, index, text } from "drizzle-orm/pg-core";
import { createdAt, primaryId, updatedAt } from "./_helpers.ts";
import { app } from "./_schema.ts";
import { audienceEnum, leadStatusEnum } from "./enums.ts";

/**
 * Table `contact_leads` — soumissions du formulaire de contact.
 * docs/01-data-model.md §6. RGPD : aucune IP persistée (Turnstile +
 * rate-limit en mémoire seulement). Minimisation des données.
 */
export const contactLeads = app.table(
  "contact_leads",
  {
    id: primaryId(),
    firstName: text("first_name").notNull(),
    email: text("email").notNull(),
    audience: audienceEnum("audience").notNull(), // organisation | particulier
    message: text("message").notNull(),
    sourcePage: text("source_page"), // d'où vient la soumission
    status: leadStatusEnum("status").notNull().default("new"),
    notificationSent: boolean("notification_sent").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("leads_email_ix").on(t.email),
    index("leads_status_ix").on(t.status),
    index("leads_created_ix").on(t.createdAt),
  ],
);
