/**
 * figures.js
 *
 * Named figures about the catalogue, each computed from the committed market
 * snapshot, for prose that wants to cite one.
 *
 * WHY THIS EXISTS AS A LOOKUP RATHER THAN INLINE ARITHMETIC
 *
 * The editorial sections in content.js want to say things like "of the 372
 * plans we track, 214 are fixed". Written inline, each of those is a place
 * where a number can be typed once and then quietly stop being true when the
 * snapshot is refreshed. Written as a token the prose resolves at build time,
 * the sentence cannot go stale and cannot disagree with the table above it.
 *
 * THE RULE THAT MAKES THIS SAFE
 *
 * `resolveFigures()` drops any sentence still containing an unresolved token
 * rather than publishing "{FIXED_PLANS}" or, worse, quietly rendering
 * "undefined". A figure that cannot be computed is a sentence that does not
 * appear. That is deliberate: this site's whole editorial standard is that a
 * number either comes from the snapshot or is omitted, and the same standard
 * has to survive a typo in a placeholder name.
 */

import marketData from './market-data.json' with { type: 'json' };
import { MARKET_GENERATED_AT, formatRate, formatTerms } from './market.js';
import { STATE_NAMES } from './locations.js';

const states = Object.entries(marketData.states || {}).map(([code, market]) => ({
  code,
  name: STATE_NAMES[code] || code,
  ...market,
}));
const providers = (marketData.providers || []).filter((p) => p.isActive && p.plans > 0);

const sum = (list, pick) => list.reduce((total, entry) => total + (Number(pick(entry)) || 0), 0);
const nums = (list, pick) => list.map(pick).filter((value) => typeof value === 'number');
const lowest = (list, pick) => list.filter((e) => typeof pick(e) === 'number')
  .sort((a, b) => pick(a) - pick(b))[0];
const highest = (list, pick) => list.filter((e) => typeof pick(e) === 'number')
  .sort((a, b) => pick(b) - pick(a))[0];

const allTerms = [...new Set(states.flatMap((s) => s.terms || []))].sort((a, b) => a - b);
const widestTerms = states
  .filter((s) => (s.terms || []).length > 1)
  .sort((a, b) => (Math.max(...b.terms) - Math.min(...b.terms)) - (Math.max(...a.terms) - Math.min(...a.terms)))[0];
const singleTerm = states.find((s) => (s.terms || []).length === 1);
const cheapestMedian = lowest(states, (s) => s.medianRate);
const dearestMedian = highest(states, (s) => s.medianRate);
const cheapestRenewable = lowest(states, (s) => s.minRenewableRate);
const dearestRenewable = highest(states, (s) => s.minRenewableRate);

/** Per-state gap between the cheapest renewable plan and the cheapest plan. */
const renewablePremiums = states
  .filter((s) => typeof s.minRenewableRate === 'number' && typeof s.minRate === 'number')
  .map((s) => ({ state: s, premium: Number((s.minRenewableRate - s.minRate).toFixed(2)) }));
const widestPremium = [...renewablePremiums].sort((a, b) => b.premium - a.premium)[0];

/**
 * Every figure the editorial sections may cite, keyed by the token they use.
 * A value of null or undefined means "not computable", which drops the
 * sentence rather than publishing a blank.
 */
export const FIGURES = {
  // Scale
  STATE_COUNT: states.length,
  COVERED_COUNT: states.length,
  CITY_COUNT: null, // set by withCityCount() — locations.js would be a cycle
  UTILITY_COUNT: null, // set by withUtilityCount() — utilities.js imports this
  TOTAL_PLANS: marketData.totals?.activePlans,
  PLAN_COUNT: marketData.totals?.activePlans,
  TOTAL_SUPPLIERS: marketData.totals?.providersWithPlans,
  SUPPLIER_COUNT: marketData.totals?.providersWithPlans,
  SUPPLIERS_WITH_PLANS: marketData.totals?.providersWithPlans,
  AS_OF: `as of ${MARKET_GENERATED_AT}`,
  SNAPSHOT_DATE: MARKET_GENERATED_AT,
  MARKET_GENERATED_AT,

  // Plan mix
  RESIDENTIAL_PLAN_COUNT: sum(states, (s) => s.residentialPlans),
  BUSINESS_PLAN_COUNT: sum(states, (s) => s.businessPlans),
  COMMERCIAL_PLANS: sum(states, (s) => s.businessPlans),
  COMMERCIAL_STATES: states.filter((s) => s.businessPlans > 0).length,
  RENEWABLE_PLANS: sum(states, (s) => s.renewablePlans),
  RENEWABLE_PLAN_COUNT: sum(states, (s) => s.renewablePlans),
  FIXED: sum(states, (s) => s.fixedPlans),
  FIXED_PLANS: sum(states, (s) => s.fixedPlans),
  FIXED_COUNT: sum(states, (s) => s.fixedPlans),
  FIXED_PLAN_COUNT: sum(states, (s) => s.fixedPlans),
  VARIABLE: sum(states, (s) => s.variablePlans),
  VARIABLE_PLANS: sum(states, (s) => s.variablePlans),
  VARIABLE_COUNT: sum(states, (s) => s.variablePlans),
  VARIABLE_PLAN_COUNT: sum(states, (s) => s.variablePlans),
  NO_ETF_COUNT: sum(states, (s) => s.noEtfPlans),
  NO_ETF_PLANS: sum(states, (s) => s.noEtfPlans),
  NO_ETF_TOTAL: sum(states, (s) => s.noEtfPlans),

  // Rates
  MIN_RATE: formatRate(Math.min(...nums(states, (s) => s.minRate))),
  RATE_MIN: formatRate(Math.min(...nums(states, (s) => s.minRate))),
  ENTRY_RATE_LOW: formatRate(Math.min(...nums(states, (s) => s.minRate))),
  LOWEST_ENTRY_RATE: formatRate(Math.min(...nums(states, (s) => s.minRate))),
  MAX_RATE: formatRate(Math.max(...nums(states, (s) => s.maxRate))),
  RATE_MAX: formatRate(Math.max(...nums(states, (s) => s.maxRate))),
  ENTRY_RATE_HIGH: formatRate(Math.max(...nums(states, (s) => s.maxRate))),
  HIGHEST_ENTRY_RATE: formatRate(Math.max(...nums(states, (s) => s.maxRate))),
  LOWEST_MEDIAN: cheapestMedian ? formatRate(cheapestMedian.medianRate) : null,
  LOWEST_MEDIAN_STATE: cheapestMedian ? cheapestMedian.name : null,
  HIGHEST_MEDIAN: dearestMedian ? formatRate(dearestMedian.medianRate) : null,
  HIGHEST_MEDIAN_STATE: dearestMedian ? dearestMedian.name : null,

  // Terms
  TERM_MIN: allTerms.length ? allTerms[0] : null,
  MIN_TERM: allTerms.length ? allTerms[0] : null,
  TERM_MAX: allTerms.length ? allTerms[allTerms.length - 1] : null,
  MAX_TERM: allTerms.length ? allTerms[allTerms.length - 1] : null,
  WIDEST_TERM_STATE: widestTerms ? widestTerms.name : null,
  WIDEST_TERM_MIN: widestTerms ? Math.min(...widestTerms.terms) : null,
  WIDEST_TERM_MAX: widestTerms ? Math.max(...widestTerms.terms) : null,
  SINGLE_TERM_STATE: singleTerm ? singleTerm.name : null,
  SINGLE_TERM_LENGTH: singleTerm ? singleTerm.terms[0] : null,
  TX_TERMS: marketData.states?.TX?.terms ? formatTerms(marketData.states.TX.terms) : null,
  MTM_STATE_COUNT: states.filter((s) => s.monthToMonth).length,
  MONTH_TO_MONTH_STATES: states.filter((s) => s.monthToMonth).length,

  // Renewable
  RENEWABLE_SUPPLIER_COUNT: providers.filter((p) => p.renewablePlans > 0).length,
  PURE_RENEWABLE_SUPPLIER_COUNT: providers.filter((p) => p.plans > 0 && p.renewablePlans === p.plans).length,
  MIN_RENEWABLE_RATE: cheapestRenewable ? formatRate(cheapestRenewable.minRenewableRate) : null,
  MIN_RENEWABLE_STATE: cheapestRenewable ? cheapestRenewable.name : null,
  MAX_RENEWABLE_RATE: dearestRenewable ? formatRate(dearestRenewable.minRenewableRate) : null,
  MAX_RENEWABLE_STATE: dearestRenewable ? dearestRenewable.name : null,
  MIN_RENEWABLE_PROVIDERS: states.length ? Math.min(...nums(states, (s) => s.renewableProviders)) : null,
  MAX_RENEWABLE_PROVIDERS: states.length ? Math.max(...nums(states, (s) => s.renewableProviders)) : null,
  // The number of markets where the cheapest plan of all happens to be a
  // renewable one — the answer to "does going green cost more".
  CHEAPEST_IS_RENEWABLE_COUNT: states.filter(
    (s) => typeof s.minRate === 'number' && s.minRate === s.minRenewableRate
  ).length,
  MAX_RENEWABLE_PREMIUM: widestPremium ? formatRate(widestPremium.premium) : null,
  RENEWABLE_PREMIUM_LIST: renewablePremiums.length
    ? renewablePremiums
        .filter((entry) => entry.premium > 0)
        .sort((a, b) => b.premium - a.premium)
        .slice(0, 3)
        .map((entry) => `${entry.state.name} ${formatRate(entry.premium)}`)
        .join(', ')
    : null,

  // Suppliers
  MULTI_STATE_SUPPLIERS: providers.filter((p) => (p.planStates || []).length > 1).length,
  SINGLE_STATE_SUPPLIERS: providers.filter((p) => (p.planStates || []).length === 1).length,
  SUPPLIER_STATE_PAIRS: sum(providers, (p) => (p.planStates || []).length),
  MIN_PROVIDER_PLANS: providers.length ? Math.min(...nums(providers, (p) => p.plans)) : null,
  MAX_PROVIDER_PLANS: providers.length ? Math.max(...nums(providers, (p) => p.plans)) : null,
  FIXED_ONLY_SUPPLIERS: providers.filter((p) => p.fixedPlans > 0 && p.variablePlans === 0).length,
};

/** Late-bound counts, injected to avoid an import cycle. */
export function setDerivedCounts({ cityCount, utilityCount }) {
  if (typeof cityCount === 'number') FIGURES.CITY_COUNT = cityCount;
  if (typeof utilityCount === 'number') FIGURES.UTILITY_COUNT = utilityCount;
}

const TOKEN = /\{([A-Z_]+)\}/g;

/**
 * Substitute every {TOKEN} in a string.
 * @returns {string|null} the resolved string, or null if a token had no figure.
 */
export function resolveText(text) {
  if (typeof text !== 'string' || !text.includes('{')) return text;
  let missing = false;
  const resolved = text.replace(TOKEN, (match, key) => {
    const value = FIGURES[key];
    if (value === null || value === undefined || value === '' || Number.isNaN(value)) {
      missing = true;
      return match;
    }
    return String(value);
  });
  return missing ? null : resolved;
}

/**
 * Resolve a whole content section, dropping any part that cites a figure we
 * could not compute. A section left with no body at all is dropped entirely by
 * the renderer, which is the correct outcome: better a missing section than a
 * sentence with a hole in it.
 */
export function resolveSection(section) {
  const paragraphs = (section.paragraphs || []).map(resolveText).filter(Boolean);
  const bullets = (section.bullets || []).map(resolveText).filter(Boolean);
  const faqs = (section.faqs || [])
    .map((faq) => {
      const question = resolveText(faq.question);
      const answer = resolveText(faq.answer);
      return question && answer ? { question, answer } : null;
    })
    .filter(Boolean);
  const heading = resolveText(section.heading);
  if (!heading) return null;
  return {
    ...section,
    heading,
    ...(section.paragraphs ? { paragraphs } : {}),
    ...(section.bullets ? { bullets } : {}),
    ...(section.faqs ? { faqs } : {}),
  };
}

/** Resolve a list of sections, dropping those left with nothing to say. */
export function resolveSections(sections) {
  return (sections || [])
    .map(resolveSection)
    .filter(Boolean)
    .filter(
      (section) =>
        (section.paragraphs && section.paragraphs.length) ||
        (section.bullets && section.bullets.length) ||
        (section.faqs && section.faqs.length) ||
        section.table ||
        (section.links && section.links.length) ||
        (section.facts && section.facts.length)
    );
}
