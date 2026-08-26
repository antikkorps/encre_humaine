-- ───────────────────────────────────────────────────────────────────────────
-- Audit du trafic Umami — « d'où viennent vraiment les visites ? »
-- Lancé par `make prod-umami-audit` (sur le serveur, dans /srv/encre-humaine).
--
-- LECTURE SEULE : rien que des SELECT + une vue TEMP (détruite à la déconnexion).
-- Le tableau de bord Umami donne des totaux ; ce qu'il ne montre pas, c'est si
-- une source amène des humains ou du bruit. D'où les colonnes d'engagement.
--
-- Deux pièges corrigés ici, qui faussent toute lecture naïve de la table :
--  1. le referrer n'est porté que par la page D'ENTRÉE d'une visite — grouper
--     sur `website_event.referrer_domain` fait retomber toute la navigation
--     interne en « direct » et écrase les vraies sources ;
--  2. l'unité pertinente est la visite (`visit_id`), pas la session : Umami est
--     cookieless, une même personne qui rouvre le lien compte plusieurs fois.
-- ───────────────────────────────────────────────────────────────────────────
\pset pager off
\timing off
SET search_path = umami, public;

-- Fenêtre d'observation, en jours. Surchargeable : `make prod-umami-audit J=30`
-- (psql exige un `\if` sur plusieurs lignes : `\else` sur la même ligne serait
-- lu comme un argument de `\if`).
\if :{?jours}
\else
  \set jours 14
\endif
\echo 'Fenêtre :' :jours 'jours'

CREATE TEMP VIEW v AS
WITH entree AS (
  -- Une ligne par visite : sa source et sa page d'entrée (cf. piège n°1).
  SELECT DISTINCT ON (e.visit_id)
         e.visit_id,
         e.session_id,
         e.created_at                                        AS debut,
         COALESCE(NULLIF(e.referrer_domain, ''), '(direct)') AS source,
         e.url_path                                          AS page_entree,
         e.utm_source, e.utm_medium, e.utm_campaign,
         e.li_fat_id
  FROM website_event e
  WHERE e.event_type = 1                       -- 1 = page vue (2 = évènement custom)
    AND e.created_at > now() - (:'jours' || ' days')::interval
  ORDER BY e.visit_id, e.created_at
), agr AS (
  SELECT visit_id,
         count(*) FILTER (WHERE event_type = 1)                      AS pages,
         extract(epoch FROM max(created_at) - min(created_at))::int  AS duree_s
  FROM website_event
  WHERE created_at > now() - (:'jours' || ' days')::interval
  GROUP BY visit_id
)
SELECT en.*, a.pages, a.duree_s,
       s.device, s.os, s.browser, s.screen, s.country, s.city, s.language
FROM entree en
JOIN agr a USING (visit_id)
LEFT JOIN session s ON s.session_id = en.session_id;

\echo ''
\echo '=== 1. Volume par jour ========================================='
SELECT debut::date AS jour,
       count(*)                   AS visites,
       count(DISTINCT session_id) AS visiteurs,
       sum(pages)                 AS pages_vues
FROM v GROUP BY 1 ORDER BY 1;

\echo ''
\echo '=== 2. Sources — engagement par visite ========================='
\echo '(pages_moy ~1 et duree_med 0 sur une source = du bruit, pas du trafic)'
SELECT source,
       count(*)                                                   AS visites,
       count(DISTINCT session_id)                                 AS visiteurs,
       round(avg(pages), 1)                                       AS pages_moy,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY duree_s)::int  AS duree_med_s,
       count(*) FILTER (WHERE pages = 1 AND duree_s = 0)          AS rebonds_0s,
       round(100.0 * count(*) FILTER (WHERE pages = 1 AND duree_s = 0) / count(*)) AS pct_0s
FROM v GROUP BY 1 ORDER BY visites DESC;

\echo ''
\echo '=== 3. Profil des visites LinkedIn ============================='
\echo '(lnkd.in = le redirecteur LinkedIn : meme source, autre ligne)'
SELECT device, os, browser, country,
       count(*)             AS visites,
       round(avg(pages), 1) AS pages_moy
FROM v WHERE source ILIKE '%linkedin%' OR source ILIKE '%lnkd%'
GROUP BY 1,2,3,4 ORDER BY visites DESC LIMIT 25;

\echo ''
\echo '=== 4. Signaux « pas humain » (toutes sources) ================='
\echo '(ecran vide/exotique + langue absente sur des visites 1 page / 0 s)'
SELECT source, screen, language, count(*) AS visites
FROM v WHERE pages = 1 AND duree_s = 0
GROUP BY 1,2,3 ORDER BY visites DESC LIMIT 20;

\echo ''
\echo '=== 5. Heure des visites LinkedIn (UTC) ========================'
\echo '(un pic net apres la publication = de vrais lecteurs ; un debit'
\echo ' regulier 24h/24 = un robot)'
SELECT debut::date AS jour,
       extract(hour FROM debut)::int AS heure_utc,
       count(*) AS visites
FROM v WHERE source ILIKE '%linkedin%' OR source ILIKE '%lnkd%'
GROUP BY 1,2 ORDER BY 1,2;

\echo ''
\echo '=== 6. Campagnes (UTM) ========================================='
\echo '(vide = aucun lien taggue ; li_fat_id non nul = clic sur une pub'
\echo ' LinkedIn Ads, decoupe par Umami 2.18 dans sa propre colonne)'
SELECT COALESCE(utm_source, '(aucun)')   AS utm_source,
       COALESCE(utm_medium, '(aucun)')   AS utm_medium,
       COALESCE(utm_campaign, '(aucun)') AS utm_campaign,
       count(*)                          AS visites,
       count(*) FILTER (WHERE li_fat_id IS NOT NULL) AS dont_linkedin_ads
FROM v GROUP BY 1,2,3 ORDER BY visites DESC LIMIT 20;

\echo ''
\echo '=== 7. Pages d entree par source ==============================='
\echo '(des URL profondes ou inexistantes en entree = scan automatise)'
SELECT source, page_entree, count(*) AS visites
FROM v GROUP BY 1,2 ORDER BY visites DESC LIMIT 30;
