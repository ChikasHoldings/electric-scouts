/**
 * cityUrls.js
 * 
 * Utility functions for generating clean, SEO-friendly city page URLs.
 * Converts city/state pairs to slugified paths like /electricity-rates/texas/houston
 */

// State code to full name mapping
export const STATE_NAMES = {
  TX: 'texas', IL: 'illinois', OH: 'ohio', PA: 'pennsylvania',
  NY: 'new-york', NJ: 'new-jersey', MD: 'maryland', MA: 'massachusetts',
  ME: 'maine', NH: 'new-hampshire', RI: 'rhode-island', CT: 'connecticut'
};

// Reverse mapping: slug to state code
export const STATE_CODES = {
  'texas': 'TX', 'illinois': 'IL', 'ohio': 'OH', 'pennsylvania': 'PA',
  'new-york': 'NY', 'new-jersey': 'NJ', 'maryland': 'MD', 'massachusetts': 'MA',
  'maine': 'ME', 'new-hampshire': 'NH', 'rhode-island': 'RI', 'connecticut': 'CT'
};

// State code to full display name
export const STATE_DISPLAY_NAMES = {
  TX: 'Texas', IL: 'Illinois', OH: 'Ohio', PA: 'Pennsylvania',
  NY: 'New York', NJ: 'New Jersey', MD: 'Maryland', MA: 'Massachusetts',
  ME: 'Maine', NH: 'New Hampshire', RI: 'Rhode Island', CT: 'Connecticut'
};

/**
 * Convert a city name to a URL slug
 * "New York City" → "new-york-city"
 * "Corpus Christi" → "corpus-christi"
 * "El Paso" → "el-paso"
 */
export function cityToSlug(cityName) {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Convert a city slug back to display name
 * "new-york-city" → "New York City"
 * "corpus-christi" → "Corpus Christi"
 */
export function slugToCity(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate clean city page URL
 * ("Houston", "TX") → "/electricity-rates/texas/houston"
 */
export function getCityUrl(cityName, stateCode) {
  const stateSlug = STATE_NAMES[stateCode];
  if (!stateSlug) return `/city-rates?city=${encodeURIComponent(cityName)}&state=${stateCode}`;
  const citySlug = cityToSlug(cityName);
  return `/electricity-rates/${stateSlug}/${citySlug}`;
}

/**
 * Parse city URL params from clean URL
 * Returns { city: "Houston", stateCode: "TX", stateSlug: "texas" }
 */
export function parseCityUrl(stateSlug, citySlug) {
  const stateCode = STATE_CODES[stateSlug];
  const cityName = slugToCity(citySlug);
  return { city: cityName, stateCode, stateSlug };
}

/**
 * Generate article URL from slug or ID
 * "understanding-deregulated-markets" → "/learn/understanding-deregulated-markets"
 */
export function getArticleUrl(slugOrId) {
  return `/learn/${slugOrId}`;
}

/**
 * State code to state page URL mapping
 * "TX" → "/texas-electricity"
 */
const STATE_PAGE_URLS = {
  TX: '/texas-electricity', IL: '/illinois-electricity', OH: '/ohio-electricity',
  PA: '/pennsylvania-electricity', NY: '/new-york-electricity', NJ: '/new-jersey-electricity',
  MD: '/maryland-electricity', MA: '/massachusetts-electricity', ME: '/maine-electricity',
  NH: '/new-hampshire-electricity', RI: '/rhode-island-electricity', CT: '/connecticut-electricity'
};

export function getStatePageUrl(stateCode) {
  return STATE_PAGE_URLS[stateCode] || '/all-states';
}
