/**
 * Provider logo upload rules.
 *
 * 27 of 35 providers had no logo, and the reason was mechanical: the admin form
 * offered a `logo_url` TEXT FIELD and nothing else, so setting a logo meant
 * hosting the image somewhere else first and pasting a URL. Almost nobody does
 * that, so almost nobody had a logo.
 *
 * These rules are enforced twice on purpose. The browser checks them to give an
 * admin an immediate, specific error; the `logos` storage bucket enforces the
 * same size and MIME limits server-side, so a bypassed client cannot put
 * something else in the bucket.
 *
 * Pure functions with no imports, so they are testable under plain Node.
 */

/** 2 MB. A logo far above this is a photograph someone picked by mistake. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * Formats a provider logo may be.
 *
 * SVG is included because wordmarks are commonly supplied that way and scale
 * perfectly — the bucket is public and serves it as an image, and the results
 * card renders it inside a fixed box with object-contain.
 */
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

/** Extensions matching ALLOWED_LOGO_TYPES, for the file picker's accept list. */
export const ALLOWED_LOGO_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];

export const LOGO_ACCEPT_ATTR = ALLOWED_LOGO_EXTENSIONS.join(',');

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Is this file usable as a provider logo?
 *
 * @param {{name?: string, type?: string, size?: number}} file
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateLogoFile(file) {
  if (!file) return { valid: false, error: 'Choose an image file.' };

  // Type is checked before size so a PDF gets "wrong format" rather than a
  // size complaint that would send an admin looking for a smaller PDF.
  const type = String(file.type || '').toLowerCase();
  if (!ALLOWED_LOGO_TYPES.includes(type)) {
    return {
      valid: false,
      error: `That file type isn't supported. Use PNG, JPG, WebP or SVG.`,
    };
  }

  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) {
    return { valid: false, error: 'That file appears to be empty.' };
  }
  if (size > MAX_LOGO_BYTES) {
    return {
      valid: false,
      error: `That file is ${formatBytes(size)}. Logos must be under ${formatBytes(MAX_LOGO_BYTES)}.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Storage path for a provider's logo.
 *
 * Namespaced by provider and suffixed with a timestamp rather than overwriting
 * a fixed name: the bucket is public and CDN-cached, so reusing the path would
 * serve the OLD logo until the cache expired, which looks exactly like the
 * upload having silently failed.
 */
export function logoStoragePath(providerName, fileName, now = Date.now()) {
  const slug = String(providerName || 'provider')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'provider';

  const extMatch = String(fileName || '').match(/\.(png|jpe?g|webp|svg)$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.png';

  return `providers/${slug}-${now}${ext}`;
}
