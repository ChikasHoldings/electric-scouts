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
import { LOCATION_DATA } from '../components/location/locationData.js';
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

/**
 * Cities where a household cannot actually buy from a competing retailer.
 *
 * Every page on this site is built on the premise that the reader can choose
 * their supplier. For these cities that premise is false: they are served by a
 * municipally owned utility or sit outside the competitive market entirely, and
 * no retailer sells supply to those meters at all. The pages were nonetheless
 * telling residents they "can choose from competing providers" and offering
 * them the statewide plan count — a promise the reader cannot act on, which is
 * the worst thing a comparison site can publish and a reliable way to teach a
 * search engine that the page does not answer its query.
 *
 * `reason` is what the page says instead. It has to be specific: "you cannot
 * switch" is useless, "CPS Energy is municipally owned and sets its own rates,
 * so there is nothing to compare" is an answer.
 *
 * ONLY listed where the fact is not in reasonable dispute. A city whose
 * territory is genuinely split — part competitive, part cooperative, with the
 * boundary running through shared ZIP codes — is deliberately NOT listed here,
 * because a single city-level answer would be wrong for one side of it. Those
 * need an address-level lookup, not a label.
 */
export const NO_RETAIL_CHOICE = {
  'Austin-TX': {
    utility: 'Austin Energy',
    shortName: 'Austin Energy',
    kind: 'municipal',
    reason:
      'Austin Energy is owned by the city and is the only supplier of electricity in its ' +
      'service area. It sets its own rates through the city council rather than competing ' +
      'for customers, so there is no supplier to switch to and no rate to shop.',
  },
  'San Antonio-TX': {
    utility: 'CPS Energy',
    shortName: 'CPS Energy',
    kind: 'municipal',
    reason:
      'CPS Energy is owned by the City of San Antonio and is the only electricity supplier ' +
      'in its service area. Its rates are set by the city rather than by competition, so ' +
      'there are no competing offers to compare.',
  },
  'Denton-TX': {
    utility: 'Denton Municipal Electric',
    shortName: 'Denton Municipal Electric',
    kind: 'municipal',
    reason:
      'Denton Municipal Electric is owned by the city and serves the whole of it. Retail ' +
      'choice in Texas applies to areas served by a competitive delivery utility, and ' +
      'Denton is not one of them.',
  },
  'Brownsville-TX': {
    utility: 'Brownsville Public Utilities Board',
    shortName: 'Brownsville PUB',
    kind: 'municipal',
    reason:
      'Brownsville Public Utilities Board is owned by the city and supplies electricity to ' +
      'the whole service area. There is no competing retailer to buy from.',
  },
  'El Paso-TX': {
    utility: 'El Paso Electric',
    shortName: 'El Paso Electric',
    kind: 'regulated',
    reason:
      'El Paso sits outside the ERCOT grid and outside the competitive market Texas opened ' +
      'in 2002. El Paso Electric is a regulated utility that both delivers and sells the ' +
      'power, with rates approved by regulators rather than set by competition.',
  },
  'Amarillo-TX': {
    utility: 'Xcel Energy (Southwestern Public Service)',
    shortName: 'Xcel Energy',
    kind: 'regulated',
    reason:
      'Amarillo is served by Southwestern Public Service, part of Xcel Energy, on a grid ' +
      'outside ERCOT. Retail choice was never opened here, so the utility both delivers ' +
      'and sells the electricity at regulated rates.',
  },
  'Beaumont-TX': {
    utility: 'Entergy Texas',
    shortName: 'Entergy Texas',
    kind: 'regulated',
    reason:
      'Beaumont is in Entergy Texas territory, which sits outside ERCOT and outside the ' +
      'competitive market. Entergy both delivers and sells the power at regulated rates.',
  },
  'Naperville-IL': {
    utility: 'Naperville Electric Utility',
    shortName: 'Naperville Electric',
    kind: 'municipal',
    reason:
      'Naperville runs its own electric utility and buys power wholesale on behalf of the ' +
      'whole city. Illinois retail choice applies in the territories of the investor-owned ' +
      'utilities, not here, so there is no competing supplier to switch to.',
  },
  'Springfield-IL': {
    utility: 'City Water, Light & Power',
    shortName: 'CWLP',
    kind: 'municipal',
    reason:
      'Springfield is served by City Water, Light & Power, which the city owns and operates. ' +
      'It generates and sells the electricity itself at rates set locally, so the supplier ' +
      'choice available elsewhere in Illinois does not apply here.',
  },
  'Hamilton-OH': {
    utility: 'City of Hamilton Electric',
    shortName: 'Hamilton Electric',
    kind: 'municipal',
    reason:
      'Hamilton owns and runs its own electric utility, which supplies the city directly. ' +
      'Ohio retail choice applies in the investor-owned utility territories, so a Hamilton ' +
      'address has no competing supplier to shop.',
  },
};

/** True where a household at this address cannot choose a competing supplier. */
export function retailChoiceStatus(cityName, stateCode) {
  return NO_RETAIL_CHOICE[`${cityName}-${stateCode}`] || null;
}

/**
 * Strip a supplier or provider count out of a city's hand-written blurb.
 *
 * 21 of these blurbs opened the page with a number nothing on this site
 * supports — "a choice of over 40 retail electricity providers" for Corpus
 * Christi — and the very next sentence, built from the plan snapshot, said 22
 * suppliers. Two contradictory counts in consecutive sentences, the invented
 * one first. The rest of the blurb is fine, so the sentence carrying the claim
 * is dropped rather than the whole thing, which is the same rule
 * withoutUnsupportedClaims() already applies to the local notes.
 */
const COUNT_CLAIM =
  /\b(?:over|more than|nearly|up to|around|about)?\s*\d+\+?\s+(?:[a-z-]+\s+){0,3}(?:providers?|suppliers?|retailers?|reps)\b/i;

export function withoutProviderCounts(description) {
  if (!description) return description;
  const kept = String(description)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !COUNT_CLAIM.test(sentence))
    .join(' ')
    .trim();
  return kept || null;
}

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
        // The blurb, minus any invented supplier count. See withoutProviderCounts.
        description: withoutProviderCounts(value.description),
        zipCodes: Array.isArray(value.zipCodes) ? value.zipCodes : [],
        // Six named districts per city, and the only field in this table that
        // is unique to the city rather than shared with its state. It was being
        // dropped here, so the sentence in content.js that lists them read
        // `undefined` and never rendered — on all 144 pages.
        neighborhoods: Array.isArray(value.neighborhoods) ? value.neighborhoods : [],
        // Every one of the 144 cities has a photograph, and none of them
        // reached the crawlable HTML: the prerendered pages carried no <img>
        // at all, so nothing on this site was eligible for image search and
        // no page could offer Google a primary image.
        image: value.image || null,
        // The company that delivers the power here. It is the most
        // city-specific fact we hold after the rate itself, and the one a
        // reader recognises from their bill.
        utilityCompany: LOCATION_DATA[value.stateCode]?.cities?.[name]?.utilityCompany || null,
        // Null for a normal competitive city; an object explaining why not,
        // where a household here cannot buy from a competing retailer at all.
        noRetailChoice: retailChoiceStatus(name, value.stateCode),
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
