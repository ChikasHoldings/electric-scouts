/**
 * Canonical public eligibility.
 *
 * One definition of "may this plan be shown to a customer", used by the
 * comparison API and by admin diagnostics, so the badge an admin reads and the
 * rule the public engine enforces cannot drift apart.
 *
 * The rule this file exists to enforce: BOTH the plan and its provider must be
 * active. Deactivating a provider must remove its plans from public results
 * regardless of each plan's own is_active — otherwise an admin who switches a
 * provider off still sees its inventory on the public site.
 *
 * This is a business rule, not a database one. Both public SELECT policies are
 * `USING (true)`, so RLS returns inactive rows to the anon client quite
 * happily; nothing but this check keeps them out.
 */

/** Customer types each audience may be shown. */
export const AUDIENCE_TYPES = {
  // 'renewable' is a residential product rather than a third audience, so a
  // strict match on 'residential' would hide every green plan from the people
  // who came looking for one.
  residential: ['residential', 'renewable'],
  commercial: ['business'],
};

/** Why a plan is not publicly eligible. Ordered most-blocking first. */
export const INELIGIBLE_REASONS = {
  PROVIDER_INACTIVE: 'provider_inactive',
  PROVIDER_MISSING: 'provider_missing',
  PLAN_INACTIVE: 'plan_inactive',
  WRONG_STATE: 'wrong_state',
  WRONG_CUSTOMER_TYPE: 'wrong_customer_type',
  NO_RATE: 'no_rate',
};

function isActive(value) {
  // A null is_active is treated as inactive on purpose: an unclassified row is
  // not something to publish by default.
  return value === true;
}

/**
 * Is this plan publicly eligible?
 *
 * @param {object} plan     row from electricity_plans
 * @param {object} provider the joined provider row, or null/undefined
 * @param {{state?: string, customerType?: string}} [context]
 *        Omitting state or customerType skips that check, which is what admin
 *        diagnostics want — "would this ever be publishable" rather than
 *        "does it match this particular search".
 * @returns {{eligible: boolean, reason: string|null}}
 */
export function checkEligibility(plan, provider, context = {}) {
  if (!plan) return { eligible: false, reason: INELIGIBLE_REASONS.PLAN_INACTIVE };

  // Provider first: it is the check that overrides the plan's own status, and
  // reporting it first gives an admin the actionable reason.
  if (!provider) return { eligible: false, reason: INELIGIBLE_REASONS.PROVIDER_MISSING };
  if (!isActive(provider.is_active)) {
    return { eligible: false, reason: INELIGIBLE_REASONS.PROVIDER_INACTIVE };
  }

  if (!isActive(plan.is_active)) {
    return { eligible: false, reason: INELIGIBLE_REASONS.PLAN_INACTIVE };
  }

  if (context.state && plan.state !== context.state) {
    return { eligible: false, reason: INELIGIBLE_REASONS.WRONG_STATE };
  }

  if (context.customerType) {
    const accepted = AUDIENCE_TYPES[context.customerType] || AUDIENCE_TYPES.residential;
    // A null customer_type is unclassified inventory, which the residential
    // audience may still see.
    if (plan.customer_type && !accepted.includes(plan.customer_type)) {
      return { eligible: false, reason: INELIGIBLE_REASONS.WRONG_CUSTOMER_TYPE };
    }
  }

  // A plan with no usable rate cannot be priced, so it cannot be compared.
  const rate = Number(plan.rate_per_kwh);
  if (!Number.isFinite(rate) || rate <= 0) {
    return { eligible: false, reason: INELIGIBLE_REASONS.NO_RATE };
  }

  return { eligible: true, reason: null };
}

/** Human-readable reason, for the admin eligibility badge. */
export const REASON_LABELS = {
  [INELIGIBLE_REASONS.PROVIDER_INACTIVE]: 'Provider is inactive',
  [INELIGIBLE_REASONS.PROVIDER_MISSING]: 'Plan has no linked provider',
  [INELIGIBLE_REASONS.PLAN_INACTIVE]: 'Plan is inactive',
  [INELIGIBLE_REASONS.WRONG_STATE]: 'Not offered in this state',
  [INELIGIBLE_REASONS.WRONG_CUSTOMER_TYPE]: 'Different customer type',
  [INELIGIBLE_REASONS.NO_RATE]: 'No usable rate configured',
};

/** Filter a joined plan set down to what the public may see. */
export function filterEligible(rows, context = {}) {
  return rows.filter((row) => checkEligibility(row, row.provider, context).eligible);
}
