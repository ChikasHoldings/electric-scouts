/**
 * The service address — where the electricity is actually delivered.
 *
 * Migration 014 added these columns for the bill analyzer to fill, and nothing
 * ever wrote to them: the analyzer read the address off the bill, printed it
 * on screen, and dropped it. Every lead delivered to a buyer since has carried
 * `service_address: null`, which is the field an energy retailer needs before
 * they can price or enrol anybody. A lead without one is worth materially less
 * than a lead with one, and in some agreements is not billable at all.
 *
 * Imported by the browser for the confirmation step and by /api/leads, which
 * is authoritative — the same rule on both sides, so an address the customer
 * was shown as usable is one the server will store.
 *
 * Two properties matter more than the parsing:
 *
 *   An OCR read is not a fact. `source` records who supplied it and
 *   `confidence` how much of it survived the shape check. A low-confidence
 *   machine reading is stored as such, never promoted to confirmed by being
 *   written to the same column.
 *
 *   The billing address is not the service address. They differ often enough —
 *   landlords, PO boxes, multi-site businesses — that treating them as one
 *   produces quotes for the wrong utility territory, which is the one error
 *   nobody downstream can detect.
 *
 * Framework-free ESM with no imports so both runtimes load it directly.
 */

export const ADDRESS_SOURCE = {
  /** Read off an uploaded bill by the extraction pass. Unconfirmed. */
  BILL_ANALYZER: 'bill_analyzer',
  /** Typed by the customer. */
  CUSTOMER_ENTERED: 'customer_entered',
  /** Read off a bill and then confirmed or corrected by the customer. */
  CUSTOMER_CONFIRMED: 'customer_confirmed',
};

export const ADDRESS_CONFIDENCE = {
  HIGH: 'high',
  LOW: 'low',
};

const STREET_MAX = 200;
const UNIT_MAX = 30;
const CITY_MAX = 80;

/** A leading house number, which every deliverable US street address has. */
const HAS_STREET_NUMBER = /^\s*\d+[A-Za-z]?\s+\S/;

/**
 * A PO box is a billing address by definition — electricity is not delivered
 * to one. Accepting it as a service address produces a lead that a retailer
 * will reject on enrolment, after we have already been paid for it.
 */
const LOOKS_LIKE_PO_BOX = /\b(p\.?\s*o\.?\s*box|post\s+office\s+box)\b/i;

/** Unit designators, so "Apt 4B" is separated rather than lost. */
const UNIT_PATTERN = /[,\s]+(?:#|apt\.?|apartment|unit|ste\.?|suite|bldg\.?|building|fl\.?|floor|rm\.?|room|lot|trlr|trailer)\s*\.?\s*([\w-]+)\s*$/i;

const US_STATE = /\b([A-Z]{2})\b\s*(\d{5})?(?:-\d{4})?\s*$/;

function clean(value, max) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .slice(0, max);
}

/**
 * Split a one-line address into its parts.
 *
 * Best-effort and deliberately conservative: anything it cannot confidently
 * separate stays in `street` rather than being guessed into a city field,
 * because a wrong city is worse than an absent one — it looks authoritative.
 */
export function parseAddressLine(input) {
  const line = clean(input, STREET_MAX + CITY_MAX + 40);
  if (!line) return { street: '', unit: '', city: '', state: '', zip: '' };

  let rest = line;
  let state = '';
  let zip = '';

  const stateMatch = US_STATE.exec(rest);
  if (stateMatch) {
    state = stateMatch[1].toUpperCase();
    zip = stateMatch[2] || '';
    rest = rest.slice(0, stateMatch.index).replace(/[\s,]+$/, '');
  } else {
    // A trailing ZIP with no state still tells us the territory.
    const zipOnly = /\b(\d{5})(?:-\d{4})?\s*$/.exec(rest);
    if (zipOnly) {
      zip = zipOnly[1];
      rest = rest.slice(0, zipOnly.index).replace(/[\s,]+$/, '');
    }
  }

  // The city is the last comma-separated segment, when there is more than one.
  let city = '';
  const parts = rest.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    city = clean(parts.pop(), CITY_MAX);
    rest = parts.join(', ');
  } else {
    rest = parts[0] || '';
  }

  let unit = '';
  const unitMatch = UNIT_PATTERN.exec(rest);
  if (unitMatch) {
    unit = clean(unitMatch[1], UNIT_MAX);
    rest = rest.slice(0, unitMatch.index).replace(/[\s,]+$/, '');
  }

  return { street: clean(rest, STREET_MAX), unit, city, state, zip };
}

/**
 * Validate and normalize a service address.
 *
 * @param {object|string} input   parts, or a single address line
 * @param {{source?: string}} options
 * @returns {{
 *   valid: boolean,
 *   error: string|null,
 *   confidence: string,
 *   values: {address: string, unit: string, city: string, state: string, zip: string},
 *   source: string,
 * }}
 *   `values.address` is the normalized one-line form for `leads.service_address`.
 *   An invalid address returns empty values — a half-parsed address is not
 *   stored, because a buyer cannot tell a partial address from a complete one.
 */
export function validateServiceAddress(input, { source: rawSource } = {}) {
  // The source is a label an admin reads, not a claim that grants anything —
  // confidence is decided below by the shape of the address itself, so a
  // client asserting "customer_confirmed" over a fragment still gets `low`.
  // An unrecognized value is not passed through: it would end up in a column
  // whose vocabulary something later has to interpret.
  const source = Object.values(ADDRESS_SOURCE).includes(rawSource)
    ? rawSource
    : ADDRESS_SOURCE.CUSTOMER_ENTERED;

  const parts = typeof input === 'string' ? parseAddressLine(input) : {
    street: clean(input?.street ?? input?.address, STREET_MAX),
    unit: clean(input?.unit, UNIT_MAX),
    city: clean(input?.city, CITY_MAX),
    state: clean(input?.state, 2).toUpperCase(),
    zip: String(input?.zip ?? '').replace(/\D/g, '').slice(0, 5),
  };

  const empty = { address: '', unit: '', city: '', state: '', zip: '' };
  const reject = (error) => ({
    valid: false,
    error,
    confidence: ADDRESS_CONFIDENCE.LOW,
    values: empty,
    source,
  });

  if (!parts.street) {
    return reject('Enter the street address where your electricity is delivered.');
  }

  if (LOOKS_LIKE_PO_BOX.test(parts.street)) {
    return reject('Electricity is not delivered to a PO box — enter the service address.');
  }

  if (parts.street.length < 5) {
    return reject('That address looks incomplete.');
  }

  const address = [parts.street, parts.unit && `#${parts.unit}`].filter(Boolean).join(' ');

  // ── Confidence ──
  //
  // High means the address could plausibly be delivered to: a house number, a
  // street, and something locating it. Anything less is kept — it is still the
  // best information we have and an admin may be able to use it — but it is
  // labelled, and buyers who require a serviceable address can skip it.
  const locatable = Boolean(parts.zip || parts.city);
  const confidence = HAS_STREET_NUMBER.test(parts.street) && locatable
    ? ADDRESS_CONFIDENCE.HIGH
    : ADDRESS_CONFIDENCE.LOW;

  return {
    valid: true,
    error: null,
    confidence,
    values: {
      address: address.slice(0, STREET_MAX),
      unit: parts.unit,
      city: parts.city,
      state: parts.state,
      zip: parts.zip,
    },
    source,
  };
}

/**
 * The lead columns for a service address, or `{}`.
 *
 * Returns nothing at all for an address that failed validation, so a progressive
 * write cannot blank an address a previous, better write already recorded.
 */
export function serviceAddressColumns(input, options) {
  const result = validateServiceAddress(input, options);
  if (!result.valid) return {};

  const columns = {
    service_address: result.values.address,
    service_address_source: result.source,
    service_address_confidence: result.confidence,
  };

  if (result.values.unit) columns.service_unit = result.values.unit;
  if (result.values.city) columns.service_city = result.values.city;
  if (result.values.state) columns.service_state = result.values.state;
  if (result.values.zip) columns.service_zip = result.values.zip;

  return columns;
}
