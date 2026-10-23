import type { Answers, B2bResult, B2cResult, DiagnosticTexts } from "@encre/shared/diagnostics";
import type { DiagnosticKind } from "~/types/content";
// Imports EXPLICITES (pas d'auto-import `utils/` côté Nitro) : mêmes règles que la page.
import {
  answerLabelFor,
  bookingHref,
  bookingNote,
  contactFallbackPath,
  fillTemplate,
  themeScores,
} from "~/utils/diagnostic-flow";

/**
 * Email du rapport de diagnostic (docs/11-diagnostics.md §Email) : scores,
 * conseils, offre(s), rendez-vous et lien vers le rapport en ligne. Transférable
 * tel quel (un dirigeant le fait suivre à son DRH). HTML simple à styles en
 * ligne ; tout texte venant de Directus est échappé.
 */
export interface DiagnosticEmailInput {
  kind: DiagnosticKind;
  texts: DiagnosticTexts;
  answers: Answers;
  result: B2bResult | B2cResult;
  reportUrl: string;
  bookingUrl: string;
  email: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Lignes « thème : score/100 (niveau) », global en tête pour le B2B. */
function scoreLines({ kind, texts, result }: DiagnosticEmailInput): string[] {
  const themes = themeScores(kind, texts, result).map(
    (t) => `${t.label} : ${t.score}/100 (${t.level})`,
  );
  if (kind === "b2c") return themes;
  const r = result as B2bResult;
  return [
    `${texts.messages.global_label} : ${r.global}/100 (${texts.levels[r.globalLevel]})`,
    ...themes,
  ];
}

/** Message(s) de proposition, offres recommandées. */
function proposal({ kind, texts, answers, result }: DiagnosticEmailInput) {
  if (kind === "b2c") {
    const r = result as B2cResult;
    return {
      lines: [texts.messages[r.message] ?? "", r.ruptureNote ? (texts.messages.rupture ?? "") : ""],
      offers: [r.offer],
    };
  }
  const r = result as B2bResult;
  const priority =
    answers.priority === "unknown" ? "" : answerLabelFor(texts, "b2b", answers, "priority");
  return {
    lines: [
      r.solidBase ? (texts.messages.solid_base ?? "") : "",
      priority ? fillTemplate(texts.messages.priority_recall ?? "", { priorite: priority }) : "",
      r.sameDirection ? (texts.messages.same_direction ?? "") : "",
      r.sizeNote ? (texts.messages[`size_${r.sizeNote}`] ?? "") : "",
    ],
    offers: r.cards.map((c) => c.offer),
  };
}

function subject({ kind, texts, result }: DiagnosticEmailInput): string {
  const level = kind === "b2b" ? texts.levels[(result as B2bResult).globalLevel] : "";
  return fillTemplate(texts.emailSubject, { niveau: level });
}

/** Éléments du rapport, communs au HTML et au texte. */
function emailParts(input: DiagnosticEmailInput) {
  const { kind, texts, answers, result, reportUrl, bookingUrl, email } = input;
  const origin = new URL(reportUrl).origin;
  const { lines, offers } = proposal(input);
  return {
    texts,
    reportUrl,
    abs: (url: string) => (url.startsWith("/") ? `${origin}${url}` : url),
    scores: scoreLines(input),
    tips: result.tips.map((id) => texts.questions[id]?.tip ?? "").filter(Boolean),
    lines: lines.filter(Boolean),
    cards: offers.map((k) => texts.offers[k]).filter((o) => o !== undefined),
    booking:
      bookingHref(bookingUrl, { email, notes: bookingNote(kind, answers, result, texts) }) ||
      `${origin}${contactFallbackPath(kind)}`,
  };
}
type EmailParts = ReturnType<typeof emailParts>;

const SIGNATURE = "Éléonore — L'Encre Humaine";
const para = (s: string) => `<p style="margin:0 0 12px;line-height:1.55">${esc(s)}</p>`;
const heading = (s: string) => `<h2 style="font-size:18px;margin:24px 0 12px">${esc(s)}</h2>`;

function renderHtml(e: EmailParts): string {
  const m = e.texts.messages;
  const card = (o: EmailParts["cards"][number]) =>
    `<div style="border:1px solid #e5e1d8;border-radius:12px;padding:16px;margin:0 0 12px"><strong>${esc(o.name)}</strong><br><span style="color:#5b6272">${esc(o.price)}</span><p style="margin:8px 0">${esc(o.description)}</p><a href="${esc(e.abs(o.url))}" style="color:#283c5e">${esc(m.see_examples ?? "")}</a></div>`;
  return [
    `<div style="font-family:Arial,sans-serif;color:#1c2b4a;max-width:560px;margin:0 auto">`,
    `<h1 style="font-size:22px;margin:0 0 16px">${esc(e.texts.title)}</h1>`,
    ...e.scores.map(para),
    heading(m.tips_title ?? ""),
    ...(e.tips.length ? e.tips.map((t) => para(`• ${t}`)) : [para(m.no_tips ?? "")]),
    heading(m.proposal_title ?? ""),
    ...e.lines.map(para),
    ...e.cards.map(card),
    `<p style="margin:24px 0"><a href="${esc(e.booking)}" style="background:#d4a843;color:#1c2b4a;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(e.texts.ctaLabel)}</a></p>`,
    para(`Retrouver ce rapport en ligne : ${e.reportUrl}`),
    para(SIGNATURE),
    "</div>",
  ].join("\n");
}

function renderText(e: EmailParts): string {
  const m = e.texts.messages;
  return [
    e.texts.title,
    ...e.scores,
    "",
    m.tips_title ?? "",
    ...(e.tips.length ? e.tips.map((t) => `• ${t}`) : [m.no_tips ?? ""]),
    "",
    m.proposal_title ?? "",
    ...e.lines,
    ...e.cards.map((o) => `${o.name} — ${o.price}\n${o.description}\n${e.abs(o.url)}`),
    "",
    `${e.texts.ctaLabel} : ${e.booking}`,
    `Retrouver ce rapport en ligne : ${e.reportUrl}`,
    "",
    SIGNATURE,
  ].join("\n");
}

export function renderDiagnosticEmail(input: DiagnosticEmailInput) {
  const parts = emailParts(input);
  return { subject: subject(input), html: renderHtml(parts), text: renderText(parts) };
}
