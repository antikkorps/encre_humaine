# 04 / 08 — Newsletter (« Le Fil »)

**Routes** : `/newsletter` (inscription) · `/newsletter/confirmation` (retour double opt-in)
**Source** : `newsletter_page` · **API** : `03` §3.

## Objectif
Convertir en abonnés. Promesse éditoriale précise, friction minimale (prénom + email).

## `/newsletter`
1. **Nom & promesse** — `name` (« Le Fil ») + `promise_body` (bimensuel, 5 min, sans bullshit).
2. **Ce que vous recevez** — `what_you_receive` (répéteur).
3. **Formulaire** — `NewsletterForm` : prénom (optionnel) + email + Turnstile + bouton « Je m'abonne ». Mention RGPD sous le champ. → `POST /api/newsletter/subscribe`.
4. **Cadeau de bienvenue** — `welcome_gift_label` (si défini).
5. **Aperçu d'un numéro** — `sample_excerpt` + `sample_issue_label`.

## `/newsletter/confirmation`
Page de retour du lien tokenisé (`03` §3.2). États : **succès** (« C'est confirmé ! »), **lien expiré** (proposer une nouvelle inscription), **invalide**. Aucune action destructive sur simple GET hors confirmation explicite.

## A11y / SEO
- Formulaire : labels liés, erreurs annoncées (`aria-live`), focus sur le premier champ en erreur. `h1` = nom de la newsletter.

## Critères d'acceptation
- Inscription crée un `pending` + email de confirmation ; tant que non confirmé → pas de broadcast. Page confirmation gère succès/expiré/invalide. Double soumission idempotente. RGPD mention présente.
