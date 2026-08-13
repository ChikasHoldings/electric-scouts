/**
 * Reading and writing a provider's service area.
 *
 * `service_areas` is a JSONB column with two shapes in production, both of
 * which `providerAvailability.jsx` understands:
 *
 *   Simple      { excluded_zip_prefixes: [...], utility_territories: [...], notes }
 *   Multi-state { state_config: { TX: { excluded_zip_prefixes: [...] }, OH: {...} } }
 *
 * Two properties matter, and getting either wrong removes a provider from
 * search results in places it actually serves:
 *
 *   IT IS A DENY-LIST. The stored prefixes are the ZIPs a provider does NOT
 *   serve. Writing an allow-list into the same key inverts the provider's
 *   entire coverage.
 *
 *   UNMANAGED KEYS SURVIVE. 30 providers carry `state_config` and 8 carry
 *   `utility_territories` and `notes` that this editor does not surface.
 *   Rebuilding the object from only the fields on screen would silently drop
 *   them on the next save of an unrelated field.
 */

/** Normalize a comma-separated admin input into clean three-digit prefixes. */
export function parsePrefixes(input) {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  return String(input || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Which shape is this provider stored in? */
export function serviceAreaShape(serviceAreas) {
  if (serviceAreas && typeof serviceAreas === 'object' && serviceAreas.state_config) {
    return 'state_config';
  }
  return 'simple';
}

/**
 * The excluded prefixes currently configured, keyed by state.
 *
 * The simple shape has no per-state dimension, so its exclusions are reported
 * under a single `__all__` key rather than being invented against a state the
 * data never named.
 */
export function readExclusions(provider) {
  const areas = provider?.service_areas;
  if (!areas || typeof areas !== 'object') return {};

  if (areas.state_config) {
    const out = {};
    for (const [state, config] of Object.entries(areas.state_config)) {
      out[state] = Array.isArray(config?.excluded_zip_prefixes)
        ? config.excluded_zip_prefixes
        : [];
    }
    return out;
  }

  return { __all__: Array.isArray(areas.excluded_zip_prefixes) ? areas.excluded_zip_prefixes : [] };
}

/**
 * Write exclusions back, preserving everything this editor does not manage.
 *
 * The stored shape is never converted: a provider on `state_config` stays on
 * it, and a simple provider stays simple. Migrating a provider between shapes
 * as a side effect of an unrelated edit is precisely the kind of silent change
 * that makes a coverage bug impossible to trace back to its cause.
 */
export function writeExclusions(existing, exclusionsByState) {
  const base = existing && typeof existing === 'object' ? { ...existing } : {};

  if (base.state_config) {
    const nextConfig = { ...base.state_config };

    for (const [state, prefixes] of Object.entries(exclusionsByState || {})) {
      if (state === '__all__') continue;
      nextConfig[state] = {
        // A state's other settings are carried through untouched.
        ...(nextConfig[state] || {}),
        excluded_zip_prefixes: parsePrefixes(prefixes),
      };
    }

    return { ...base, state_config: nextConfig };
  }

  const all = exclusionsByState?.__all__;
  // An absent key means "not edited", which must not be read as "cleared".
  if (all === undefined) return base;

  return { ...base, excluded_zip_prefixes: parsePrefixes(all) };
}

/**
 * The states this editor should offer.
 *
 * For a `state_config` provider, the states already configured plus any state
 * the provider claims to support — a state listed in `supported_states` but
 * missing from `state_config` is currently invisible to the public site,
 * which is a coverage gap an admin should be able to see and close.
 */
export function editableStates(provider) {
  const supported = Array.isArray(provider?.supported_states) ? provider.supported_states : [];
  const configured = Object.keys(provider?.service_areas?.state_config || {});
  return [...new Set([...configured, ...supported])].sort();
}
