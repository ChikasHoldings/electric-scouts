/**
 * Provider slug utilities
 * Generates URL-friendly slugs from provider names and maps to local logo paths.
 */

/**
 * Generate a URL-friendly slug from a provider name.
 * e.g., "TXU Energy" → "txu-energy"
 *       "Green Mountain Energy" → "green-mountain-energy"
 *       "APG&E" → "apge"
 */
export function generateProviderSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get the local logo path for a provider.
 * Falls back to the database logo_url if no local logo exists.
 */
const LOCAL_LOGO_MAP = {
  'txu-energy': '/images/providers/txu-energy.png',
  'reliant-energy': '/images/providers/reliant-energy.png',
  'green-mountain-energy': '/images/providers/green-mountain-energy.png',
  'frontier-utilities': '/images/providers/frontier-utilities.png',
  'direct-energy': '/images/providers/direct-energy.png',
  'constellation-energy': '/images/providers/constellation-energy.png',
  'champion-energy': '/images/providers/champion-energy.png',
  'ambit-energy': '/images/providers/ambit-energy.png',
};

export function getProviderLogoUrl(provider) {
  const slug = generateProviderSlug(provider.name);
  return LOCAL_LOGO_MAP[slug] || provider.logo_url || null;
}

/**
 * Get the provider detail page URL using slug.
 */
export function getProviderPageUrl(providerName) {
  const slug = generateProviderSlug(providerName);
  return `/providers/${slug}`;
}
