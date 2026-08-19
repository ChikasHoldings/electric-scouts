/**
 * organization.js
 *
 * The site's Organization entity, in one place.
 *
 * It used to exist three times: once in src/seo/render.js for the prerendered
 * @graph, once in SEOHead.getOrganizationSchema() for the React pages, and once
 * more in StructuredData.OrganizationSchema(). The three disagreed — different
 * descriptions, `twitter.com` against `x.com`, instagram present in some and
 * missing in others — and only the prerendered one carried an @id.
 *
 * That is not a tidiness problem. SEOHead appends its JSON-LD to document.head
 * on mount, next to the block the prerenderer already wrote, so a rendered page
 * declared two Organization nodes. Without a shared @id, Google has no way to
 * know they are the same entity and treats them as two, which is exactly how
 * organization-level signals get split.
 *
 * Returned as a @graph node: no @context, because the prerenderer nests it in
 * one. Callers that emit it standalone spread @context in themselves.
 *
 * Deliberately imports only site.js and market.js. Both are already in the
 * eager bundle, so the React side pays nothing new to share this — importing
 * render.js instead would drag src/seo/comparisons.js into every page load.
 */

import { SITE_NAME, SITE_URL } from './site.js';
import { MARKET_TOTALS } from './market.js';

/** Where the organization is described, so every reference resolves to one node. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * The catalog figures are counted from the market snapshot rather than
 * asserted. The copy this replaced claimed "40+ providers" while the snapshot
 * holds 35 with an active plan, so the one org-level fact the site repeated
 * everywhere was one it could not support.
 *
 * The savings figure is a product decision, kept deliberately and reviewed on
 * 2026-08-14. It is not derived from anything in this repo: the site holds plan
 * rates, not customer bills, so nothing here can confirm or refute it. Two
 * things follow. It is phrased "up to", which is a ceiling rather than the
 * average the About page states. And because the Organization entity is now
 * declared once and shared, this description reaches the structured data of
 * every prerendered page, where before the claim sat only in the React
 * component used by /landing — so if the figure is ever retired, this is the
 * line that retires it everywhere.
 *
 * Still no aggregateRating: no provider record carries a rating, and a
 * self-serving invented one breaches Google's structured data policy outright.
 * A savings claim in a description is ordinary marketing copy; a fabricated
 * rating in a rating field is a policy violation. They are not the same call.
 */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/images/logo-header.png`,
      width: 200,
      height: 60,
    },
    description:
      `Electric Scouts is a free, independent electricity comparison platform tracking ` +
      `${MARKET_TOTALS.activePlans} electricity plans from ${MARKET_TOTALS.providersWithPlans} ` +
      `suppliers across ${MARKET_TOTALS.states} deregulated US states.`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@electricscouts.com',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://facebook.com/electricscouts',
      'https://x.com/electricscouts',
      'https://linkedin.com/company/electricscouts',
      'https://instagram.com/electricscouts',
    ],
  };
}

/** The same node emitted on its own, for callers outside the prerendered @graph. */
export function standaloneOrganizationSchema() {
  return { '@context': 'https://schema.org', ...organizationSchema() };
}
