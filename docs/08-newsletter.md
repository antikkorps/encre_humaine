# 04 / 08 — Newsletter (« Les Tentacules »)

**Routes** : `/ressources#newsletter` (inscription — **fusionnée dans la page /ressources**) · `/newsletter` → **redirect 301** vers `/ressources` · `/newsletter/confirmation` (retour double opt-in — **inchangée**)
**Source** : `newsletter_page` (rendu par le loader `/ressources`) · **API** : `03` §3.

> **Fusion (2026-07) :** la landing d'inscription autonome a été supprimée ; le bloc newsletter
> « Les Tentacules » vit désormais dans la **section newsletter de `/ressources`** (`id="newsletter"`).
> Le **flux double opt-in est inchangé** (`/api/newsletter/subscribe|confirm`, `/newsletter/confirmation`).

## Section newsletter (dans `/ressources`)
1. **Nom & sous-titre** — `name` (« Les Tentacules… ») + `subtitle` (une fois tous les 15 jours…).
2. **Chaque édition aide à** — `helps_with` (répéteur). **Contenu d'une édition** — `what_you_receive` (répéteur).
3. **Formulaire** — `NewsletterForm` : prénom (optionnel) + email + Turnstile + bouton « Recevoir les Tentacules » (prop `submitLabel`). Lead magnet offert = `welcome_gift_label`. → `POST /api/newsletter/subscribe`.
4. **Cadeau de bienvenue** — `welcome_gift_label` (si défini).
5. **Aperçu d'un numéro** — `sample_excerpt` + `sample_issue_label`.

## `/newsletter/confirmation`
Page de retour du lien tokenisé (`03` §3.2). États : **succès** (« C'est confirmé ! »), **lien expiré** (proposer une nouvelle inscription), **invalide**. Aucune action destructive sur simple GET hors confirmation explicite.

## A11y / SEO
- Formulaire : labels liés, erreurs annoncées (`aria-live`), focus sur le premier champ en erreur. `h1` = nom de la newsletter.

## Critères d'acceptation
- Inscription crée un `pending` + email de confirmation ; tant que non confirmé → pas de broadcast. Page confirmation gère succès/expiré/invalide. Double soumission idempotente. RGPD mention présente.
