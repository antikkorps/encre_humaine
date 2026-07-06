# 04 / 09 — Travaillons ensemble (Contact)

**Route** : `/contact` · **Source** : `contact_page` + `faq_items` (scope=contact) + `site_settings` · **API** : `03` §2.

## Objectif
Transformer l'intérêt en action. Page chaude : simple, rassurante. Ne pas gâcher avec un formulaire froid.

## Sections (ordre)
1. **Accroche humaine** — `accroche_title` + `accroche_body` + double CTA (→ ancre `#contact`).
2. **Deux façons de me contacter** (onglets, `id="contact"`) :
   - **Réserver un échange** — `booking_intro` + `BookingEmbed` (URL `site_settings.booking_url`, provider Cal.com, **chargé après consentement**) + `booking_reassurance` (« 🐙 Aucun tentacule commercial caché… »).
   - **M'envoyer un message** — `message_intro` + `ContactForm` (prénom, email, audience, message, Turnstile → `POST /api/contact`). Mention RGPD discrète.
3. **Comment se déroule le premier échange** — `next_steps` (répéteur) + `steps_conclusion` + `response_time_note`.
4. **Vous pouvez me contacter si…** — `reasons_title` + deux colonnes `reasons_org` / `reasons_b2c` (masqué si vide).
5. **FAQ courte** — `faq_items` (scope=contact).
6. **CTA final** — `final_cta_title` + `final_cta_body` → ancre `#contact`.
7. **Coordonnées directes** — email, LinkedIn, localisation (`site_settings`).

## A11y / SEO
- Formulaire accessible (labels, radios groupées en `fieldset`/`legend`, erreurs `aria-live`, focus sur succès/erreur). `h1` = `accroche_title`.
- Embed RDV (Cal.com) en iframe différée : ne charge aucun cookie tiers avant consentement.

## Critères d'acceptation
- Soumission valide → lead enregistré + email à Eléonore. Turnstile vérifié serveur. L'embed RDV ne se charge qu'après consentement. États succès/erreur clairs. Pas d'IP persistée.
