/**
 * browser.js
 *
 * The two browser APIs this app touches that are allowed to throw, wrapped so
 * they cannot take a page down.
 *
 * Both of these were live crashes. Neither is visible in a normal desktop
 * Chrome, which is why they survived every sweep: the failure only appears in
 * the browsers real visitors use.
 *
 *   Storage. `localStorage` is not "returns null when unavailable". Safari with
 *   "Block All Cookies", older iOS private browsing, in-app webviews (Facebook,
 *   Instagram, Gmail — a large share of mobile traffic), Brave with shields up
 *   and Chrome inside a partitioned iframe all throw a SecurityError from the
 *   property access itself. Two components read it during render, and both are
 *   rendered by Layout on every page, so the throw landed above every route and
 *   took the whole site to the root error screen: "Something went wrong" on
 *   every public URL, for those visitors, always.
 *
 *   Scrolling. `behavior: "instant"` is a ScrollBehavior enum member added in
 *   2023. WebIDL enum conversion does not ignore an unknown member, it throws a
 *   TypeError — so on Safari before 15.4 and Firefox before 111, the
 *   scroll-to-top on every route change threw, from an effect in Layout, with
 *   the same result.
 *
 * The rule both wrappers follow: a browser refusing an optional convenience is
 * not an error condition. Losing a saved ZIP code or an un-scrolled page is a
 * small degradation; losing the page is not.
 */

/** @returns {Storage|null} */
function storage(kind) {
  try {
    // The property access is itself what throws — it cannot be hoisted out of
    // the try, and `'localStorage' in window` returns true before it does.
    const store = kind === 'session' ? window.sessionStorage : window.localStorage;
    if (!store) return null;
    // Availability is not the same as usability: Safari private browsing used
    // to hand back a Storage object whose setItem threw a QuotaExceededError on
    // the first write. A probe is the only honest check.
    const probe = '__es_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

/** Read a key, or `fallback` when storage is unavailable or empty. */
export function readStored(key, { session = false, fallback = null } = {}) {
  try {
    const store = storage(session ? 'session' : 'local');
    if (!store) return fallback;
    const value = store.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

/** Write a key. Returns whether it stuck, for the rare caller that cares. */
export function writeStored(key, value, { session = false } = {}) {
  try {
    const store = storage(session ? 'session' : 'local');
    if (!store) return false;
    store.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key, { session = false } = {}) {
  try {
    const store = storage(session ? 'session' : 'local');
    // Not `store?.removeItem(key); return true` — optional chaining would skip
    // the call and still report success, so a caller clearing a saved ZIP code
    // would be told it had been cleared when no storage existed to clear it in.
    if (!store) return false;
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a JSON value, or `fallback` if it is missing, unreadable or corrupt.
 *
 * The corrupt case is not theoretical — a half-written value from a tab closed
 * mid-write parses as a SyntaxError, and every call site here was doing a bare
 * `JSON.parse(localStorage.getItem(...) || '{}')`.
 */
export function readStoredJson(key, fallback, { session = false } = {}) {
  const raw = readStored(key, { session });
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key, value, { session = false } = {}) {
  try {
    return writeStored(key, JSON.stringify(value), { session });
  } catch {
    return false;
  }
}

/**
 * Jump to the top of the page without animating.
 *
 * Tries the modern spelling, falls back to the two-argument form every browser
 * has understood since forever, and gives up quietly rather than throwing.
 */
export function scrollToTopInstantly() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    try {
      window.scrollTo(0, 0);
    } catch {
      /* A window that refuses to scroll is not worth a broken page. */
    }
  }
}
