/**
 * Provider logo upload rules — `npm test`.
 *
 * 27 of 35 providers had no logo because the admin form only offered a URL
 * text field, so setting one meant hosting the image elsewhere first. These
 * pin the rules the upload control applies, which the `logos` bucket also
 * enforces server-side.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateLogoFile,
  logoStoragePath,
  MAX_LOGO_BYTES,
  ALLOWED_LOGO_TYPES,
  ALLOWED_LOGO_EXTENSIONS,
  LOGO_ACCEPT_ATTR,
} from '../src/lib/logoUpload.js';

const file = (o = {}) => ({ name: 'logo.png', type: 'image/png', size: 50 * 1024, ...o });

describe('accepted formats', () => {
  test('the four supported image types pass', () => {
    for (const type of ALLOWED_LOGO_TYPES) {
      assert.equal(validateLogoFile(file({ type })).valid, true, `${type} should be accepted`);
    }
  });

  test('SVG is accepted — wordmarks are commonly supplied that way', () => {
    assert.equal(validateLogoFile(file({ name: 'mark.svg', type: 'image/svg+xml' })).valid, true);
  });

  test('type matching is case-insensitive', () => {
    assert.equal(validateLogoFile(file({ type: 'IMAGE/PNG' })).valid, true);
  });

  test('a non-image is rejected by format, not by size', () => {
    // A size complaint would send an admin looking for a smaller PDF.
    const r = validateLogoFile({ name: 'terms.pdf', type: 'application/pdf', size: 10 * 1024 });
    assert.equal(r.valid, false);
    assert.match(r.error, /file type isn't supported/i);
  });

  test('a GIF is rejected', () => {
    assert.equal(validateLogoFile(file({ type: 'image/gif' })).valid, false);
  });

  test('a missing type is rejected rather than assumed', () => {
    assert.equal(validateLogoFile(file({ type: '' })).valid, false);
    assert.equal(validateLogoFile(file({ type: undefined })).valid, false);
  });
});

describe('size', () => {
  test('a normal logo passes', () => {
    assert.equal(validateLogoFile(file({ size: 120 * 1024 })).valid, true);
  });

  test('exactly at the limit passes', () => {
    assert.equal(validateLogoFile(file({ size: MAX_LOGO_BYTES })).valid, true);
  });

  test('over the limit is rejected and the error names both numbers', () => {
    const r = validateLogoFile(file({ size: MAX_LOGO_BYTES + 1 }));
    assert.equal(r.valid, false);
    assert.match(r.error, /2\.0 MB/, 'the error should state the limit');
  });

  test('an empty file is rejected', () => {
    assert.equal(validateLogoFile(file({ size: 0 })).valid, false);
    assert.match(validateLogoFile(file({ size: 0 })).error, /empty/i);
  });

  test('a missing size is rejected rather than treated as zero', () => {
    assert.equal(validateLogoFile(file({ size: undefined })).valid, false);
  });
});

describe('no file', () => {
  test('null and undefined produce a clear prompt', () => {
    for (const input of [null, undefined]) {
      const r = validateLogoFile(input);
      assert.equal(r.valid, false);
      assert.match(r.error, /choose an image/i);
    }
  });
});

describe('storage path', () => {
  test('is namespaced under providers/ and slugged from the name', () => {
    assert.match(logoStoragePath('Green Mountain Energy', 'logo.png', 1000),
      /^providers\/green-mountain-energy-1000\.png$/);
  });

  test('a new upload never reuses the previous path', () => {
    // The bucket is public and CDN-cached: reusing a fixed name would serve
    // the OLD logo until the cache expired, which looks like a failed upload.
    const a = logoStoragePath('TXU Energy', 'logo.png', 1000);
    const b = logoStoragePath('TXU Energy', 'logo.png', 2000);
    assert.notEqual(a, b);
  });

  test('the original extension is preserved', () => {
    assert.match(logoStoragePath('X', 'mark.svg', 1), /\.svg$/);
    assert.match(logoStoragePath('X', 'mark.JPEG', 1), /\.jpeg$/);
    assert.match(logoStoragePath('X', 'mark.webp', 1), /\.webp$/);
  });

  test('an unrecognised extension falls back rather than producing a bare path', () => {
    assert.match(logoStoragePath('X', 'noextension', 1), /\.png$/);
  });

  test('punctuation and unicode in a provider name cannot break the path', () => {
    const path = logoStoragePath('APG&E — Térrific/Power', 'l.png', 1);
    assert.match(path, /^providers\/[a-z0-9-]+-1\.png$/);
    assert.ok(!path.includes('//'), 'must not produce a doubled separator');
  });

  test('a blank name still produces a usable path', () => {
    assert.match(logoStoragePath('', 'l.png', 1), /^providers\/provider-1\.png$/);
    assert.match(logoStoragePath('!!!', 'l.png', 1), /^providers\/provider-1\.png$/);
  });
});

describe('file picker accept list matches the validator', () => {
  test('every allowed extension appears in the accept attribute', () => {
    for (const ext of ALLOWED_LOGO_EXTENSIONS) {
      assert.ok(LOGO_ACCEPT_ATTR.includes(ext), `${ext} missing from accept`);
    }
  });

  test('the accept list does not offer a format the validator rejects', () => {
    // Offering .gif in the picker and then refusing it is a trap.
    assert.ok(!LOGO_ACCEPT_ATTR.includes('.gif'));
  });
});
