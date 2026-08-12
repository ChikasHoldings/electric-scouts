/**
 * Progressive persistence for a comparison session.
 *
 * The session is written repeatedly as the visitor answers questions, so an
 * abandoned comparison still leaves a recoverable record. Two rules keep that
 * from producing duplicates:
 *
 *   1. The session id is generated once per visitor and reused for every write,
 *      so retries and back-navigation update the same row.
 *   2. The server upserts on email, which is uniquely indexed on `leads`.
 *
 * Nothing is persisted before an email exists — there is no identity to attach
 * a record to, and writing anonymous rows would just fill the table with noise.
 * State before that point lives in sessionStorage so a reload can resume.
 */

import { CUSTOMER_TYPES, createInitialState, invalidateBranchState } from './comparisonState.js';
import { resolveEntryContext } from './entryContext.js';
import { fullName } from '../../../lib/contactValidation.js';

const SESSION_KEY = 'es_comparison_session';

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Stable id for this comparison, created on first use and reused thereafter. */
export function getOrCreateSessionId() {
  const store = safeStorage();
  const existing = store?.getItem(`${SESSION_KEY}_id`);
  if (existing) return existing;

  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    store?.setItem(`${SESSION_KEY}_id`, id);
  } catch {
    /* best effort */
  }
  return id;
}

/**
 * Contact details are never written to browser storage.
 *
 * Everything else in the session is answers about a property and its energy
 * use, which is what a reload needs in order to resume. A name, email address
 * and phone number are not: they are already upserted onto the lead record the
 * moment an email exists, so the durable copy lives server-side and the browser
 * keeps none. The cost is that a visitor who reloads after the contact step is
 * asked for their email again — the same email, which upserts onto the same
 * row, so no duplicate lead is created.
 */
const CONTACT_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'consentContact'];

/** The subset of a session that is safe to keep in the browser. */
export function safeSessionSnapshot(state) {
  const snapshot = { ...state };
  for (const field of CONTACT_FIELDS) delete snapshot[field];
  return snapshot;
}

/** Persist in-progress answers so a reload doesn't lose the visitor's place. */
export function saveLocalSession(state) {
  const store = safeStorage();
  if (!store) return;
  try {
    // The bill file itself is never cached — only the figures read from it.
    store.setItem(SESSION_KEY, JSON.stringify(safeSessionSnapshot(state)));
  } catch {
    /* quota — resuming is a convenience, not a requirement */
  }
}

/**
 * Open (or continue) a comparison session from a landing page.
 *
 * The landing page owns the handoff, so it writes the session rather than
 * passing the whole thing through the URL. Merging onto whatever is already
 * stored is what keeps a returning visitor's answers — and their original
 * campaign attribution — intact across the hop, and `invalidateBranchState`
 * makes sure a visitor who switches service on the way in does not arrive with
 * the other branch's answers still attached.
 *
 * @param {Record<string, any>} seed  from `landingSeed()`
 * @returns {Record<string, any>} the session as stored
 */
export function seedLocalSession(seed) {
  const sessionId = getOrCreateSessionId();
  const restored = loadLocalSession() || {};
  let next = { ...createInitialState(), ...restored, ...seed, sessionId };

  if (seed.customerType && restored.customerType && restored.customerType !== seed.customerType) {
    next = invalidateBranchState(next, seed.customerType);
  }

  saveLocalSession(next);
  return next;
}

export function loadLocalSession() {
  const store = safeStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLocalSession() {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(SESSION_KEY);
    store.removeItem(`${SESSION_KEY}_id`);
  } catch {
    /* ignore */
  }
}

/**
 * Shape the session into the payload the leads API accepts.
 *
 * Everything that isn't a first-class column on `leads` goes into
 * `search_preferences`, which already exists as JSONB — this avoids duplicating
 * fields that the table can carry as structured metadata.
 */
export function buildLeadPayload(state, extra = {}) {
  const isCommercial = state.customerType === CUSTOMER_TYPES.COMMERCIAL;

  return {
    email: state.email,
    // `name` stays the derived display name every existing email template and
    // the admin panel already read; the parts ride alongside it.
    name: fullName(state.firstName, state.lastName),
    first_name: state.firstName || null,
    last_name: state.lastName || null,
    phone: state.phone || null,
    zip: state.zip || null,
    city: state.city || null,
    source: 'compare_rates',
    source_page: isCommercial ? 'compare_rates_commercial' : 'compare_rates_residential',
    comparison: {
      session_id: state.sessionId,
      status: extra.status || state.status,
      // Which landing page produced this lead, carried through to the record so
      // the funnel can be read per entry point rather than in aggregate.
      entry_context: resolveEntryContext(state),

      customer_type: state.customerType || null,
      energy_preference: state.energyPreference || null,

      property_type: state.propertyType || null,
      shopping_intent: state.shoppingIntent || null,
      usage_range: state.usageRange || null,

      business_type: state.businessType || null,
      business_name: state.businessName || null,
      monthly_spend_range: state.monthlySpendRange || null,
      timing: state.timing || null,

      monthly_usage_kwh: state.monthlyUsageKwh ?? null,
      monthly_cost: state.monthlyCost ?? null,
      current_provider: state.currentProvider || null,
      current_plan: state.currentPlan || null,
      effective_rate: state.effectiveRate ?? null,
      contract_end_date: state.contractEndDate || null,
      renewable_percentage: state.renewablePercentage ?? null,
      peak_demand_kw: state.peakDemandKw ?? null,

      bill_uploaded: state.billUploaded,
      bill_analysis_status: state.billAnalysisStatus,
      bill_confidence: state.billConfidence,
      bill_analyzed_at: state.billAnalyzedAt,

      consent_contact: state.consentContact,

      ...extra.routing,
    },
    attribution: state.attribution || {},
  };
}

/**
 * Upsert the lead. Safe to call repeatedly — the server keys on email.
 *
 * Returns `{ ok }` rather than throwing: a persistence hiccup must never block
 * the visitor from finishing their comparison.
 */
export async function persistComparison(state, extra = {}) {
  if (!state.email) return { ok: false, skipped: 'no_email' };

  try {
    const response = await fetch('/api/leads?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildLeadPayload(state, extra)),
    });

    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, data: await response.json().catch(() => ({})) };
  } catch {
    return { ok: false, error: 'network' };
  }
}
