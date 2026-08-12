/**
 * Provider branding helpers.
 *
 * Pure logic, kept out of the component so it is testable under plain Node —
 * and so the fallback mark a provider gets is decided in one place rather than
 * inside a render function.
 */

/** Words that carry no brand identity, so they never become an initial. */
const GENERIC_WORDS = new Set([
  'energy', 'power', 'electric', 'electricity', 'utilities',
  'services', 'service', 'the', 'and', 'company', 'co', 'inc', 'llc',
]);

/**
 * Up to two initials for a provider.
 *
 * "Green Mountain Energy" reads as GM rather than GE, because the generic word
 * is dropped before the initials are taken. A name made up entirely of generic
 * words falls back to the raw words so a mark is always produced.
 */
export function providerInitials(name) {
  const words = String(name || '')
    .split(/[\s&\-/]+/)
    .filter(Boolean);

  const meaningful = words.filter((w) => !GENERIC_WORDS.has(w.toLowerCase()));
  const source = meaningful.length ? meaningful : words;

  const initials = source
    .slice(0, 2)
    .map((w) => w[0])
    .filter((c) => /[\p{L}\p{N}]/u.test(c || ''))
    .join('')
    .toUpperCase();

  return initials || '?';
}

/** Deterministic tint index, so a provider always looks the same. */
export function tintIndexFor(name, buckets) {
  const text = String(name || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash % buckets;
}
