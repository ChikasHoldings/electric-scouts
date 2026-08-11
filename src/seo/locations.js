/**
 * locations.js
 *
 * Canonical list of the location pages that exist as real, content-bearing
 * routes. Everything here is DERIVED from src/data/cityRatesData.js — the same
 * data the CityRates page renders — so the sitemap, the prerenderer and the
 * running app can never disagree about which city pages exist.
 */

// Relative paths with explicit extensions: this module is imported by Node
// build scripts and Vercel functions as well as by the Vite browser bundle.
import { cityData } from '../data/cityRatesData.js';
import { canonicalPath } from './site.js';

/** State code -> URL slug used in /electricity-rates/:stateSlug/:citySlug */
export const STATE_SLUGS = {
  TX: 'texas', IL: 'illinois', OH: 'ohio', PA: 'pennsylvania',
  NY: 'new-york', NJ: 'new-jersey', MD: 'maryland', MA: 'massachusetts',
  ME: 'maine', NH: 'new-hampshire', RI: 'rhode-island', CT: 'connecticut',
};

/** State code -> display name */
export const STATE_NAMES = {
  TX: 'Texas', IL: 'Illinois', OH: 'Ohio', PA: 'Pennsylvania',
  NY: 'New York', NJ: 'New Jersey', MD: 'Maryland', MA: 'Massachusetts',
  ME: 'Maine', NH: 'New Hampshire', RI: 'Rhode Island', CT: 'Connecticut',
};

/** State code -> its dedicated state landing page */
export const STATE_PAGE_PATHS = Object.fromEntries(
  Object.entries(STATE_SLUGS).map(([code, slug]) => [code, `/${slug}-electricity`])
);

export const STATE_CODES = Object.keys(STATE_SLUGS);

/** "New York City" -> "new-york-city" (mirrors utils/cityUrls.cityToSlug) */
export function cityToSlug(cityName) {
  return String(cityName)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function cityPath(cityName, stateCode) {
  return canonicalPath(`/electricity-rates/${STATE_SLUGS[stateCode]}/${cityToSlug(cityName)}`);
}

/**
 * Every city that has real data behind it, derived from the "City-ST" keys of
 * cityData. Bare "City" aliases in that map are legacy lookup fallbacks and are
 * intentionally ignored — they are not routes.
 */
export function getCities() {
  return Object.entries(cityData)
    .filter(([key, value]) => /-[A-Z]{2}$/.test(key) && STATE_SLUGS[value.stateCode])
    .map(([key, value]) => {
      const name = key.slice(0, key.lastIndexOf('-'));
      return {
        name,
        stateCode: value.stateCode,
        stateName: value.state || STATE_NAMES[value.stateCode],
        county: value.county,
        population: value.population,
        avgRate: value.avgRate,
        avgMonthlyBill: value.avgMonthlyBill,
        providers: value.providers,
        description: value.description,
        zipCodes: Array.isArray(value.zipCodes) ? value.zipCodes : [],
        path: cityPath(name, value.stateCode),
        statePath: STATE_PAGE_PATHS[value.stateCode],
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Cities belonging to one state, used for state -> city internal linking. */
export function getCitiesByState(stateCode) {
  return getCities().filter((city) => city.stateCode === stateCode);
}

export function getStates() {
  return STATE_CODES.map((code) => ({
    code,
    name: STATE_NAMES[code],
    slug: STATE_SLUGS[code],
    path: STATE_PAGE_PATHS[code],
    cities: getCitiesByState(code),
  })).sort((a, b) => a.name.localeCompare(b.name));
}
