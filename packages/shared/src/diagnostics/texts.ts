import { B2B_VARIANTS as VARIANT_PROFILE } from "./b2b.ts";
import type { Level } from "./types.ts";

/**
 * Textes des diagnostics — docs/11-diagnostics.md. Référence : cahier des
 * charges (`texts-b2b.ts`, `texts-b2c.ts`), seule source à la fois du seed
 * Directus et du repli du site. Directus les surcharge CLÉ PAR CLÉ : une ligne
 * vidée, supprimée ou mal saisie dans l'admin retombe sur la référence au lieu
 * de casser le questionnaire.
 */
export interface QuestionTexts {
  label: string;
  /** Formulation adaptée au profil désigné par `B2B_VARIANTS`. */
  variant?: string;
  /** Une ligne par réponse, dans l'ordre fixe du barème. */
  options: string[];
  /** Conseil affiché quand la réponse vaut moins de 2 points. */
  tip?: string;
}

export interface OfferTexts {
  name: string;
  price: string;
  description: string;
  url: string;
}

export interface DiagnosticTexts {
  title: string;
  intro: string;
  ctaLabel: string;
  levels: Record<Level, string>;
  themes: Record<string, string>;
  questions: Record<string, QuestionTexts>;
  offers: Record<string, OfferTexts>;
  messages: Record<string, string>;
  unlock: { title: string; body: string; consent: string; newsletter: string; button: string };
  emailSubject: string;
  /** Invitations au diagnostic ailleurs sur le site (bas des offres, hubs). */
  promo: { title: string; body: string; label: string; hubLabel: string };
}

/**
 * Adresse de chaque diagnostic, sous le hub de son public (mail d'Éléonore du
 * 2026-10-26) : c'est le lien qu'elle diffuse, et tous les autres emplacements
 * du site y renvoient.
 */
export const DIAGNOSTIC_PATHS = {
  b2b: "/organisations/diagnostic",
  b2c: "/particuliers/diagnostic",
} as const;

/** Forme brute du singleton Directus (répéteurs JSON indexés par `key`). */
export type RawDiagnosticTexts = Partial<Record<string, unknown>>;

const text = (raw: unknown, fallback: string): string =>
  typeof raw === "string" && raw.trim() !== "" ? raw.trim() : fallback;

/** Lignes d'un répéteur Directus, indexées par leur `key` (lignes sans clé ignorées). */
function byKey(raw: unknown): Map<string, Record<string, unknown>> {
  const rows = Array.isArray(raw) ? raw : [];
  return new Map(
    rows
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
      .filter((r) => typeof r.key === "string" && r.key !== "")
      .map((r) => [r.key as string, r]),
  );
}

/** Lien d'offre : chemin du site ou https uniquement, sinon la référence. */
const safeUrl = (raw: unknown, fallback: string): string => {
  const url = text(raw, fallback);
  return /^(\/(?![/\\])|https:\/\/)/.test(url) ? url : fallback;
};

function mergeQuestion(base: QuestionTexts, row?: Record<string, unknown>): QuestionTexts {
  if (!row) return base;
  const lines = text(row.options, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    label: text(row.label, base.label),
    variant: base.variant === undefined ? undefined : text(row.label_variant, base.variant),
    // Un nombre de lignes différent décalerait le barème : on garde la référence.
    options: lines.length === base.options.length ? lines : base.options,
    tip: base.tip === undefined ? undefined : text(row.tip, base.tip),
  };
}

/** Applique `merge` à chaque entrée connue de la référence (clés inconnues ignorées). */
function mergeRecord<T>(
  base: Record<string, T>,
  raw: unknown,
  merge: (value: T, row?: Record<string, unknown>) => T,
): Record<string, T> {
  const rows = byKey(raw);
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, merge(v, rows.get(k))]));
}

export function mergeTexts(base: DiagnosticTexts, raw: RawDiagnosticTexts): DiagnosticTexts {
  return {
    title: text(raw.title, base.title),
    intro: text(raw.intro, base.intro),
    ctaLabel: text(raw.cta_label, base.ctaLabel),
    levels: {
      low: text(raw.level_low, base.levels.low),
      mid: text(raw.level_mid, base.levels.mid),
      high: text(raw.level_high, base.levels.high),
    },
    themes: mergeRecord(base.themes, raw.themes, (v, r) => text(r?.label, v)),
    questions: mergeRecord(base.questions, raw.questions, mergeQuestion),
    offers: mergeRecord(base.offers, raw.offers, (v, r) => ({
      name: text(r?.name, v.name),
      price: text(r?.price, v.price),
      description: text(r?.description, v.description),
      url: safeUrl(r?.url, v.url),
    })),
    messages: mergeRecord(base.messages, raw.messages, (v, r) => text(r?.text, v)),
    unlock: {
      title: text(raw.unlock_title, base.unlock.title),
      body: text(raw.unlock_body, base.unlock.body),
      consent: text(raw.consent_label, base.unlock.consent),
      newsletter: text(raw.newsletter_label, base.unlock.newsletter),
      button: text(raw.unlock_button, base.unlock.button),
    },
    emailSubject: text(raw.email_subject, base.emailSubject),
    promo: {
      title: text(raw.promo_title, base.promo.title),
      body: text(raw.promo_body, base.promo.body),
      label: text(raw.promo_label, base.promo.label),
      hubLabel: text(raw.promo_hub_label, base.promo.hubLabel),
    },
  };
}

/** Libellé d'une question pour un profil B2B (`leader`, `hr`, `other`). */
export function questionLabel(texts: DiagnosticTexts, id: string, profile?: string): string {
  const q = texts.questions[id];
  if (!q) return id;
  const target = VARIANT_PROFILE[id];
  return q.variant && target && target === profile ? q.variant : q.label;
}

export { B2B_TEXTS } from "./texts-b2b.ts";
export { B2C_TEXTS } from "./texts-b2c.ts";
