/**
 * Contact field validation — the single source of truth.
 *
 * Imported by the browser (for inline UX) and by /api/leads (which is
 * authoritative). Keeping one implementation is the point: a client that
 * accepts something the server rejects produces a lead that silently fails to
 * persist, which is exactly the failure mode this replaces.
 *
 * Framework-free ESM with no imports so both runtimes can load it directly.
 *
 * Every validator returns the same shape:
 *   { valid: boolean, value: string|null, error: string|null }
 * `value` is the NORMALIZED value to persist — never the raw input.
 */

/* ------------------------------------------------------------------ *
 * Names
 * ------------------------------------------------------------------ */

const NAME_MAX = 60;

/**
 * Letters from any script, plus the punctuation that appears inside real
 * names: spaces, hyphens and apostrophes.
 *
 * Deliberately NOT /^[a-zA-Z]+$/. An ASCII-only rule rejects José, Chloë,
 * Nguyễn and O'Connor — real customers with real names — and there is no
 * business reason to refuse their business. \p{L} covers every alphabet,
 * \p{M} the combining marks that accented characters decompose into.
 */
const NAME_ALLOWED = /^[\p{L}\p{M}’'\- ]+$/u;

/** A name has to contain at least one actual letter. */
const HAS_LETTER = /[\p{L}]/u;

/**
 * Shapes that are never a name, checked before the character rule so each
 * gets an accurate rejection rather than a generic one.
 */
const LOOKS_LIKE_EMAIL = /@/;
const LOOKS_LIKE_URL = /(^|\s)(https?:\/\/|www\.)|\.(com|net|org|io|co)\b/i;

/**
 * Normalize a name for storage and display.
 *
 * Collapses runs of whitespace, trims the ends, and converts the typographic
 * apostrophe to ASCII so "O’Connor" and "O'Connor" are stored identically.
 * Case is left exactly as typed — "van der Berg", "McDonald" and "de la Cruz"
 * are all correct as written, and title-casing them would corrupt them.
 */
export function normalizeName(input) {
  return String(input ?? '')
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function validateNamePart(input, label) {
  const value = normalizeName(input);
  const error = `Enter a valid ${label}.`;

  if (!value) return { valid: false, value: null, error: `Enter your ${label}.` };
  if (value.length > NAME_MAX) return { valid: false, value: null, error };
  if (LOOKS_LIKE_EMAIL.test(value)) return { valid: false, value: null, error };
  if (LOOKS_LIKE_URL.test(value)) return { valid: false, value: null, error };
  if (!HAS_LETTER.test(value)) return { valid: false, value: null, error };
  if (!NAME_ALLOWED.test(value)) return { valid: false, value: null, error };

  // "----" and "'''" pass the character rule but are not names. Requiring
  // letters to outnumber punctuation rejects them without touching
  // legitimately punctuated names like Mary-Jane or O'Connor.
  const letters = (value.match(/[\p{L}\p{M}]/gu) || []).length;
  const punctuation = (value.match(/['\-]/g) || []).length;
  if (punctuation >= letters) return { valid: false, value: null, error };

  return { valid: true, value, error: null };
}

export function validateFirstName(input) {
  return validateNamePart(input, 'first name');
}

export function validateLastName(input) {
  return validateNamePart(input, 'last name');
}

/**
 * Display name from the parts we hold.
 *
 * Returns null rather than a half name, so a caller can decide not to
 * personalize at all instead of greeting someone as "Henry ".
 */
export function fullName(firstName, lastName) {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const joined = [first, last].filter(Boolean).join(' ');
  return joined || null;
}

/* ------------------------------------------------------------------ *
 * Email
 * ------------------------------------------------------------------ */

const EMAIL_MAX = 254; // RFC 5321 maximum forward-path length.

/**
 * Structural email validation.
 *
 * Checks shape, not existence: exactly one at-sign, a non-empty local part,
 * and a domain with at least one dot and a 2+ character alphabetic TLD. That
 * last rule rejects an address with no TLD while still accepting unfamiliar
 * but legitimate domain — no allowlist of known providers, because refusing a
 * customer's real address because we have not heard of their ISP loses a lead
 * for no reason.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

/**
 * Normalize an email for storage.
 *
 * The domain is lowercased because it is case-insensitive by spec. The local
 * part is NOT: it is case-sensitive by spec, and while most providers ignore
 * that, rewriting it is a change we have no right to make.
 */
export function normalizeEmail(input) {
  const value = String(input ?? '').trim();
  const at = value.lastIndexOf('@');
  if (at === -1) return value;
  return `${value.slice(0, at)}@${value.slice(at + 1).toLowerCase()}`;
}

export function validateEmail(input) {
  const value = normalizeEmail(input);
  const error = 'Enter a valid email address.';

  if (!value) return { valid: false, value: null, error: 'Enter your email address.' };
  if (value.length > EMAIL_MAX) return { valid: false, value: null, error };
  // Internal whitespace survives trimming and is the most common paste error.
  if (/\s/.test(value)) return { valid: false, value: null, error };
  if (!EMAIL_RE.test(value)) return { valid: false, value: null, error };
  // A leading, trailing or doubled dot in the local part is malformed.
  const [local] = value.split('@');
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { valid: false, value: null, error };
  }

  return { valid: true, value, error: null };
}

/* ------------------------------------------------------------------ *
 * Phone
 * ------------------------------------------------------------------ */

/**
 * US/NANP phone validation and E.164 normalization.
 *
 * Electric Scouts operates only in US deregulated markets, so this implements
 * the North American Numbering Plan rules rather than a general parser:
 *
 *   - 10 digits, optionally prefixed with country code 1
 *   - area code (NXX): first digit 2-9
 *   - exchange code (NXX): first digit 2-9
 *
 * Those two rules are the real ones, and they are what reject the plausible
 * looking garbage a loose \d{10} accepts — 1234567890 and 0000000000 both
 * pass a length check and neither is a dialable number.
 */
const NANP_RE = /^([2-9]\d{2})([2-9]\d{2})(\d{4})$/;

/** Digits only, with a leading +1 or 1 country code removed. */
function nationalDigits(input) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits;
}

/**
 * Normalize to E.164 (+14695551234), or null when the input is not a valid
 * US number. Null rather than a best guess: a malformed number stored as if
 * it were real is worse than no number, because someone will try to call it.
 */
export function normalizePhone(input) {
  const digits = nationalDigits(input);
  return NANP_RE.test(digits) ? `+1${digits}` : null;
}

/** Human-facing format for a value we have already validated: (469) 555-1234. */
export function formatPhone(input) {
  const digits = nationalDigits(input);
  const match = digits.match(NANP_RE);
  if (!match) return String(input ?? '');
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

export function validatePhone(input) {
  const raw = String(input ?? '').trim();
  const error = 'Enter a valid phone number.';

  if (!raw) return { valid: false, value: null, error: 'Enter your phone number.' };

  // Reject characters that are not part of any phone number before counting
  // digits, so "call me on 4695551234" does not validate.
  if (!/^[\d\s()+.\-]+$/.test(raw)) return { valid: false, value: null, error };

  const value = normalizePhone(raw);
  if (!value) return { valid: false, value: null, error };

  return { valid: true, value, error: null };
}

/* ------------------------------------------------------------------ *
 * Whole-contact validation, used by the server
 * ------------------------------------------------------------------ */

/**
 * Validate the contact block of a lead payload.
 *
 * Returns normalized values for everything that passed and a field-keyed error
 * map for everything that did not, so the API can reject with specifics rather
 * than a single opaque failure.
 */
/**
 * @param {{firstName?: any, lastName?: any, email?: any, phone?: any}} [contact]
 * @param {{require?: string[]}} [options]
 */
export function validateContact(contact = {}, { require = ['email'] } = {}) {
  const { firstName, lastName, email, phone } = contact;
  const values = {};
  const errors = {};

  const checks = {
    firstName: () => validateFirstName(firstName),
    lastName: () => validateLastName(lastName),
    email: () => validateEmail(email),
    phone: () => validatePhone(phone),
  };

  const provided = { firstName, lastName, email, phone };

  for (const [field, check] of Object.entries(checks)) {
    const isRequired = require.includes(field);
    const isEmpty = provided[field] === undefined || provided[field] === null ||
      String(provided[field]).trim() === '';

    // An optional field left blank is not an error — it is simply absent.
    if (isEmpty && !isRequired) {
      values[field] = null;
      continue;
    }

    const result = check();
    if (result.valid) values[field] = result.value;
    else errors[field] = result.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
    fullName: fullName(values.firstName, values.lastName),
  };
}
