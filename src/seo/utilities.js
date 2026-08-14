/**
 * utilities.js
 *
 * Pages for the wires company — the utility that delivers your power, as
 * opposed to the supplier that sells it.
 *
 * WHY THESE EXIST
 *
 * "Oncor electricity rates" and "Eversource rates" are typed constantly, and
 * almost everyone typing them has the model backwards. They believe the utility
 * on the bill sets the price. In a deregulated market it does not: it delivers
 * the power, reads the meter and restores it after a storm, and its charges are
 * regulated and identical no matter who you buy supply from. The part you can
 * change — and the only part this site can help with — is the supply rate, set
 * by a competing retailer.
 *
 * So the job of one of these pages is to answer the question actually being
 * asked ("what will I pay in this territory") by first correcting the premise
 * underneath it. Nothing else on the site does that, and the state and city
 * pages are the wrong place for it: they are organised by where you live, not
 * by the company that owns the poles.
 *
 * WHAT KEEPS THIS FROM BECOMING A DIRECTORY OF STUBS
 *
 * The utility is only published when we already cover at least MIN_CITIES of
 * the cities in its territory. Below that the page has nothing to say that its
 * state page does not say better, and a page whose only content is "this
 * utility serves one city we cover" is the thin, templated result this site
 * keeps refusing to publish. 35 utilities appear in our city data; 11 clear the
 * bar. The rest are served by their state and city pages.
 *
 * Every figure comes from data already published elsewhere on the site — the
 * cities we cover and their rates, the plan snapshot for the states involved.
 * Nothing here is a delivery charge or a tariff number, because we do not hold
 * those and will not estimate them.
 */

import { LOCATION_DATA } from '../components/location/locationData.js';
import { getCities } from './locations.js';
import { STATE_NAMES, STATE_PAGE_PATHS } from './locations.js';
import { getStateMarket, parseRate } from './market.js';
import { canonicalPath } from './site.js';

/** Below this many covered cities, the state page serves the reader better. */
const MIN_CITIES = 3;

export const UTILITY_ROOT = '/utilities';

/**
 * Hand-written notes, one per publishable utility.
 *
 * `note` opens the page, so no two read alike — the same rule the supplier
 * matchups follow. `also` names the trading name a reader may be looking for
 * when it differs from the name in our city data.
 *
 * Deliberately descriptive rather than numeric. We hold no delivery tariffs, so
 * these say what a utility is and where it operates, and leave every price on
 * the page to come from the plan snapshot.
 */
const UTILITY_NOTES = {
  'Eversource': {
    shortName: 'Eversource',
    model: 'default-service',
    note:
      'The largest delivery utility in New England, and the reason a single company appears on bills in three states with three different sets of rules. What it charges to deliver power is set by each state regulator; what you pay for the power itself is not its decision at all.',
  },
  'Oncor Electric Delivery': {
    shortName: 'Oncor',
    model: 'texas',
    note:
      'The wires company for most of North Texas, including Dallas and Fort Worth. Texans switch supplier more readily than anyone in the country, and Oncor is the reason it changes nothing physical when they do — the same poles, the same meter, the same crews after a storm.',
  },
  'ComEd': {
    shortName: 'ComEd',
    model: 'aggregation',
    also: 'Commonwealth Edison',
    note:
      'Northern Illinois runs on ComEd wires, and Illinois lets you buy the supply portion from a competing retailer or leave it with ComEd at the regulated default. Both arrive on one ComEd bill, which is why the choice is easy to miss.',
  },
  'National Grid': {
    shortName: 'National Grid',
    model: 'default-service',
    note:
      'A delivery utility across upstate New York and central Massachusetts, operating under two different state frameworks. Its basic service rate resets on a fixed schedule, and that reset is what sends people looking for a supplier in the first place.',
  },
  'Rhode Island Energy': {
    shortName: 'Rhode Island Energy',
    model: 'default-service',
    note:
      "Rhode Island's delivery utility, and recently renamed, which is why older bills and search results still say National Grid. The company changed hands; the wires, the meters and the right to choose your supplier did not.",
  },
  'Central Maine Power': {
    shortName: 'CMP',
    model: 'default-service',
    also: 'CMP',
    note:
      'Maine\'s largest delivery utility. Its standard offer — the default supply rate for anyone who has not chosen a retailer — is set annually by the state, which makes Maine one of the clearest markets in the country for judging whether a competitive offer is worth taking.',
  },
  'PSE&G': {
    shortName: 'PSE&G',
    model: 'default-service',
    also: 'Public Service Electric and Gas',
    note:
      'The delivery utility for most of the densely populated north and centre of New Jersey. Its Basic Generation Service is the price to beat: it is what you pay for supply if you never choose a retailer, and it is reset every year.',
  },
  'PPL Electric': {
    shortName: 'PPL',
    model: 'default-service',
    also: 'PPL Electric Utilities',
    note:
      'Delivers power across eastern and central Pennsylvania. Pennsylvania publishes its default supply rate — the "price to compare" — precisely so households can hold a competitive offer against it, which makes this one of the least murky markets we cover.',
  },
  'Ameren Illinois': {
    shortName: 'Ameren Illinois',
    model: 'aggregation',
    note:
      'The delivery utility for central and southern Illinois, covering the parts of the state ComEd does not. The choice available to its customers is the same one ComEd customers have, though it is far less often marketed to them.',
  },
  'BGE': {
    shortName: 'BGE',
    model: 'default-service',
    also: 'Baltimore Gas and Electric',
    note:
      "Maryland's oldest utility, delivering to Baltimore and the surrounding counties. Maryland separates delivery from supply on the bill itself, so a BGE customer can see exactly which half of the bill a supplier can change.",
  },
  'Ohio Edison': {
    shortName: 'Ohio Edison',
    model: 'aggregation',
    note:
      'Serves north-eastern Ohio as one of the FirstEnergy delivery companies. Ohio has run competitive supply since 2001, and its aggregation programmes mean many households were switched to a retailer by their own town rather than by their own choice.',
  },
};

/** "Oncor Electric Delivery" -> "oncor-electric-delivery" */
export function utilitySlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Every publishable utility, built by grouping the cities we already cover.
 *
 * A utility named in our city data but covering fewer than MIN_CITIES of those
 * cities is dropped here, which means it also leaves the sitemap and the
 * prerender — the same rule the comparison registry follows, for the same
 * reason.
 */
export function getUtilities() {
  const grouped = new Map();

  for (const city of getCities()) {
    const name = LOCATION_DATA[city.stateCode]?.cities?.[city.name]?.utilityCompany;
    // Shared-territory labels ("Austin Energy / Oncor") describe a city split
    // between a municipal utility and a deregulated one. Which half a given
    // address falls in is a ZIP-code question we cannot answer on a static
    // page, so these are left out rather than guessed at.
    if (!name || name.includes('/')) continue;
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(city);
  }

  return [...grouped.entries()]
    .filter(([name, cities]) => cities.length >= MIN_CITIES && UTILITY_NOTES[name])
    .map(([name, cities]) => {
      const stateCodes = [...new Set(cities.map((city) => city.stateCode))].sort();
      const rates = cities
        .map((city) => parseRate(city.avgRate))
        .filter((rate) => rate != null)
        .sort((a, b) => a - b);

      const markets = stateCodes
        .map((code) => ({ code, name: STATE_NAMES[code], path: STATE_PAGE_PATHS[code], market: getStateMarket(code) }))
        .filter((entry) => entry.market);

      return {
        name,
        ...UTILITY_NOTES[name],
        shortName: UTILITY_NOTES[name].shortName || name,
        slug: utilitySlug(name),
        path: canonicalPath(`${UTILITY_ROOT}/${utilitySlug(name)}`),
        cities: cities.sort((a, b) => (parseRate(a.avgRate) ?? 0) - (parseRate(b.avgRate) ?? 0)),
        stateCodes,
        states: markets,
        lowestCityRate: rates[0] ?? null,
        highestCityRate: rates[rates.length - 1] ?? null,
        // A utility spanning states is a different page from one that does not:
        // the rules, the default supply rate and the regulator all change at the
        // border, and the copy says so rather than flattening it.
        multiState: stateCodes.length > 1,
      };
    })
    .sort((a, b) => b.cities.length - a.cities.length);
}

export function getUtilityBySlug(slug) {
  return getUtilities().find((utility) => utility.slug === slug) || null;
}

/** Utilities we publish that deliver in a state — for links on its state page. */
export function utilitiesForState(stateCode) {
  return getUtilities().filter((utility) => utility.stateCodes.includes(stateCode));
}

/** The utility page a city belongs to, or null when it is not published. */
export function utilityForCity(city) {
  const name = LOCATION_DATA[city.stateCode]?.cities?.[city.name]?.utilityCompany;
  if (!name || name.includes('/')) return null;
  return getUtilities().find((utility) => utility.name === name) || null;
}

export const UTILITY_HUB = {
  path: canonicalPath(UTILITY_ROOT),
  title: 'Electricity Utilities by Territory | Electric Scouts',
  heading: 'Electricity Utilities and What They Actually Charge For',
  description:
    'The utility delivers your power; a supplier sets the rate. What your delivery company controls, what it does not, and who you can buy from instead.',
};
