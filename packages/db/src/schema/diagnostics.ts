import { boolean, index, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, primaryId, updatedAt } from "./_helpers.ts";
import { app } from "./_schema.ts";
import { diagnosticKindEnum, leadStatusEnum } from "./enums.ts";

/**
 * Table `diagnostics` — rapports débloqués des diagnostics B2B/B2C
 * (docs/11-diagnostics.md). Une ligne n'existe qu'après consentement explicite.
 *
 * RGPD : aucune IP ; la réponse B2C « période très difficile » n'est JAMAIS
 * stockée (retirée des réponses avant insertion) ; conservation 3 ans. Le lien
 * du rapport porte un jeton dont seule l'empreinte est gardée ici.
 */
export const diagnostics = app.table(
  "diagnostics",
  {
    id: primaryId(),
    kind: diagnosticKindEnum("kind").notNull(),
    email: text("email").notNull(),
    consentReport: boolean("consent_report").notNull(),
    consentNewsletter: boolean("consent_newsletter").notNull().default(false),
    consentTextVersion: text("consent_text_version").notNull(),
    // { [questionId]: index de réponse ou clé de menu }, sans la réponse sensible.
    answers: jsonb("answers").$type<Record<string, number | string>>().notNull(),
    // Questions et réponses en toutes lettres pour l'admin (diagnosticSummary) ;
    // NULL pour les diagnostics reçus avant son ajout.
    summary: text("summary"),
    // Résultat recalculé serveur (scores, niveaux, offres, conseils).
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    source: text("source"), // paramètre d'URL `?source=`, borné
    device: text("device"), // mobile | desktop (dérivé, jamais l'UA brut)
    reportTokenHash: text("report_token_hash").notNull(),
    bookingClickedAt: timestamp("booking_clicked_at", { withTimezone: true }),
    status: leadStatusEnum("status").notNull().default("new"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("diagnostics_report_token_ux").on(t.reportTokenHash),
    index("diagnostics_kind_ix").on(t.kind),
    index("diagnostics_status_ix").on(t.status),
    index("diagnostics_created_ix").on(t.createdAt),
  ],
);
