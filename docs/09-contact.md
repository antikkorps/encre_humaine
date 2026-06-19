# 04 / 09 — Travaillons ensemble (Contact)

**Route** : `/contact` · **Source** : `contact_page` + `faq_items` (scope=contact) + `site_settings` · **API** : `03` §2.

## Objectif
Transformer l'intérêt en action. Page chaude : simple, rassurante. Ne pas gâcher avec un formulaire froid.

## Sections (ordre)
1. **Accroche humaine** — `accroche_title` + `accroche_body`.
2. **Deux façons de me contacter** :
   - **Appel découverte** — `booking_intro` + `BookingEmbed` (URL `site_settings.booking_url`, provider Cal.com, **chargé après consentement** ; sinon bouton « Activer la prise de RDV »).
   - **Message** — `ContactForm` : prénom, email, « Vous êtes : organisation / particulier » (radio), message 2-3 lignes, Turnstile. → `POST /api/contact`. Mention RGPD discrète.
3. **Ce qui se passe ensuite** — `next_steps` (répéteur) + `response_time_note` (48h ouvrées).
4. **FAQ courte** — `faq_items` (scope=contact).
5. **Coordonnées directes** — email, LinkedIn, localisation (`site_settings`).

## A11y / SEO
- Formulaire accessible (labels, radios groupées en `fieldset`/`legend`, erreurs `aria-live`, focus sur succès/erreur). `h1` = `accroche_title`.
- Embed RDV (Cal.com) en iframe différée : ne charge aucun cookie tiers avant consentement.

## Critères d'acceptation
- Soumission valide → lead enregistré + email à Eléonore. Turnstile vérifié serveur. L'embed RDV ne se charge qu'après consentement. États succès/erreur clairs. Pas d'IP persistée.
