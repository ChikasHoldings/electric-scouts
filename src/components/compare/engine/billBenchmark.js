/**
 * Scoring the bill the customer already has.
 *
 * The analyzer's headline claim — "you are overpaying by 23%" — was computed
 * against every plan row the browser had fetched. Not the plans available in
 * the customer's state; every plan in the catalog, all twelve markets. A Texas
 * bill was being scored against Connecticut supply rates, and the cheapest
 * plan in the country set the overpayment figure whether or not that customer
 * could ever buy it.
 *
 * The peer set here is the comparison the server already ran: eligible plans,
 * in their state, for their customer type. Same catalog, same rules, same
 * numbers as the results underneath the score.
 *
 * The second correction is what the rate is compared TO. A rate read off the
 * bill's "energy charge" line is a supply rate and belongs beside a plan's
 * advertised rate. A rate derived by dividing the bill total by usage includes
 * delivery, taxes and fees, and comparing that against advertised supply rates
 * makes every customer look robbed. Those two are scored against different
 * peer figures, and when there is nothing honest to compare against, this
 * reports that instead of producing a number.
 */

/** What the customer's rate actually represents. */
export const BENCHMARK_BASIS = {
  /** The energy charge off the bill: comparable to a plan's advertised rate. */
  SUPPLY: 'supply',
  /** Bill total ÷ usage: comparable only to a fully modelled monthly cost. */
  EFFECTIVE: 'effective',
};

/**
 * Below this many peers a percentile is noise.
 *
 * Three plans cannot place a customer in a market. Reporting "you are in the
 * 33rd percentile" from a sample of three is a confident-sounding number with
 * nothing behind it.
 */
export const MIN_PEER_SAMPLE = 3;

export const BENCHMARK_BANDS = [
  { min: 80, label: 'Excellent rate', tone: 'good' },
  { min: 60, label: 'Competitive rate', tone: 'good' },
  { min: 40, label: 'Middle of the market', tone: 'fair' },
  { min: 20, label: 'Paying above market', tone: 'poor' },
  { min: 0, label: 'Paying well above market', tone: 'poor' },
];

function finite(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function median(sorted) {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function bandFor(score) {
  return BENCHMARK_BANDS.find((band) => score >= band.min) || BENCHMARK_BANDS[BENCHMARK_BANDS.length - 1];
}

/**
 * The peer rates a customer's rate can honestly be compared against.
 *
 * On the effective basis this is deliberately restrictive: `effectiveRate` is
 * published by the results contract only when a plan's pricing is complete, so
 * a market where nobody has filed delivery charges yields too few peers and
 * the caller is told so — rather than being handed a comparison against
 * supply-only figures that would flatter every plan on the page.
 */
export function peerRates(results, basis) {
  const key = basis === BENCHMARK_BASIS.EFFECTIVE ? 'effectiveRate' : 'ratePerKwh';
  return (Array.isArray(results) ? results : [])
    .map((result) => finite(result?.[key]))
    .filter((rate) => rate !== null)
    .sort((a, b) => a - b);
}

/**
 * Score what the customer pays today against what they could buy.
 *
 * @param {object} input
 * @param {number} input.rate     the customer's rate, in cents per kWh
 * @param {string} input.basis    BENCHMARK_BASIS — what that rate includes
 * @param {Array<object>} input.results  DTOs from the comparison service
 *
 * @returns {{
 *   comparable: boolean,
 *   reason?: string,
 *   score?: number,
 *   band?: {label: string, tone: string},
 *   overpaymentPercent?: number,
 *   cheapestRate?: number,
 *   medianRate?: number,
 *   sampleSize?: number,
 *   basis?: string,
 * }}
 */
export function benchmarkBill({ rate, basis = BENCHMARK_BASIS.SUPPLY, results = [] } = {}) {
  const current = finite(rate);
  if (current === null) {
    return { comparable: false, reason: 'no_current_rate' };
  }

  const peers = peerRates(results, basis);
  if (peers.length < MIN_PEER_SAMPLE) {
    return {
      comparable: false,
      reason: basis === BENCHMARK_BASIS.EFFECTIVE ? 'insufficient_complete_pricing' : 'insufficient_plans',
      sampleSize: peers.length,
      basis,
    };
  }

  const cheapest = peers[0];
  const dearest = peers[peers.length - 1];
  const average = peers.reduce((sum, r) => sum + r, 0) / peers.length;

  // Share of the market priced at or above what they pay. Higher is better for
  // the customer, which is the direction the gauge reads in.
  const percentile = (peers.filter((r) => r >= current).length / peers.length) * 100;

  // Where they sit between the cheapest and dearest plan available to them.
  const range = dearest === cheapest
    ? (current <= cheapest ? 100 : 0)
    : Math.max(0, Math.min(100, ((dearest - current) / (dearest - cheapest)) * 100));

  // A bounded nudge either side of the mean, so two customers on the same
  // percentile are still separated by how far from average they actually are.
  const averageBonus = current <= average
    ? Math.min(15, ((average - current) / average) * 50)
    : -Math.min(15, ((current - average) / average) * 50);

  const score = Math.max(
    0,
    Math.min(100, Math.round(percentile * 0.5 + range * 0.35 + (50 + averageBonus) * 0.15))
  );

  return {
    comparable: true,
    score,
    band: bandFor(score),
    // Against the cheapest plan they could actually switch to, never below
    // zero: a customer already beating the market is not "overpaying by -8%".
    overpaymentPercent: Math.max(0, Math.round(((current - cheapest) / cheapest) * 1000) / 10),
    cheapestRate: Math.round(cheapest * 100) / 100,
    medianRate: Math.round(median(peers) * 100) / 100,
    sampleSize: peers.length,
    basis,
  };
}

/**
 * Read the customer's rate off an extracted bill.
 *
 * Which basis applies is decided by where the number came from, and that is
 * the whole point of returning it: the caller cannot know from the number
 * alone whether it includes delivery.
 *
 * @param {{rate_per_kwh?: number, monthly_cost?: number, monthly_usage_kwh?: number}} bill
 * @returns {{rate: number, basis: string}|null}
 */
export function readBillRate(bill) {
  const stated = finite(bill?.rate_per_kwh);
  if (stated !== null) return { rate: stated, basis: BENCHMARK_BASIS.SUPPLY };

  const cost = finite(bill?.monthly_cost);
  const usage = finite(bill?.monthly_usage_kwh);
  if (cost !== null && usage !== null) {
    return { rate: (cost / usage) * 100, basis: BENCHMARK_BASIS.EFFECTIVE };
  }

  return null;
}
