/**
 * market.js
 *
 * Read access to src/seo/market-data.json — the snapshot of what Electric
 * Scouts actually tracks, produced by scripts/refresh-seo-data.mjs.
 *
 * Everything a prerendered page says about a market has to come through here.
 * The rule the whole SEO effort hangs on: if a number is not in this snapshot,
 * the page does not claim it. That is what keeps 144 city pages from being 144
 * copies of the same paragraph with a name swapped — and what keeps them from
 * being 144 copies with an *invented* number swapped, which would be worse.
 *
 * Plain ESM with a JSON import so Node scripts, Vercel functions and the Vite
 * bundle all read the same file.
 */

import marketData from './market-data.json' with { type: 'json' };
import { STATE_NAMES } from './locations.js';

export const MARKET_GENERATED_AT = marketData.generatedAt;
export const MARKET_TOTALS = marketData.totals;

/** Aggregate plan facts for one state, or null when we track nothing there. */
export function getStateMarket(stateCode) {
  return marketData.states[stateCode] || null;
}

export function getAllStateMarkets() {
  return marketData.states;
}

/** Every provider row in the snapshot, including inactive ones. */
export function getAllProviders() {
  return marketData.providers;
}

/**
 * Providers that earn a detail page: marked active (the flag ProviderDetails
 * filters on, so anything else renders a "Provider Not Found" shell) AND
 * carrying at least one plan (a profile with no plans is an empty page).
 */
export function getPublishableProviders() {
  return marketData.providers.filter((provider) => provider.isActive && provider.plans > 0);
}

export function getProviderBySlug(slug) {
  return marketData.providers.find((provider) => provider.slug === slug) || null;
}

/** Provider names with at least one tracked plan in a state, alphabetical. */
export function providersInState(stateCode) {
  const market = getStateMarket(stateCode);
  return market ? market.providerNames || [] : [];
}

/** States where a provider has tracked plans, as {code, name, path} records. */
export function providerStateLinks(provider, statePaths) {
  return (provider.planStates || [])
    .filter((code) => STATE_NAMES[code])
    .map((code) => ({ code, name: STATE_NAMES[code], path: statePaths[code] }));
}

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

/** 9.8 -> "9.8¢/kWh". Returns null for missing values so callers can omit. */
export function formatRate(rate) {
  if (rate === null || rate === undefined || !Number.isFinite(Number(rate))) return null;
  return `${Number(rate)}¢/kWh`;
}

/** "8.9¢/kWh" -> 8.9. Used to compare city averages against state figures. */
export function parseRate(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/([\d.]+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

/** [12, 24] -> "12 or 24 months"; [3, 12, 24] -> "3, 12 or 24 months". */
export function formatTerms(terms) {
  const list = (terms || []).filter((term) => term > 0);
  if (!list.length) return null;
  if (list.length === 1) return `${list[0]} months`;
  const head = list.slice(0, -1).join(', ');
  return `${head} or ${list[list.length - 1]} months`;
}

/** "a", "b", "c" -> "a, b and c" */
export function joinNames(names, max = names.length) {
  const list = names.slice(0, max);
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/**
 * Where a city's average rate sits against the state median, as a phrase the
 * page can state as fact. Returns null when either figure is missing rather
 * than guessing — this is the sentence most at risk of becoming a fabrication.
 */
export function compareToStateMedian(cityRate, stateMedian) {
  const city = parseRate(cityRate);
  const median = parseRate(stateMedian);
  if (city === null || median === null) return null;
  const difference = Math.round((city - median) * 100) / 100;
  const magnitude = Math.abs(difference);
  if (magnitude < 0.25) {
    return { direction: 'at', difference: 0, text: 'in line with the statewide median' };
  }
  return {
    direction: difference < 0 ? 'below' : 'above',
    difference: magnitude,
    text: `${magnitude}¢/kWh ${difference < 0 ? 'below' : 'above'} the statewide median`,
  };
}

export default marketData;

/**
 * Platform-wide commercial totals.
 *
 * Summed from the same per-state snapshot every other page reads, so the
 * business hub cannot claim a number the catalog does not support. The stats
 * it replaced ("5,000+ Businesses Served", "24/7 Support Available") were not
 * derived from anything and were not true.
 */
export function getCommercialTotals() {
  const states = Object.values(marketData.states || {});
  const entryRates = states
    .map((s) => s.minBusinessRate)
    .filter((r) => typeof r === 'number' && r > 0);

  return {
    commercialPlans: states.reduce((sum, s) => sum + (s.businessPlans || 0), 0),
    suppliers: marketData.totals.providersWithPlans,
    states: marketData.totals.states,
    // The range of the cheapest commercial plan we list in each state. Not a
    // promise about any given business — commercial supply is bid against a
    // load profile — but it is a real figure from the catalog, which
    // "$12,000/year average savings" was not.
    lowestEntryRate: entryRates.length ? Math.min(...entryRates) : null,
    highestEntryRate: entryRates.length ? Math.max(...entryRates) : null,
  };
}
