# 02 — Modèle de contenu (Directus)

> Dépend de `00-overview.md` et `01-data-model.md`. Définit le contenu **éditable par Eléonore** dans Directus. Aucune de ces collections n'est dans le schéma `app` (Drizzle) — Directus gère son propre schéma `directus`.

---

## 1. Philosophie d'édition

Deux familles de contenu, deux traitements :

- **Pages structurelles** (accueil, à propos, hubs, contact…) → **singletons typés**. Layout fixe côté code, champs explicites et bien nommés côté Directus (« Titre du hero », « Sous-titre »…). Eléonore remplit des champs clairs, elle ne construit pas de page.
- **Contenu répétable** (articles, témoignages, offres, ressources, FAQ, produits) → **collections**. Un enregistrement par item, schéma typé.

> **Pas de page-builder M2A en phase 1.** Un constructeur de pages par blocs (Many-to-Any) serait surdimensionné et déroutant pour une éditrice non-tech. Si elle veut plus de liberté de mise en page un jour, c'est une évolution phase 3 — pas un prérequis. Les pages structurelles ont un design fixe, c'est volontaire et c'est ce qui garde son expérience simple.

---

## 2. Vue d'ensemble des collections

| Clé | Type | Rôle | Phase contenu |
|-----|------|------|---------------|
| `site_settings` | singleton | identité, contacts, infos légales, SEO par défaut | 1 |
| `home_page` | singleton | page d'accueil | 1 |
| `about_page` | singleton | à propos | 1 |
| `org_hub_page` | singleton | hub organisations | 1 |
| `b2c_hub_page` | singleton | hub particuliers | 1 |
| `resources_page` | singleton | intro blog + ressource en vedette | 1 |
| `newsletter_page` | singleton | promesse « Le Fil » + extrait | 1 |
| `contact_page` | singleton | accroche + étapes + FAQ contact | 1 |
| `legal_documents` | collection | mentions, CGV, CGU, confidentialité | 1 |
| `offers` | collection | 3 offres B2B + 2 B2C | schéma 1 / contenu détaillé 2 |
| `testimonials` | collection | témoignages réutilisables | 1 (peut être vide) |
| `faq_items` | collection | FAQ réutilisables par périmètre | 1 |
| `products` | collection | **contenu éditorial** des serious games | 1 |
| `articles` | collection | blog | schéma 1 / contenu 2-3 |
| `article_categories` | collection | catégories du blog | 1 |
| `resources` | collection | guides/checklists téléchargeables | schéma 1 / contenu 2 |
| `newsletter_issues` | collection | archives « Le Fil » | **différé phase 3** |

---

## 3. Champs communs (appliqués partout où pertinent)

**Bloc statut (workflow de publication)** sur tout contenu visible publiquement :
- `status` : `draft` | `published` | `archived` (interface statut Directus). **Nuxt ne lit que `published`.**
- `date_created`, `date_updated`, `user_created`, `user_updated` (champs système Directus).

**Bloc SEO** (groupe réutilisable) sur singletons indexables, `offers`, `articles`, `products`, `resources` :
- `meta_title` (fallback : titre de l'item + nom du site)
- `meta_description`
- `og_image` (fallback : `site_settings.default_og_image`)
- `no_index` (booléen, défaut false)

---

## 4. Singletons (champs)

### `site_settings` (global)
- `brand_name` (« L'Encre Humaine »)
- `tagline`
- `contact_email`
- `linkedin_url`
- `booking_url` ← URL de prise de RDV, consommée par l'embed RDV (provider-agnostique : Cal.com, Calendly…)
- `location_label` (« Bouches-du-Rhône · France entière »)
- `social_links` (répéteur : plateforme + url)
- **Infos légales** (pour footer + mentions) : `legal_name`, `legal_status`, `siret`, `legal_address`, `vat_mention` (prérempli « TVA non applicable, art. 293 B du CGI »), `host_info`
- `default_og_image`, `default_meta_description`

### `home_page`
- Hero : `hero_title`, `hero_subtitle`, `hero_cta_b2b_label`, `hero_cta_b2c_label`
- Ligne de crédibilité : `stats` (répéteur : `value` + `label`) — ex. « 10+ » / « ans d'expérience »
- « Ce que je fais » : `block_b2b_title`, `block_b2b_text`, `block_b2b_tags`, `block_b2c_title`, `block_b2c_text`, `block_b2c_tags`
- « Qui je suis » : `intro_title`, `intro_text`, `intro_photo`
- Témoignage vedette : `featured_testimonial` (M2O → `testimonials`)
- Derniers articles : **dynamique** (3 derniers `articles` publiés, pas un champ)
- CTA final : `final_cta_title`, `final_cta_label`

### `about_page`
- `accroche` (texte court mis en avant)
- `story_photo`, `story_body` (rich text — « Mon histoire »)
- `why_title`, `why_body` (« Pourquoi L'Encre Humaine »)
- `octopus_body` (« Le poulpe » — avec humour)
- `convictions` (répéteur : `title` + `body`) — les 4 « ce en quoi je crois »
- `how_i_work` (répéteur : `text`)
- `what_i_dont_do` (rich text)
- `portrait_photo`, `personal_quote`
- CTA : `cta_label`

### `org_hub_page`
- `accroche_title`, `accroche_body`
- Offres : **dynamique** (collection `offers` filtrée `audience=organisation`)
- Méthode : `method_steps` (répéteur : `number` + `title` + `description`) — Cadrage / Diagnostic / Construction / Restitution
- « Pour qui » : `audience_items` (répéteur : `text`)
- Témoignages : M2M ou filtre dynamique `testimonials` `audience=organisation`
- FAQ : filtre `faq_items` `scope=org`
- CTA : `cta_title`, `cta_label`

### `b2c_hub_page`
- `accroche_title`, `accroche_body`
- Deux situations : `situation_a_title/body/cta_label/cta_link`, `situation_b_title/body/cta_label/cta_link`
- `how_i_work_body`
- Témoignage : M2O → `testimonials`
- FAQ : filtre `faq_items` `scope=b2c_hub`
- CTA : `cta_label`

### `resources_page`
- `accroche_title`, `accroche_body`
- `featured_resource` (M2O → `resources`)
- Catégories : dynamique (`article_categories`)

### `newsletter_page`
- `name` (« Le Fil »), `promise_body`
- `what_you_receive` (répéteur : `text`)
- `welcome_gift_label` (M2O → `resources`, optionnel)
- `sample_excerpt`, `sample_issue_label` (ex. « Extrait du Fil #07 »)
- `rgpd_mention`

### `contact_page`
- `accroche_title`, `accroche_body`
- `booking_intro` (texte au-dessus de l'embed RDV)
- `next_steps` (répéteur : `number` + `title` + `description`)
- FAQ : filtre `faq_items` `scope=contact`
- `response_time_note` (« Je réponds sous 48h ouvrées… »)

---

## 5. Collections (champs)

### `offers`
- `title`, `slug`, `audience` (`organisation`|`particulier`)
- `icon` (clé d'icône), `short_description` (pour le hub), `sort`
- `duration_label`, `price_label` (texte libre — ex. « 1 500 – 2 500 € HT »), `price_note`
- `accroche_title`, `accroche_body`
- `mission_includes` (répéteur : `text`)
- `outcomes` (répéteur : `title` + `body`)
- `audience_fit` (répéteur : `text`) — « Pour qui »
- `format_body` (pour les offres qui ont un bloc format)
- `faq` (M2M → `faq_items`) ou filtre par `scope`
- `featured_testimonial` (M2O → `testimonials`)
- `cta_label`
- bloc SEO + statut

> Schéma créé en phase 1, hubs branchés dessus pour les cartes. Contenu détaillé des pages offres rédigé en phase 2 (cf. `00` § phases).

### `products` (contenu éditorial des serious games)
- `stripe_product_id` ← **lien vers Stripe** (source des prix/stock/paiement)
- `name`, `slug`
- `tagline`, `description` (rich text)
- `images` (M2M fichiers)
- `game_details` (répéteur : `label` + `value` — ex. « Joueurs », « Durée », « Public »)
- `audience` (`organisation`|`particulier`|`both`)
- `featured` (booléen), `sort`
- bloc SEO + statut

> ⚠️ Aucun prix, aucun stock ici : ils vivent dans Stripe. Le rapprochement se fait par `stripe_product_id`. C'est la matérialisation de la règle « 3 sources, zéro recopie » (`01` §1).

### `testimonials`
- `quote`, `author_name`, `author_title`, `company`
- `audience` (`organisation`|`particulier`)
- `context` (secteur / enjeu, optionnel)
- `featured` (booléen), `sort`, statut

> Le client n'aura pas de témoignages au lancement. **Toutes les sections témoignage doivent se masquer proprement si vide** (critère d'acceptation).

### `faq_items`
- `question`, `answer` (rich text)
- `scope` — **le libellé affiché nomme la ou les PAGES d'affichage**, pas un thème : l'éditrice doit savoir où sortira sa question sans lire le code. Valeurs stockées (stables) et libellés admin :

| Valeur | Libellé admin | Pages qui l'affichent |
|--------|---------------|------------------------|
| `contact` | Page /contact | `/contact` |
| `org` | Page /organisations | hub `/organisations` |
| `b2c_hub` | Page /particuliers | hub `/particuliers` |
| `audit` | Offre Audit RH | `/organisations/audit-rh` |
| `competences` | Offre Compétences & parcours | `/organisations/competences-parcours` |
| `managers` | Offre Managers & équipes | `/organisations/managers-equipes` |
| `b2c` | Offre Clarifier & avancer | `/particuliers/clarifier-avancer` |
| `booster` | Offre Booster sa recherche | `/particuliers/booster-recherche` |
| `general` | Toutes les offres (transverse) | les **5 pages d'offre** uniquement — ni hubs, ni `/contact` |

> **Un périmètre = une page** depuis le 2026-08-14. `b2c` était partagé entre le hub `/particuliers` et l'offre Clarifier & avancer ; Éléonore a tranché que ses questions étaient justes **pour l'offre**, et a demandé une FAQ propre à chaque hub. La valeur `b2c` est donc restée sur l'offre (ses 5 questions publiées n'ont pas bougé de page — la renommer aurait exigé une migration de données sur la prod pour un gain cosmétique) et le hub a pris `b2c_hub`. ⚠️ **Le nom de la valeur `b2c` ment : c'est le libellé qui fait foi.**
>
> Piège restant : `general` **ne sort pas** sur les hubs ni sur `/contact`. Un test (`apps/web/test/faq-scopes.spec.ts`) échoue si un périmètre proposé dans l'admin n'est rendu par aucune page, et vérifie que les libellés nomment bien la bonne page.

- `sort`, statut

### `articles`
- `title`, `slug`, `excerpt` (chapeau 2 lignes), `body` (rich text)
- `cover_image`, `category` (M2O → `article_categories`)
- `reading_time` (calculé à l'enregistrement ou saisi)
- `published_at`, statut
- bloc SEO

### `article_categories`
- `name`, `slug`
- `group` (`organisations`|`particuliers`|`terrain`) ← les 3 grands filtres du blog
- `sort`

### `resources` (lead magnets)
- `title`, `slug`, `description`
- `file` (M2O fichier → PDF stocké sur R2)
- `cover_image`
- `requires_email` (booléen) — déclenche le gating par email
- `audience`, `featured`, statut

### `newsletter_issues` — **différé phase 3**
Archives publiques de « Le Fil ». Schéma minimal le moment venu : `issue_number`, `title`, `excerpt`, `body`/`external_url`, `published_at`.

---

## 6. Rôles & permissions

| Rôle | Qui | Droits |
|------|-----|--------|
| **Administrateur** | Franck | structure (collections, champs), rôles, paramètres système |
| **Éditrice** | Eléonore | CRUD complet sur **toutes les collections de contenu** + bibliothèque de fichiers ; **aucun** accès à la structure, aux rôles, ni aux réglages système |
| **API (lecture)** | l'app Nuxt | **lecture seule**, filtrée sur `status = published` uniquement |
| **Public** (anonyme) | les visiteurs, les crawlers | lecture de `directus_files` **filtrée aux images** (`type` commence par `image/`) — rien d'autre |

Règles :
- L'**éditrice** contrôle la mise en ligne via le `status` (draft → published). Rien ne part en prod sans son action.
- Le **token API** de Nuxt est en lecture seule et ne voit jamais les brouillons. Stocké en variable d'env (`07-deploy`).
- **Pourquoi le rôle Public existe** : les médias sont servis par le CMS directement au navigateur (`<img src="{DIRECTUS_PUBLIC_URL}/assets/…">`, il n'y a pas de proxy Nuxt). Sans permission publique, **toute image uploadée renvoie 403** pour un visiteur — mais reste visible pour qui est connecté au CMS (cookie `.encrehumaine.fr`), ce qui masque la panne. Les `og:image` cassent aussi (les crawlers sont anonymes).
- **Le filtre mime est la frontière de sécurité** : il borne aussi `/files`, donc un anonyme ne peut pas énumérer la bibliothèque. Ce qui n'est pas une image (PDF du lead magnet `resources.file`) reste invisible. ⚠️ **Ne jamais élargir cette permission à `directus_files` sans filtre** : ça exposerait les documents à l'énumération. Un futur fichier privé qui serait une image demanderait un filtre par dossier.
- **Ne jamais valider un rendu d'image en étant connecté au CMS** (voir ci-dessus) : tester en navigation privée, ou `curl` sans en-tête d'auth.
- **Isolation base** : le rôle Postgres de Directus est restreint au schéma `directus` (il ne voit pas `app`). Directus n'expose donc jamais `orders`/`leads`/`subscribers`. (Config dans `07-deploy`.)

---

## 7. Fichiers & images

- **Stockage** : adaptateur S3 de Directus pointé sur **R2** → app stateless côté fichiers (cohérent `00` §4).
- **Upload** : Eléonore passe par la bibliothèque de fichiers Directus (photos, PDF de ressources, visuels produits).
- **Consommation Nuxt** : `@nuxt/image` avec Directus comme provider → responsive + formats modernes (AVIF/WebP) + lazy-loading, au service de l'objectif Lighthouse. Pas d'image brute non optimisée servie au client.
- **Accessibilité** : champ `alt` obligatoire sur les images de contenu (rappel a11y WCAG AA).

---

## 8. Consommation côté Nuxt

- SDK Directus officiel (`@directus/sdk`), typé.
- **Types dérivés du schéma Directus** (générés / typés via le SDK) — jamais ré-écrits à la main, même principe DRY que pour Drizzle.
- Stratégie de rendu : **SSG/ISR** pour les pages de contenu (perf + SEO), revalidation à la publication. Le détail de la stratégie de cache est dans `07-deploy`.
- Le schéma Directus est **versionné par snapshots** dans `packages/directus` (`directus schema snapshot`) → reproductible au déploiement, diffable en review.

---

## 9. Cartographie page → contenu (extrait)

| Page | Singleton/collection |
|------|----------------------|
| `/` | `home_page` + `articles` (3 derniers) + `testimonials` (vedette) |
| `/a-propos` | `about_page` |
| `/organisations` | `org_hub_page` + `offers` (b2b) + `faq_items` (org) + `testimonials` (b2b) |
| `/particuliers` | `b2c_hub_page` + `faq_items` (b2c) + `testimonials` (b2c) |
| `/organisations/*` (offres) | `offers` (par slug) + `faq_items` + `testimonials` |
| `/particuliers/*` (offres) | `offers` (par slug) + `faq_items` |
| `/ressources` | `resources_page` + `articles` + `article_categories` + `resources` |
| `/ressources/[slug]` | `articles` (par slug) |
| `/newsletter` | `newsletter_page` |
| `/contact` | `contact_page` + `faq_items` (contact) |
| `/laboratoire` + `/laboratoire/[slug]` | `products` (+ Stripe pour prix) |
| `/mentions-legales`, CGV… | `legal_documents` |

---

## 10. Critères d'acceptation

1. Eléonore peut créer/modifier/publier un article, un témoignage, une ressource, un produit (éditorial) et modifier toute page structurelle **sans intervention dev**.
2. Aucune section ne casse si une collection est **vide** (témoignages notamment) — masquage propre.
3. Le rôle Éditrice n'a accès ni à la structure, ni aux rôles, ni aux réglages système.
4. Le token API Nuxt ne renvoie **jamais** de contenu `draft`.
5. Directus ne peut pas lire le schéma `app` (vérifiable : ses collections n'incluent ni `orders`, ni `contact_leads`, ni `newsletter_subscribers`).
6. Aucun prix/stock dans `products` (Directus) — uniquement l'éditorial + `stripe_product_id`.
7. Toute image de contenu porte un `alt`.
8. Le schéma Directus est exporté en snapshot versionné et rejouable sur une instance vierge.

---

*Suivant : `03-api-contracts.md` (webhook Stripe, contact, newsletter — la logique dure).*
