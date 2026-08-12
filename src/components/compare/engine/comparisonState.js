/**
 * Comparison session state.
 *
 * One flat object describes everything the engine knows about the visitor.
 * `determineNextQuestion` reads it to decide what to ask next, so anything
 * written here — by a question answer or by the bill analyzer — automatically
 * removes the corresponding question from the flow.
 */

export const CUSTOMER_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
};

export const STAGES = ['location', 'needs', 'usage', 'details', 'matches'];

export const STAGE_LABELS = {
  location: 'Location',
  needs: 'Needs',
  usage: 'Usage',
  details: 'Details',
  matches: 'Matches',
};

export function createInitialState(attribution = {}) {
  return {
    // ── Session ──
    sessionId: null,
    status: 'started',

    // Where this comparison began: a service landing page, the Bill Analyzer or
    // /compare-rates itself. Non-PII, and what makes the funnel attributable
    // per landing page rather than as one undifferentiated total.
    entryContext: '',

    // Question ids actually shown, in order. Back navigation walks this rather
    // than the registry: a question satisfied by bill data was never displayed,
    // so stepping back onto it would show the visitor a screen they never saw.
    history: [],

    // ── Location ──
    zip: '',
    city: '',
    state: '',

    // ── Customer type ──
    customerType: '',        // residential | commercial
    energyPreference: '',    // '' | 'renewable'

    // ── Residential qualification ──
    propertyType: '',
    shoppingIntent: '',
    usageRange: '',

    // ── Commercial qualification ──
    businessType: '',
    businessName: '',
    monthlySpendRange: '',
    timing: '',

    // ── Energy profile (from the bill, or answered directly) ──
    monthlyUsageKwh: null,
    monthlyCost: null,
    currentProvider: '',
    currentPlan: '',
    effectiveRate: null,
    contractEndDate: '',
    renewablePercentage: null,
    peakDemandKw: null,

    // ── Bill analyzer ──
    billOffered: false,
    billUploaded: false,
    billAnalysisStatus: 'none',  // none | analyzing | complete | failed
    billConfidence: null,        // null | 'high' | 'low'
    billAnalyzedAt: null,
    unverifiedFields: [],

    // ── Contact ──
    firstName: '',
    email: '',
    phone: '',
    consentContact: false,

    // ── Attribution ──
    attribution,
  };
}

/**
 * Fields that only make sense for one customer type.
 *
 * When the visitor goes back and switches branch, the answers from the
 * abandoned branch have to be cleared — otherwise `determineNextQuestion` sees
 * them as satisfied and skips questions the new branch genuinely needs, and
 * stale values get persisted onto the lead.
 */
const RESIDENTIAL_ONLY = ['propertyType', 'shoppingIntent', 'usageRange'];
const COMMERCIAL_ONLY = ['businessType', 'businessName', 'monthlySpendRange', 'timing', 'peakDemandKw'];

/** Clear the answers belonging to whichever branch is no longer active. */
export function invalidateBranchState(state, nextCustomerType) {
  if (state.customerType === nextCustomerType) return state;

  const cleared = { ...state, customerType: nextCustomerType };
  const stale = nextCustomerType === CUSTOMER_TYPES.RESIDENTIAL
    ? COMMERCIAL_ONLY
    : RESIDENTIAL_ONLY;

  const blank = createInitialState();
  for (const field of stale) cleared[field] = blank[field];

  return cleared;
}

/**
 * Undo the service selection without discarding the session.
 *
 * A visitor who arrives from the Commercial landing page and realises they
 * actually need residential supply must not be trapped in that branch, and must
 * not be punished for changing their mind by losing everything they have
 * already entered. So the audience and both branches' answers are cleared —
 * which puts "What are you shopping for?" back in front of them — while the
 * ZIP, the bill figures, the attribution and the contact details they may have
 * already given all survive.
 *
 * History is reduced to the ZIP step for the same reason `invalidateBranchState`
 * clears stale answers: leaving abandoned branch screens in the stack lets a
 * later Back land on a question that no longer applies.
 */
export function resetServiceSelection(state) {
  const blank = createInitialState();
  const reset = { ...state, customerType: '', energyPreference: '' };

  for (const field of [...RESIDENTIAL_ONLY, ...COMMERCIAL_ONLY]) {
    reset[field] = blank[field];
  }

  reset.history = (Array.isArray(state.history) ? state.history : []).filter((id) => id === 'zip');
  return reset;
}

/** True when the bill analyzer produced a usable figure for `field`. */
export function isKnown(state, field) {
  const value = state[field];
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return Boolean(value);
}

/**
 * Usage in kWh, whether it came from a bill or from the usage-range question.
 * Ranges collapse to their midpoint so downstream cost estimates have a number
 * to work with; the open-ended top band uses its floor rather than inventing a
 * ceiling.
 */
export const USAGE_RANGE_MIDPOINTS = {
  under_500: 350,
  '500_999': 750,
  '1000_1999': 1500,
  '2000_plus': 2400,
  not_sure: 1000,
};

export function resolveUsageKwh(state) {
  if (isKnown(state, 'monthlyUsageKwh')) return state.monthlyUsageKwh;
  if (state.usageRange) return USAGE_RANGE_MIDPOINTS[state.usageRange] ?? 1000;
  return 1000;
}

/** Which stage the given question belongs to, for the progress indicator. */
export function stageForQuestion(questionId) {
  if (questionId === 'zip') return 'location';
  if (['customer_type', 'renewable_context', 'property_type', 'business_type'].includes(questionId)) return 'needs';
  if (['bill_offer', 'bill_upload', 'bill_confirm', 'bill_verify', 'usage_range', 'commercial_spend', 'shopping_intent', 'commercial_timing', 'business_name'].includes(questionId)) return 'usage';
  if (['name', 'email', 'phone'].includes(questionId)) return 'details';
  return 'matches';
}
