// Textes des diagnostics au format des singletons Directus (`diagnostic_b2b`,
// `diagnostic_b2c`). La référence vit dans `@encre/shared/diagnostics` (cahier
// des charges) : ce module ne fait que la traduire en champs et répéteurs.
import { B2B_TEXTS, B2C_TEXTS, type DiagnosticTexts } from "@encre/shared/diagnostics";

const rows = <T>(record: Record<string, T>, map: (v: T) => Record<string, string>) =>
  Object.entries(record).map(([key, v]) => ({ key, ...map(v) }));

export function toDirectusTexts(t: DiagnosticTexts): Record<string, unknown> {
  return {
    title: t.title,
    intro: t.intro,
    cta_label: t.ctaLabel,
    level_low: t.levels.low,
    level_mid: t.levels.mid,
    level_high: t.levels.high,
    themes: rows(t.themes, (label) => ({ label })),
    questions: rows(t.questions, (q) => ({
      label: q.label,
      label_variant: q.variant ?? "",
      options: q.options.join("\n"),
      tip: q.tip ?? "",
    })),
    offers: rows(t.offers, (o) => ({ ...o })),
    messages: rows(t.messages, (text) => ({ text })),
    unlock_title: t.unlock.title,
    unlock_body: t.unlock.body,
    consent_label: t.unlock.consent,
    newsletter_label: t.unlock.newsletter,
    unlock_button: t.unlock.button,
    email_subject: t.emailSubject,
  };
}

export const DIAGNOSTIC_TEXTS = {
  diagnostic_b2b: toDirectusTexts(B2B_TEXTS),
  diagnostic_b2c: toDirectusTexts(B2C_TEXTS),
};
