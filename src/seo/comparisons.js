/**
 * comparisons.js
 *
 * The head-to-head ("versus") pages: /compare/:slug.
 *
 * Two kinds of page live here, and they exist for the same reason. "TXU vs
 * Reliant" and "fixed vs variable" are the questions people type when they have
 * already decided to switch and are down to the last choice. Until now the site
 * answered neither, and the footer pointed that intent at
 * /compare-rates?planType=fixed — a query-string variant of a page that already
 * self-canonicalizes, so it earned nothing and invited a crawl of parameter
 * permutations.
 *
 * WHAT KEEPS THIS FROM BECOMING A DOORWAY FARM
 *
 * 35 suppliers make 595 ordered pairs, and 300 of them share a state. Publishing
 * those would be the textbook doorway pattern: hundreds of URLs, one template, a
 * name swapped. So a supplier matchup is published only when all of these hold:
 *
 *   1. It is on the curated list below. Curation is editorial — these are
 *      matchups a real shopper faces (two brands sold into the same market,
 *      usually both well known) — and it is the reason the set is ~16 and not
 *      300.
 *   2. Both suppliers still qualify for their own detail page.
 *   3. They still overlap in at least one state. Two suppliers that never
 *      compete for the same customer are not a choice, and the page is dropped
 *      automatically rather than published as an empty comparison.
 *   4. The snapshot holds a rate for both in at least one shared state, so the
 *      central table has something in it.
 *
 * A matchup that stops qualifying disappears from the registry, the sitemap and
 * the prerender in the same build. Nothing has to be remembered by hand.
 *
 * The differences between pages are computed, not written. Every verdict, every
 * table row and every FAQ answer is derived from the two suppliers' own numbers,
 * so two pages are as similar as the suppliers are — and the regression suite
 * asserts the family's mean similarity stays below the city pages'.
 *
 * Plain ESM, no dependencies: the React pages, the prerenderer, the sitemap and
 * the tests all import this same module, so the rendered page and the crawled
 * page cannot disagree about what a comparison says.
 */

import marketData from './market-data.json' with { type: 'json' };
import { canonicalPath, DESCRIPTION_MAX, TITLE_MAX } from './site.js';
import { STATE_NAMES, STATE_PAGE_PATHS } from './locations.js';
import {
  MARKET_GENERATED_AT,
  formatRate,
  formatTerms,
  getPublishableProviders,
  getStateMarket,
  joinNames,
} from './market.js';

const asOf = `as of ${MARKET_GENERATED_AT}`;

/** Where every comparison page lives. One prefix, so the family is legible. */
export const COMPARE_ROOT = '/compare';

/* ------------------------------------------------------------------ *
 * Curated supplier matchups
 *
 * Ordered as they should read: the better-known or larger brand first, so the
 * slug matches how the question is typed ("txu vs reliant", not the reverse).
 * Each carries the angle that makes the pair worth a page — used to open the
 * page so two comparisons never start with the same sentence.
 * ------------------------------------------------------------------ */

export const PROVIDER_MATCHUPS = [
  {
    a: 'txu-energy',
    b: 'reliant-energy',
    angle:
      'Two of the longest-running retail brands in Texas, both sold into the same Oncor and CenterPoint territories, and both usually shortlisted by the same shopper.',
  },
  {
    a: 'constellation-energy',
    b: 'direct-energy',
    angle:
      'The two widest-reaching suppliers in our catalog. They compete in almost every market we cover, which makes the choice between them one of price and contract shape rather than availability.',
  },
  {
    a: 'cleanchoice-energy',
    b: 'inspire-clean-energy',
    angle:
      'Both sell 100% renewable supply and nothing else, so this is a comparison of two green-only suppliers rather than a green plan against a conventional one.',
  },
  {
    a: 'rhythm-energy',
    b: 'green-mountain-energy',
    angle:
      'Texas renewable supply from opposite directions: a long-established green brand against a newer one built around simpler pricing.',
  },
  {
    a: 'chariot-energy',
    b: 'rhythm-energy',
    angle:
      'Two Texas suppliers that sell only renewable plans, competing for the same customer on price and exit terms rather than on energy source.',
  },
  {
    a: 'octopus-energy',
    b: 'rhythm-energy',
    angle:
      'Two newer Texas entrants, both renewable-only, both pitching a simpler bill than the incumbents.',
  },
  {
    a: 'txu-energy',
    b: 'direct-energy',
    angle:
      'A Texas-only incumbent against a national supplier that also sells into Texas — the same decision, but only one of them follows you if you move out of state.',
  },
  {
    a: 'xoom-energy',
    b: 'verde-energy',
    angle:
      'Two mid-sized suppliers with nearly identical Northeast footprints, which puts the whole decision on rates and renewable mix.',
  },
  {
    a: 'constellation-energy',
    b: 'xoom-energy',
    angle:
      'A national supplier with a commercial book against a residential-focused one, in the eleven states where both are sold.',
  },
  {
    a: 'clearview-energy',
    b: 'verde-energy',
    angle:
      'Two Northeast suppliers with overlapping coverage and very different plan mixes — one fixed and plain, one heavily renewable.',
  },
  {
    a: 'direct-energy',
    b: 'just-energy',
    angle:
      'Two long-established North American retailers competing across the Mid-Atlantic and Northeast, with different appetites for long contracts.',
  },
  {
    a: 'perch-energy',
    b: 'cleanchoice-energy',
    angle:
      'Two routes to renewable supply in the Northeast: a community-solar subscription against a renewable retail plan. They are not the same product.',
  },
  {
    a: 'spark-energy',
    b: 'think-energy',
    angle:
      'Two suppliers with near-identical Mid-Atlantic footprints, both selling into the same utility territories at close to the same rates.',
  },
  {
    a: 'constellation-energy',
    b: 'green-mountain-energy',
    angle:
      'A general-purpose national supplier against a renewable-only one, in the seven states where you can buy either.',
  },
  {
    a: 'town-square-energy',
    b: 'xoom-energy',
    angle:
      'Two suppliers concentrated in New England and the Mid-Atlantic, with different splits between residential and commercial supply.',
  },
  {
    a: 'indra-energy',
    b: 'spark-energy',
    angle:
      'Two mid-sized suppliers competing across Illinois, the Mid-Atlantic and Texas, with different renewable positions.',
  },
  {
    a: 'constellation-energy',
    b: 'verde-energy',
    angle:
      'The broadest catalog in our data against the greenest. Constellation sells more plans, in more states, across more contract lengths than anyone we track; Verde sells fewer, but almost all of them are renewable. The choice is between having the most options and having mostly green ones.',
  },
  {
    a: 'direct-energy',
    b: 'xoom-energy',
    angle:
      'These two open within a tenth of a cent of each other across ten shared states, which makes the entry rate close to useless as a tiebreaker. What separates them is shape: one offers contract lengths either side of a year and some plans with no exit fee, the other keeps to twelve and twenty-four months with an exit fee on every plan.',
  },
  {
    a: 'cleanchoice-energy',
    b: 'constellation-energy',
    angle:
      'The clearest read we have on what all-renewable supply costs. One sells nothing but 100% renewable plans; the other sells the cheapest entry rate in the catalog and offers green as one option among many. The gap between their starting rates is the premium, in cents, before any argument about whether it is worth paying.',
  },
  {
    a: 'inspire-clean-energy',
    b: 'perch-energy',
    angle:
      'Two suppliers selling nothing but renewable plans, none of which carry an early termination fee, built in opposite ways: one is a month-to-month subscription with a rate that can move, the other locks a fixed rate for a year or two. Same energy, same freedom to leave, entirely different exposure to price.',
  },
  {
    a: 'clearview-energy',
    b: 'town-square-energy',
    angle:
      'Two small Northeast catalogs of near-identical size and price, where the decision comes down to how long you want to commit — one sells a single twelve-month product, the other adds a six-month term for anyone unwilling to sign for a year.',
  },
];

/* ------------------------------------------------------------------ *
 * Plan-shape comparisons
 *
 * Deliberately about plan *shapes*, never about two named plans. Individual
 * plan rates move week to week; a static page built around one would be stale
 * within a month and would read as a soft 404 once the plan was withdrawn. A
 * shape — fixed against variable, 12 months against 24 — is stable, and the
 * counts behind it come from the same snapshot every other page reads.
 * ------------------------------------------------------------------ */

/**
 * Each entry names the two sides and the snapshot fields that measure them.
 * `metric` picks the per-state numbers for the comparison table; returning null
 * for a state leaves that state out rather than printing a blank row.
 */
export const PLAN_COMPARISONS = [
  {
    slug: 'fixed-vs-variable-electricity-plans',
    a: { name: 'Fixed-rate plans', short: 'Fixed' },
    b: { name: 'Variable-rate plans', short: 'Variable' },
    title: 'Fixed vs Variable Electricity: Which Is Cheaper?',
    heading: 'Fixed vs Variable Electricity Plans',
    keyword: 'fixed vs variable electricity',
    lede:
      'A fixed rate holds the price per kWh for the length of the contract. A variable rate can move every billing cycle, usually with no cap and no notice beyond what the contract requires.',
    metric: (market) => {
      if (!market || (!market.fixedPlans && !market.variablePlans)) return null;
      return { a: market.fixedPlans, b: market.variablePlans };
    },
    unit: 'plans',
    columns: ['Fixed-rate plans', 'Variable-rate plans'],
    faqs: [
      {
        question: 'Is a fixed or variable electricity plan cheaper?',
        answer:
          'A variable plan often starts lower and a fixed plan often ends lower, which is why the introductory rate is the wrong number to compare. A fixed rate is the only one of the two you can multiply by your annual usage and get a real answer.',
      },
      {
        question: 'When does a variable rate change?',
        answer:
          'Whenever the supplier decides, within whatever the contract permits — typically monthly. There is usually no ceiling, so a variable rate can rise well above the fixed rates available at the same time.',
      },
      {
        question: 'Can I switch from variable to fixed?',
        answer:
          'Yes. Variable plans are normally month-to-month with no early termination fee, so moving to a fixed plan is generally free. Check the contract for a fee before you enrol.',
      },
    ],
  },
  {
    slug: '12-month-vs-24-month-electricity-plans',
    a: { name: '12-month contracts', short: '12 months' },
    b: { name: '24-month contracts', short: '24 months' },
    title: '12-Month vs 24-Month Electricity Plans Compared',
    heading: '12-Month vs 24-Month Electricity Contracts',
    keyword: '12 month vs 24 month electricity plan',
    lede:
      'The trade in a longer contract is always the same: a longer price guarantee against a longer commitment and, usually, a larger early termination fee.',
    metric: (market) => {
      const terms = market?.terms || [];
      const has12 = terms.includes(12);
      const has24 = terms.includes(24);
      if (!has12 && !has24) return null;
      return { a: has12 ? 'Offered' : 'Not offered', b: has24 ? 'Offered' : 'Not offered' };
    },
    unit: null,
    columns: ['12-month term', '24-month term'],
    faqs: [
      {
        question: 'Is a 24-month electricity plan worth it?',
        answer:
          'It is worth it when the 24-month rate is at or below the 12-month rate and you are certain you are staying put. A longer term is a longer guarantee, but it is also longer exposure to an early termination fee if you move or find something better.',
      },
      {
        question: 'What happens when my contract ends?',
        answer:
          'Most suppliers roll the account onto a month-to-month variable rate, which is usually higher than any fixed rate they are advertising. The end of a contract is the moment to compare again, not the moment to do nothing.',
      },
      {
        question: 'Does a longer contract always cost less per kWh?',
        answer:
          'No. Longer terms sometimes price above shorter ones, because the supplier is pricing forward risk into the rate. Compare the actual rates for both terms at your ZIP code rather than assuming.',
      },
    ],
  },
  {
    slug: 'renewable-vs-standard-electricity-plans',
    a: { name: '100% renewable plans', short: 'Renewable' },
    b: { name: 'All plans in the market', short: 'All plans' },
    title: 'Renewable vs Standard Electricity Plans Compared',
    heading: 'Renewable vs Standard Electricity Plans',
    keyword: 'renewable vs standard electricity plan cost',
    lede:
      'A 100% renewable plan matches your usage with renewable energy certificates. The electrons reaching your home do not change; what changes is what the supplier buys on your behalf, and sometimes what it costs.',
    metric: (market) => {
      if (!market || !market.renewablePlans || market.minRenewableRate == null || market.minRate == null) {
        return null;
      }
      return { a: formatRate(market.minRenewableRate), b: formatRate(market.minRate) };
    },
    unit: null,
    columns: ['Cheapest renewable plan', 'Cheapest plan of any kind'],
    faqs: [
      {
        question: 'Do renewable electricity plans cost more?',
        answer:
          'Sometimes, and by less than people expect. In several of the markets we track the cheapest renewable plan is within a fraction of a cent of the cheapest plan of any kind; in others there is a real gap. The table on this page shows both figures for every state we cover.',
      },
      {
        question: 'Does a renewable plan change the electricity I receive?',
        answer:
          'No. The grid delivers the same mix to everyone in your area. A renewable plan means the supplier retires renewable energy certificates equal to your usage, which is how renewable generation gets paid for.',
      },
      {
        question: 'What counts as a renewable plan here?',
        answer:
          'Only plans backed by 100% renewable energy. Partial-renewable plans are counted as standard plans, so the comparison is not flattered by plans that are half green.',
      },
    ],
  },
  {
    slug: 'month-to-month-vs-fixed-term-electricity-plans',
    a: { name: 'Month-to-month supply', short: 'Month-to-month' },
    b: { name: 'Fixed-term contracts', short: 'Fixed term' },
    title: 'Month-to-Month vs Fixed-Term Electricity Plans',
    heading: 'Month-to-Month vs Fixed-Term Electricity Plans',
    keyword: 'month to month vs contract electricity',
    lede:
      'Month-to-month supply leaves any time without a fee and reprices whenever the supplier chooses. A fixed term does the opposite on both counts. Which one is right depends less on price than on how long you expect to be at the address.',
    metric: (market) => {
      if (!market) return null;
      const terms = formatTerms(market.terms);
      if (!market.monthToMonth && !terms) return null;
      return { a: market.monthToMonth ? 'Available' : 'Not in our catalog', b: terms || 'None tracked' };
    },
    unit: null,
    columns: ['Month-to-month', 'Fixed terms offered'],
    faqs: [
      {
        question: 'Is month-to-month electricity more expensive?',
        answer:
          'Usually, yes. You are paying for the option to leave, and the supplier prices that in. The exception is a short stay: one or two months on a higher rate can still cost less than an early termination fee.',
      },
      {
        question: 'Should I go month-to-month if I am moving soon?',
        answer:
          'It is the safer choice if the move is inside the next few months and you cannot confirm the contract transfers. Some suppliers waive the termination fee on a verified move — worth asking before you assume either way.',
      },
      {
        question: 'What happens if I do nothing when my contract ends?',
        answer:
          'You are moved onto the supplier’s month-to-month rate automatically. That rate is set by the supplier and is commonly the most expensive one they charge, so it is not a neutral default.',
      },
    ],
  },
  {
    slug: 'no-early-termination-fee-vs-contract-electricity-plans',
    a: { name: 'Plans with no early termination fee', short: 'No exit fee' },
    b: { name: 'Plans with an early termination fee', short: 'Exit fee' },
    title: 'No Cancellation Fee vs Contract Electricity Plans',
    heading: 'No-Exit-Fee vs Contract Electricity Plans',
    keyword: 'electricity plans with no cancellation fee',
    lede:
      'An early termination fee is what the supplier charges to release you from the remaining term. It is the single contract detail most likely to cost you money later, and the one least likely to appear next to the advertised rate.',
    metric: (market) => {
      if (!market || !market.plans) return null;
      const free = market.noEtfPlans || 0;
      return { a: free, b: market.plans - free };
    },
    unit: 'plans',
    columns: ['Plans with no exit fee', 'Plans with an exit fee'],
    faqs: [
      {
        question: 'How much is an early termination fee?',
        answer:
          'It varies by supplier and term. Some are a flat amount, others are charged per remaining month, which makes leaving early in a 24-month contract far more expensive than leaving late. The fee is in the Electricity Facts Label, not usually in the advertisement.',
      },
      {
        question: 'Are plans with no exit fee more expensive?',
        answer:
          'Not reliably. Suppliers use a fee-free plan to compete on flexibility rather than on rate, so the two often sit close together. Compare the rate and the fee at the same time rather than treating a fee-free plan as a premium product.',
      },
      {
        question: 'Can the fee be waived?',
        answer:
          'Many suppliers waive it if you are moving out of the service territory and can show proof. It is rarely waived for switching to a cheaper supplier at the same address.',
      },
    ],
  },
  {
    slug: 'residential-vs-business-electricity-plans',
    a: { name: 'Residential supply', short: 'Residential' },
    b: { name: 'Business supply', short: 'Business' },
    title: 'Residential vs Business Electricity Rates',
    heading: 'Residential vs Business Electricity Plans',
    keyword: 'business vs residential electricity rates',
    lede:
      'Residential supply is sold at a published rate you can enrol in online. Commercial supply is quoted against your load profile, which is why a business rate is a negotiation and a home rate is a checkout.',
    metric: (market) => {
      if (!market || (!market.residentialPlans && !market.businessPlans)) return null;
      return { a: market.residentialPlans, b: market.businessPlans };
    },
    unit: 'plans',
    columns: ['Residential plans', 'Business plans'],
    faqs: [
      {
        question: 'Are business electricity rates cheaper than residential?',
        answer:
          'Often, but not because businesses get a discount. Commercial accounts are priced against a measured load profile, and a flat, predictable load prices better than a peaky one. A small business with a household-shaped load may see household-shaped rates.',
      },
      {
        question: 'Can I put my business on a residential plan?',
        answer:
          'No. The account class follows the meter, and enrolling a commercial meter on a residential product is grounds for the supplier to reprice or cancel it.',
      },
      {
        question: 'Why do business plans need a quote?',
        answer:
          'Because the price depends on when you use power, not only how much. Suppliers need interval data or a good estimate of it before they can commit to a rate, which is why commercial supply is a quote rather than a listed price.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

function providerBySlug(slug) {
  return getPublishableProviders().find((provider) => provider.slug === slug) || null;
}

/** Per-state aggregates for one supplier, or an empty map when we hold none. */
export function providerStateData(name) {
  return marketData.providerStates?.[name] || {};
}

function pct(part, whole) {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

/**
 * Pick the first candidate that fits inside what a SERP renders.
 *
 * Supplier names here run from "TXU Energy" to "Constellation Energy", a 10
 * character spread that becomes 20 across a pair — enough that one phrasing
 * cannot fit every matchup. Rather than write to the worst case and leave the
 * short pairs with a stub, each builder offers its phrasings longest-first and
 * this picks the richest one that still fits. The bound is then a property of
 * the code, not something a test has to catch after the fact.
 *
 * @param {string[]} candidates richest first
 * @param {{max: number, min?: number}} bounds
 */
function fit(candidates, { max, min = 0 }) {
  for (const candidate of candidates) {
    if (candidate.length <= max && candidate.length >= min) return candidate;
  }
  // Everything overflowed: return the shortest so the overflow is small and the
  // regression suite reports a real value rather than undefined.
  return [...candidates].sort((a, b) => a.length - b.length)[0];
}

/** "Green Mountain Energy" -> "Green Mountain". Used for a second mention. */
function shortName(name) {
  const trimmed = String(name).replace(/\s+Energy$/i, '');
  return trimmed.length >= 4 ? trimmed : name;
}

/**
 * Compare two numbers where lower is better (a rate) or higher is better (a
 * count), and describe the gap. Returns null when either side is missing, so a
 * dimension with a hole in it produces no row rather than a row with a blank.
 */
function verdict(aValue, bValue, { lowerWins = false } = {}) {
  if (aValue === null || aValue === undefined || bValue === null || bValue === undefined) return null;
  if (aValue === bValue) return { winner: null, tie: true };
  const aWins = lowerWins ? aValue < bValue : aValue > bValue;
  return { winner: aWins ? 'a' : 'b', tie: false, gap: Math.abs(aValue - bValue) };
}

/* ------------------------------------------------------------------ *
 * Supplier matchups
 * ------------------------------------------------------------------ */

/**
 * Build one supplier comparison, or null when the matchup no longer qualifies.
 * The null path is the guard that keeps a curated list from outliving its data.
 */
export function buildProviderComparison(matchup) {
  const a = providerBySlug(matchup.a);
  const b = providerBySlug(matchup.b);
  if (!a || !b) return null;

  const shared = (a.planStates || []).filter((code) => (b.planStates || []).includes(code) && STATE_NAMES[code]);
  if (!shared.length) return null;

  const aStates = providerStateData(a.name);
  const bStates = providerStateData(b.name);

  // Every state where we can put a rate against a rate. Without at least one,
  // the page has a headline and no comparison, so it is not published.
  const rows = shared
    .map((code) => {
      const left = aStates[code];
      const right = bStates[code];
      if (!left || !right || left.minRate == null || right.minRate == null) return null;
      return {
        code,
        name: STATE_NAMES[code],
        path: STATE_PAGE_PATHS[code],
        a: left,
        b: right,
        cheaper: left.minRate === right.minRate ? null : left.minRate < right.minRate ? 'a' : 'b',
      };
    })
    .filter(Boolean)
    .sort((x, y) => y.a.plans + y.b.plans - (x.a.plans + x.b.plans) || x.name.localeCompare(y.name));

  if (!rows.length) return null;

  const aWins = rows.filter((row) => row.cheaper === 'a');
  const bWins = rows.filter((row) => row.cheaper === 'b');

  const slug = `${a.slug}-vs-${b.slug}`;
  const stateNames = rows.map((row) => row.name);

  return {
    type: 'provider-vs-provider',
    slug,
    path: canonicalPath(`${COMPARE_ROOT}/${slug}`),
    a,
    b,
    angle: matchup.angle,
    sharedStates: rows,
    aOnly: (a.planStates || []).filter((code) => !shared.includes(code) && STATE_NAMES[code]),
    bOnly: (b.planStates || []).filter((code) => !shared.includes(code) && STATE_NAMES[code]),
    cheaperCounts: { a: aWins.length, b: bWins.length, tied: rows.length - aWins.length - bWins.length },
    stateNames,
    // Measured at the width Google actually renders. Two suppliers with long
    // names cannot carry the brand as well, and the brand is the part a
    // searcher needs least — so it is dropped before the matchup is.
    title: fit(
      [
        `${a.name} vs ${b.name}: Rates Compared | Electric Scouts`,
        `${a.name} vs ${b.name} Compared | Electric Scouts`,
        `${a.name} vs ${b.name} | Electric Scouts`,
        `${a.name} vs ${b.name}: Rates Compared`,
        `${a.name} vs ${b.name} Compared`,
        `${a.name} vs ${b.name}`,
      ],
      { max: TITLE_MAX }
    ),
    heading: `${a.name} vs ${b.name}`,
    description: providerComparisonDescription(a, b, rows, aWins, bWins),
    dimensions: providerDimensions(a, b),
    faqs: providerComparisonFaqs(a, b, rows, aWins, bWins),
  };
}

/**
 * The description leads with the finding rather than the topic — which supplier
 * is cheaper in more of the shared markets — because that is the question the
 * click is being made to answer, and because it is the sentence that differs
 * most from one matchup to the next.
 */
function providerComparisonDescription(a, b, rows, aWins, bWins) {
  const single = rows.length === 1;
  const decided = aWins.length !== bWins.length;
  const winner = aWins.length > bWins.length ? a : b;
  const won = Math.max(aWins.length, bWins.length);

  if (single) {
    const state = rows[0].name;
    const verdictText = decided
      ? `${shortName(winner.name)} has the lower entry rate`
      : 'both start at the same entry rate';
    return fit(
      [
        `${a.name} vs ${b.name} in ${state}: ${verdictText}. Plan counts, contract terms, renewable mix and early termination fees compared.`,
        `${a.name} vs ${b.name} in ${state}: ${verdictText}. Plan counts, contract terms and renewable mix compared.`,
        `${a.name} vs ${b.name} in ${state}: entry rates, plan counts, contract terms and renewable mix side by side.`,
      ],
      { max: DESCRIPTION_MAX, min: 70 }
    );
  }

  const verdictText = decided
    ? `${shortName(winner.name)} has the lower entry rate in ${won}`
    : `they split the ${rows.length} markets evenly`;
  return fit(
    [
      `${a.name} vs ${b.name} across ${rows.length} shared states: ${verdictText}. Plan counts, contract terms, renewable mix and exit fees compared.`,
      `${a.name} vs ${b.name} across ${rows.length} shared states: ${verdictText}. Plan counts, terms and renewable mix compared.`,
      `${a.name} vs ${b.name} across ${rows.length} shared states: ${verdictText}. Rates and terms compared.`,
      `${a.name} vs ${b.name} in the ${rows.length} states where both are sold: entry rates, contract terms and renewable mix.`,
    ],
    { max: DESCRIPTION_MAX, min: 70 }
  );
}

/**
 * The comparison table itself. Each dimension is emitted only when both sides
 * have a value for it, which is what keeps a supplier with thin data from
 * producing a page full of dashes.
 */
function providerDimensions(a, b) {
  const dimensions = [];
  const add = (label, aValue, bValue, options = {}) => {
    if (aValue === null || aValue === undefined || bValue === null || bValue === undefined) return;
    dimensions.push({
      label,
      a: options.format ? options.format(aValue) : String(aValue),
      b: options.format ? options.format(bValue) : String(bValue),
      ...(options.compare === false ? { winner: null } : verdict(aValue, bValue, options) || { winner: null }),
      note: options.note,
    });
  };

  add('Plans tracked', a.plans, b.plans, { note: 'More plans means more shapes to choose from, not a better rate.' });
  add('Lowest rate', a.minRate, b.minRate, {
    lowerWins: true,
    format: formatRate,
    note: 'The cheapest plan on offer anywhere the supplier sells. Not necessarily available at your address.',
  });
  add('Median rate', a.medianRate, b.medianRate, {
    lowerWins: true,
    format: formatRate,
    note: 'The middle of the range, which is a fairer guide to what you will actually be offered than the headline rate.',
  });
  add('Highest rate', a.maxRate, b.maxRate, { lowerWins: true, format: formatRate, compare: false });
  add('Residential plans', a.residentialPlans, b.residentialPlans);
  add('Business plans', a.businessPlans, b.businessPlans, {
    note: 'Commercial supply is quoted against a load profile rather than sold at a listed rate.',
  });

  const aRenew = pct(a.renewablePlans, a.plans);
  const bRenew = pct(b.renewablePlans, b.plans);
  if (aRenew !== null && bRenew !== null && (a.renewablePlans || b.renewablePlans)) {
    dimensions.push({
      label: '100% renewable plans',
      a: `${a.renewablePlans} of ${a.plans} (${aRenew}%)`,
      b: `${b.renewablePlans} of ${b.plans} (${bRenew}%)`,
      ...(verdict(aRenew, bRenew) || { winner: null }),
      note: 'Counts only plans backed entirely by renewable energy.',
    });
  }

  const aFree = pct(a.noEtfPlans, a.plans);
  const bFree = pct(b.noEtfPlans, b.plans);
  if (aFree !== null && bFree !== null && (a.noEtfPlans || b.noEtfPlans)) {
    dimensions.push({
      label: 'Plans with no early termination fee',
      a: `${a.noEtfPlans} of ${a.plans} (${aFree}%)`,
      b: `${b.noEtfPlans} of ${b.plans} (${bFree}%)`,
      ...(verdict(aFree, bFree) || { winner: null }),
      note: 'The fee for leaving before the term ends is the detail most likely to cost you money later.',
    });
  }

  const aTerms = formatTerms(a.terms);
  const bTerms = formatTerms(b.terms);
  if (aTerms || bTerms) {
    dimensions.push({
      label: 'Contract terms offered',
      a: aTerms || 'No fixed terms tracked',
      b: bTerms || 'No fixed terms tracked',
      winner: null,
      note: 'Different, not better or worse — the right term depends on how long you are staying.',
    });
  }

  dimensions.push({
    label: 'States with active plans',
    a: `${(a.planStates || []).length}`,
    b: `${(b.planStates || []).length}`,
    ...(verdict((a.planStates || []).length, (b.planStates || []).length) || { winner: null }),
    note: 'Only counts the 12 deregulated states Electric Scouts covers.',
  });

  return dimensions;
}

function providerComparisonFaqs(a, b, rows, aWins, bWins) {
  const faqs = [];

  const cheapestRow = [...rows].sort(
    (x, y) => Math.min(x.a.minRate, x.b.minRate) - Math.min(y.a.minRate, y.b.minRate)
  )[0];

  faqs.push({
    question: `Is ${a.name} or ${b.name} cheaper?`,
    answer:
      aWins.length === bWins.length
        ? `Neither wins outright. Across the ${rows.length} states where both are sold, ${a.name} has the lower starting rate in ${aWins.length} and ${b.name} in ${bWins.length} (${asOf}). The answer depends entirely on your state, which is why the table on this page is broken out by market.`
        : `${aWins.length > bWins.length ? a.name : b.name} has the lower starting rate in more markets — ${Math.max(aWins.length, bWins.length)} of the ${rows.length} states where both are sold, against ${Math.min(aWins.length, bWins.length)} (${asOf}). That is a tally of markets, not a promise about your address: rates are set by utility territory.`,
  });

  if (cheapestRow) {
    const winnerName = cheapestRow.cheaper === 'b' ? b.name : a.name;
    const winnerRate = Math.min(cheapestRow.a.minRate, cheapestRow.b.minRate);
    faqs.push({
      question: `Where are ${a.name} and ${b.name} cheapest?`,
      answer: `Of the states where both compete, ${cheapestRow.name} has the lowest entry rate on either side: ${formatRate(winnerRate)} from ${winnerName} (${asOf}). Rates in ${cheapestRow.name} sit lower than the other shared markets because wholesale costs and utility charges differ by state.`,
    });
  }

  faqs.push({
    question: `Can I get both ${a.name} and ${b.name} at my address?`,
    answer: `Only if you are in one of the ${rows.length} states where we hold plans from both: ${joinNames(rows.map((row) => row.name))}. Even inside those states, availability is set by utility territory, so the check that matters is by ZIP code rather than by state.`,
  });

  const aGreen = pct(a.renewablePlans, a.plans);
  const bGreen = pct(b.renewablePlans, b.plans);
  if (aGreen !== null && bGreen !== null && (a.renewablePlans || b.renewablePlans) && aGreen !== bGreen) {
    const greener = aGreen > bGreen ? a : b;
    faqs.push({
      question: `Which of ${a.name} and ${b.name} has more renewable plans?`,
      answer: `${greener.name}. ${a.name} has ${a.renewablePlans} of ${a.plans} plans backed by 100% renewable energy (${aGreen}%), against ${b.name}’s ${b.renewablePlans} of ${b.plans} (${bGreen}%), ${asOf}.`,
    });
  }

  const aFree = a.noEtfPlans || 0;
  const bFree = b.noEtfPlans || 0;
  if ((aFree || bFree) && aFree !== bFree) {
    const freer = aFree > bFree ? a : b;
    faqs.push({
      question: `Does ${a.name} or ${b.name} charge an early termination fee?`,
      answer: `Both do on most plans, but ${freer.name} carries more without one: ${aFree} of ${a.plans} ${a.name} plans have no early termination fee, against ${bFree} of ${b.plans} from ${b.name} (${asOf}). Check the fee on the specific plan before enrolling — it is set per plan, not per supplier.`,
    });
  }

  return faqs;
}

/* ------------------------------------------------------------------ *
 * Plan-shape comparisons
 * ------------------------------------------------------------------ */

export function buildPlanComparison(spec) {
  const rows = Object.keys(STATE_NAMES)
    .map((code) => {
      const market = getStateMarket(code);
      const measured = spec.metric(market);
      if (!measured) return null;
      return {
        code,
        name: STATE_NAMES[code],
        path: STATE_PAGE_PATHS[code],
        a: measured.a,
        b: measured.b,
        market,
      };
    })
    .filter(Boolean)
    .sort((x, y) => x.name.localeCompare(y.name));

  if (!rows.length) return null;

  return {
    type: 'plan-vs-plan',
    slug: spec.slug,
    path: canonicalPath(`${COMPARE_ROOT}/${spec.slug}`),
    a: spec.a,
    b: spec.b,
    title: fit([`${spec.title} | Electric Scouts`, spec.title], { max: TITLE_MAX }),
    heading: spec.heading,
    description: planComparisonDescription(spec, rows),
    lede: spec.lede,
    columns: spec.columns,
    unit: spec.unit,
    rows,
    faqs: spec.faqs,
  };
}

/**
 * Leads with the catalog split where there is one — "279 fixed against 97
 * variable" is both the differentiator between these pages and the fact that
 * answers the search on its own.
 */
function planComparisonDescription(spec, rows) {
  if (spec.unit === 'plans') {
    const totalA = rows.reduce((sum, row) => sum + (Number(row.a) || 0), 0);
    const totalB = rows.reduce((sum, row) => sum + (Number(row.b) || 0), 0);
    return fit(
      [
        `${totalA} ${spec.a.short.toLowerCase()} plans against ${totalB} ${spec.b.short.toLowerCase()} across ${rows.length} deregulated states. What each costs, what each commits you to, and which to pick.`,
        `${totalA} ${spec.a.short.toLowerCase()} plans against ${totalB} ${spec.b.short.toLowerCase()} in ${rows.length} states. What each costs and which one suits your situation.`,
        `${spec.a.name} against ${spec.b.name} in ${rows.length} deregulated states: what each costs and which one suits your situation.`,
      ],
      { max: DESCRIPTION_MAX, min: 70 }
    );
  }
  return fit(
    [
      `${spec.a.name} against ${spec.b.name} in ${rows.length} deregulated states. What each costs, what each commits you to, and how to tell which one you are being sold.`,
      `${spec.a.name} against ${spec.b.name} in ${rows.length} deregulated states: what each costs and what each commits you to.`,
    ],
    { max: DESCRIPTION_MAX, min: 70 }
  );
}

/* ------------------------------------------------------------------ *
 * Registry
 * ------------------------------------------------------------------ */

let cached = null;

/** Every comparison that currently qualifies, supplier matchups first. */
export function getComparisons() {
  if (cached) return cached;
  const providerPages = PROVIDER_MATCHUPS.map(buildProviderComparison).filter(Boolean);
  const planPages = PLAN_COMPARISONS.map(buildPlanComparison).filter(Boolean);
  cached = [...providerPages, ...planPages];
  return cached;
}

export function getProviderComparisons() {
  return getComparisons().filter((entry) => entry.type === 'provider-vs-provider');
}

export function getPlanComparisons() {
  return getComparisons().filter((entry) => entry.type === 'plan-vs-plan');
}

export function getComparisonBySlug(slug) {
  return getComparisons().find((entry) => entry.slug === slug) || null;
}

/** Comparisons that mention a supplier — used for links on its detail page. */
export function comparisonsForProvider(slug) {
  return getProviderComparisons().filter((entry) => entry.a.slug === slug || entry.b.slug === slug);
}

/** Supplier matchups fought in a state — used for links on its state page. */
export function comparisonsForState(stateCode) {
  return getProviderComparisons().filter((entry) =>
    entry.sharedStates.some((row) => row.code === stateCode)
  );
}

/* ------------------------------------------------------------------ *
 * Hub
 * ------------------------------------------------------------------ */

export const COMPARE_HUB = {
  path: COMPARE_ROOT,
  title: 'Compare Electricity Suppliers Head to Head | Electric Scouts',
  heading: 'Electricity Comparisons, Head to Head',
  description:
    'Side-by-side electricity comparisons from our plan catalog: supplier against supplier where both are sold, and plan type against plan type in all 12 states.',
};

/** One-line summary of the hub, built from what actually qualified. */
export function comparisonHubSummary() {
  const providers = getProviderComparisons();
  const plans = getPlanComparisons();
  const suppliers = new Set();
  for (const entry of providers) {
    suppliers.add(entry.a.name);
    suppliers.add(entry.b.name);
  }
  return {
    providerCount: providers.length,
    planCount: plans.length,
    supplierCount: suppliers.size,
  };
}
