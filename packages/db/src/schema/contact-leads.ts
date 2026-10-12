import { boolean, index, text } from "drizzle-orm/pg-core";
import { createdAt, primaryId, updatedAt } from "./_helpers.ts";
import { app } from "./_schema.ts";
import { audienceEnum, leadStatusEnum } from "./enums.ts";

/**
 * Table `contact_leads` — soumissions du formulaire de contact.
 * docs/01-data-model.md §6. RGPD : aucune IP persistée (Turnstile +
 * rate-limit en mémoire seulement). Minimisation des données.
 *
 * Depuis le formulaire « Être rappelé·e » (2026-10), une demande porte un
 * téléphone et un créneau ; le message devient facultatif. Les anciennes
 * lignes (formulaire « message ») gardent ces colonnes à NULL.
 */
export const contactLeads = app.table(
  "contact_leads",
  {
    id: primaryId(),
    firstName: text("first_name").notNull(),
    email: text("email").notNull(),
    audience: audienceEnum("audience").notNull(), // organisation | particulier
    message: text("message"), // facultatif depuis le formulaire de rappel
    phone: text("phone"),
    callbackDays: text("callback_days"), // ex. « mardi, jeudi » ou « peu importe »
    callbackSlot: text("callback_slot"), // matin | midi | après-midi | fin de journée
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
