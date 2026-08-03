// ⚠️ FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
// Source : packages/directus/snapshots/schema.yaml — régénérer : pnpm directus:types
// Types de contenu Directus dérivés du schéma (DRY, docs/02 §Accès).
// biome-ignore-all lint/style/useNamingConvention: noms de champs = colonnes Directus (snake_case).

/** Fichier Directus (sous-ensemble utile côté lecture). */
export interface DirectusFile {
  id: string;
  filename_download: string;
  title: string | null;
  description: string | null;
  type: string | null;
  width: number | null;
  height: number | null;
}

export interface AboutPage {
  id: string;
  story_photo: string | DirectusFile | null;
  story_body: string | null;
  story_photo_2: string | DirectusFile | null;
  story_body_2: string | null;
  why_title: string | null;
  why_body: string | null;
  octopus_body: string | null;
  convictions: unknown | null;
  portrait_photo: string | DirectusFile | null;
  personal_quote: string | null;
  cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  accroche_title: string | null;
  accroche_body: string | null;
  story_title: string | null;
  octopus_subtitle: string | null;
  convictions_title: string | null;
  work_title: string | null;
  work_intro: string | null;
  how_i_work: unknown | null;
  location: string | null;
  what_i_dont_do_title: string | null;
  what_i_dont_do: unknown | null;
  cta_title: string | null;
  cta_body: string | null;
}

export interface ArticleCategories {
  id: string;
  name: string | null;
  slug: string;
  group: string | null;
  sort: number | null;
}

export interface Articles {
  id: string;
  title: string | null;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | DirectusFile | null;
  category: string | ArticleCategories | null;
  reading_time: number | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

export interface B2cHubPage {
  id: string;
  accroche_title: string | null;
  accroche_body: string | null;
  accroche_photo: string | DirectusFile | null;
  situation_a_title: string | null;
  situation_a_body: string | null;
  situation_a_cta_label: string | null;
  situation_a_cta_link: string | null;
  situation_b_title: string | null;
  situation_b_body: string | null;
  situation_b_cta_label: string | null;
  situation_b_cta_link: string | null;
  how_i_work_body: string | null;
  testimonial: string | Testimonials | null;
  cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  accroche_subtitle: string | null;
  accroche_signature: string | null;
  accroche_cta_label: string | null;
  outcomes_title: string | null;
  outcomes_intro: string | null;
  outcomes: unknown | null;
  situations_title: string | null;
  situations_intro: string | null;
  situation_a_audience: string | null;
  situation_a_items: unknown | null;
  situation_a_result: string | null;
  situation_b_audience: string | null;
  situation_b_items: unknown | null;
  situation_b_result: string | null;
  how_i_work_title: string | null;
  how_i_work_signature: string | null;
  why_different_title: string | null;
  why_different_body: string | null;
  format_title: string | null;
  format_items: unknown | null;
  format_body: string | null;
  cta_title: string | null;
  cta_body: string | null;
  cta_subtext: string | null;
}

export interface ContactPage {
  id: string;
  accroche_title: string | null;
  accroche_body: string | null;
  booking_intro: string | null;
  next_steps: unknown | null;
  response_time_note: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  booking_reassurance: string | null;
  message_intro: string | null;
  steps_conclusion: string | null;
  reasons_title: string | null;
  reasons_org: unknown | null;
  reasons_b2c: unknown | null;
  final_cta_title: string | null;
  final_cta_body: string | null;
}

export interface FaqItems {
  id: string;
  question: string | null;
  answer: string | null;
  scope: string;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

export interface HomePage {
  id: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  stats: unknown | null;
  intro_title: string | null;
  intro_text: string | null;
  intro_photo: string | DirectusFile | null;
  featured_testimonial: string | Testimonials | null;
  final_cta_title: string | null;
  final_cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  hero_tagline: unknown | null;
  hero_cta_primary_label: string | null;
  hero_cta_secondary_label: string | null;
  hero_proofs: unknown | null;
  recognition_title: string | null;
  recognition_subtitle: string | null;
  recognition_items: unknown | null;
  recognition_conclusion: string | null;
  build_title: string | null;
  build_blocks: unknown | null;
  build_cta_label: string | null;
  build_cta_url: string | null;
  method_title: string | null;
  method_subtitle: string | null;
  method_steps: unknown | null;
  why_title: string | null;
  why_subtitle: string | null;
  why_items: unknown | null;
  why_conclusion: string | null;
  intro_cta_label: string | null;
  b2c_section_title: string | null;
  b2c_section_text: string | null;
  b2c_cards: unknown | null;
  b2c_cta_label: string | null;
  resources_title: string | null;
  resources_subtitle: string | null;
  resources_cta_label: string | null;
  final_cta_description: string | null;
  hero_signature: string | null;
}

export interface LegalDocuments {
  id: string;
  title: string | null;
  slug: string;
  body: string | null;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

export interface NewsletterPage {
  id: string;
  name: string | null;
  promise_body: string | null;
  what_you_receive: unknown | null;
  welcome_gift_label: string | Resources | null;
  sample_excerpt: string | null;
  sample_issue_label: string | null;
  rgpd_mention: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  subtitle: string | null;
  helps_with: unknown | null;
}

export interface Offers {
  id: string;
  title: string | null;
  slug: string;
  audience: string;
  icon: string | null;
  short_description: string | null;
  duration_label: string | null;
  price_label: string | null;
  price_note: string | null;
  accroche_title: string | null;
  accroche_body: string | null;
  outcomes: unknown | null;
  audience_fit: unknown | null;
  format_body: string | null;
  featured_testimonial: string | Testimonials | null;
  cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
  accroche_subtitle: string | null;
  accroche_signature: string | null;
  outcomes_title: string | null;
  outcomes_intro: string | null;
  context_title: string | null;
  context_items: unknown | null;
  context_conclusion: string | null;
  mission_title: string | null;
  mission_includes: unknown | null;
  audience_fit_title: string | null;
  audience_fit_conclusion: string | null;
  cta_title: string | null;
  cta_body: string | null;
  cta_subtext: string | null;
  approche_title: string | null;
  approche_body: string | null;
  approche_signature: string | null;
  mission_intro: string | null;
  format_title: string | null;
  background_title: string | null;
  background_body: string | null;
  audience_fit_exclude: unknown | null;
  takeaways_title: string | null;
  takeaways_intro: string | null;
  takeaways: unknown | null;
}

export interface OrgHubPage {
  id: string;
  accroche_title: string | null;
  accroche_body: string | null;
  accroche_photo: string | DirectusFile | null;
  method_steps: unknown | null;
  audience_items: unknown | null;
  cta_title: string | null;
  cta_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  accroche_subtitle: string | null;
  accroche_signature: string | null;
  observe_title: string | null;
  observe_intro: string | null;
  observe_items: unknown | null;
  observe_conclusion: string | null;
  offers_title: string | null;
  method_title: string | null;
  method_intro: string | null;
  differentiator_title: string | null;
  differentiator_body: string | null;
  audience_title: string | null;
  audience_conclusion: string | null;
  testimonials_title: string | null;
  cta_body: string | null;
  cta_subtext: string | null;
  situations_title: string | null;
  situations_intro: string | null;
  situation_a_title: string | null;
  situation_a_body: string | null;
  situation_a_audience: string | null;
  situation_a_items: unknown | null;
  situation_a_result: string | null;
  situation_a_cta_label: string | null;
  situation_a_cta_link: string | null;
  situation_b_title: string | null;
  situation_b_body: string | null;
  situation_b_audience: string | null;
  situation_b_items: unknown | null;
  situation_b_result: string | null;
  situation_b_cta_label: string | null;
  situation_b_cta_link: string | null;
  situation_c_title: string | null;
  situation_c_body: string | null;
  situation_c_audience: string | null;
  situation_c_items: unknown | null;
  situation_c_result: string | null;
  situation_c_cta_label: string | null;
  situation_c_cta_link: string | null;
}

export interface Products {
  id: string;
  stripe_product_id: string;
  name: string | null;
  slug: string;
  tagline: string | null;
  description: string | null;
  images: ProductsFiles[] | string[] | null;
  game_details: unknown | null;
  audience: string | null;
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

export interface ProductsFiles {
  id: string;
  products_id: string | Products | null;
  directus_files_id: string | DirectusFile | null;
  sort: number | null;
}

export interface Resources {
  id: string;
  title: string | null;
  slug: string;
  description: string | null;
  file: string | DirectusFile | null;
  cover_image: string | DirectusFile | null;
  requires_email: boolean;
  audience: string | null;
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

export interface ResourcesPage {
  id: string;
  accroche_title: string | null;
  accroche_body: string | null;
  featured_resource: string | Resources | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
  hero_signature: string | null;
  featured_article: string | Articles | null;
  positioning_title: string | null;
  positioning_body: string | null;
  cta_title: string | null;
  positioning_photo: string | DirectusFile | null;
}

export interface ShopPage {
  id: string;
  shop_enabled: boolean;
  title: string | null;
  intro: string | null;
  empty_message: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | DirectusFile | null;
  no_index: boolean;
}

export interface SiteSettings {
  id: string;
  brand_name: string | null;
  tagline: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  booking_url: string | null;
  location_label: string | null;
  social_links: unknown | null;
  legal_name: string | null;
  legal_status: string | null;
  siret: string | null;
  legal_address: string | null;
  vat_mention: string | null;
  host_info: string | null;
  default_og_image: string | DirectusFile | null;
  default_meta_description: string | null;
}

export interface Testimonials {
  id: string;
  quote: string;
  author_name: string | null;
  author_title: string | null;
  company: string | null;
  audience: string | null;
  context: string | null;
  featured: boolean;
  status: string;
  sort: number | null;
  date_created: string | null;
  date_updated: string | null;
  user_created: string | null;
  user_updated: string | null;
}

/** Schéma consommé par le SDK Directus (createDirectus<Schema>). */
export interface Schema {
  about_page: AboutPage;
  article_categories: ArticleCategories[];
  articles: Articles[];
  b2c_hub_page: B2cHubPage;
  contact_page: ContactPage;
  faq_items: FaqItems[];
  home_page: HomePage;
  legal_documents: LegalDocuments[];
  newsletter_page: NewsletterPage;
  offers: Offers[];
  org_hub_page: OrgHubPage;
  products: Products[];
  products_files: ProductsFiles[];
  resources: Resources[];
  resources_page: ResourcesPage;
  shop_page: ShopPage;
  site_settings: SiteSettings;
  testimonials: Testimonials[];
  directus_files: DirectusFile[];
}
