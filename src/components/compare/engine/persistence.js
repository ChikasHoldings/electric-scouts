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

import { CUSTOMER_TYPES } from './comparisonState.js';

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

/** Persist in-progress answers so a reload doesn't lose the visitor's place. */
export function saveLocalSession(state) {
  const store = safeStorage();
  if (!store) return;
  try {
    // The bill file itself is never cached — only the figures read from it.
    store.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota — resuming is a convenience, not a requirement */
  }
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
    name: state.firstName || null,
    phone: state.phone || null,
    zip: state.zip || null,
    city: state.city || null,
    source: 'compare_rates',
    source_page: isCommercial ? 'compare_rates_commercial' : 'compare_rates_residential',
    comparison: {
      session_id: state.sessionId,
      status: extra.status || state.status,

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
