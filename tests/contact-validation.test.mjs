/**
 * Contact validation suite — `npm test`.
 *
 * These fields are the lead. A name that fails to persist, a phone number
 * stored in a shape nobody can dial, or an email typo that silently drops the
 * comparison results are all direct revenue losses, so the rules are pinned
 * here rather than trusted to a regex someone will "simplify" later.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateFirstName,
  validateLastName,
  validateEmail,
  validatePhone,
  normalizeName,
  normalizeEmail,
  normalizePhone,
  formatPhone,
  fullName,
  validateContact,
} from '../src/lib/contactValidation.js';

describe('first name', () => {
  test('accepts an ordinary name', () => {
    const r = validateFirstName('Henry');
    assert.equal(r.valid, true);
    assert.equal(r.value, 'Henry');
  });

  test('accepts a hyphenated name', () => {
    assert.equal(validateFirstName('Mary-Jane').valid, true);
  });

  test('accepts an apostrophe', () => {
    assert.equal(validateFirstName("O'Connor").valid, true);
  });

  test('normalizes a typographic apostrophe to ASCII', () => {
    // Phone keyboards produce ’ by default, so the same customer typing on
    // mobile and desktop must not create two different stored values.
    assert.equal(validateFirstName('O’Connor').value, "O'Connor");
  });

  test('accepts accented and non-Latin letters', () => {
    for (const name of ['José', 'Chloë', 'Nguyễn', 'Александр', '李']) {
      assert.equal(validateFirstName(name).valid, true, `${name} must be accepted`);
    }
  });

  test('preserves case exactly as typed', () => {
    // Title-casing would corrupt every one of these.
    for (const name of ['van der Berg', 'McDonald', 'de la Cruz']) {
      assert.equal(validateFirstName(name).value, name);
    }
  });

  test('trims and collapses whitespace', () => {
    assert.equal(validateFirstName('  Mary   Jane  ').value, 'Mary Jane');
  });

  test('rejects whitespace-only input', () => {
    const r = validateFirstName('   ');
    assert.equal(r.valid, false);
    assert.match(r.error, /first name/i);
  });

  test('rejects numeric garbage', () => {
    for (const bad of ['12345', '4695551234', '!!!', '###']) {
      assert.equal(validateFirstName(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects an email address or URL pasted into the name field', () => {
    for (const bad of ['henry@gmail.com', 'https://gmail.com', 'www.example.com']) {
      assert.equal(validateFirstName(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects punctuation-only strings that pass the character rule', () => {
    for (const bad of ["'''", '----', "-'-'"]) {
      assert.equal(validateFirstName(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects an unreasonable length', () => {
    assert.equal(validateFirstName('a'.repeat(61)).valid, false);
  });

  test('never returns the raw value when invalid', () => {
    assert.equal(validateFirstName('12345').value, null);
  });
});

describe('last name', () => {
  test('applies the same rules as first name', () => {
    assert.equal(validateLastName('Kabakwu').valid, true);
    assert.equal(validateLastName("O'Brien-Smith").valid, true);
    assert.equal(validateLastName('José').valid, true);
    assert.equal(validateLastName('  van   Dijk ').value, 'van Dijk');
    assert.equal(validateLastName('12345').valid, false);
    assert.equal(validateLastName('   ').valid, false);
  });

  test('its error names the last name field', () => {
    assert.match(validateLastName('12345').error, /last name/i);
  });
});

describe('full name derivation', () => {
  test('joins both parts', () => {
    assert.equal(fullName('Henry', 'Kabakwu'), 'Henry Kabakwu');
  });

  test('returns null when nothing is known, rather than an empty string', () => {
    assert.equal(fullName('', ''), null);
    assert.equal(fullName(null, undefined), null);
  });

  test('does not produce a trailing space when only one part is known', () => {
    assert.equal(fullName('Henry', ''), 'Henry');
    assert.equal(fullName('', 'Kabakwu'), 'Kabakwu');
  });
});

describe('email', () => {
  test('accepts ordinary addresses', () => {
    for (const good of ['henry@gmail.com', 'a.b+tag@sub.example.co.uk', "o'brien@example.com"]) {
      assert.equal(validateEmail(good).valid, true, `${good} must be accepted`);
    }
  });

  test('accepts unfamiliar but legitimate domains', () => {
    // No allowlist of known providers — refusing a real address loses a lead.
    for (const good of ['x@rediffmail.com', 'y@protonmail.ch', 'z@some-tiny-isp.io']) {
      assert.equal(validateEmail(good).valid, true, `${good} must be accepted`);
    }
  });

  test('trims surrounding whitespace', () => {
    assert.equal(validateEmail('  henry@gmail.com  ').value, 'henry@gmail.com');
  });

  test('lowercases the domain but not the local part', () => {
    // The domain is case-insensitive by spec; the local part is not, and
    // rewriting it is a change we have no right to make.
    assert.equal(validateEmail('Henry.Smith@GMAIL.COM').value, 'Henry.Smith@gmail.com');
  });

  test('rejects the documented malformed cases', () => {
    for (const bad of ['henry@', '@gmail.com', 'henry gmail.com', 'henry@gmail', 'https://gmail.com']) {
      assert.equal(validateEmail(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects internal whitespace that survives trimming', () => {
    assert.equal(validateEmail('hen ry@gmail.com').valid, false);
  });

  test('rejects a malformed local part', () => {
    for (const bad of ['.henry@gmail.com', 'henry.@gmail.com', 'hen..ry@gmail.com']) {
      assert.equal(validateEmail(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects an empty value with a distinct message', () => {
    assert.match(validateEmail('').error, /enter your email/i);
  });

  test('the invalid message matches the specified copy', () => {
    assert.equal(validateEmail('henry@').error, 'Enter a valid email address.');
  });
});

describe('phone', () => {
  test('accepts the documented natural input formats', () => {
    for (const good of [
      '4695551234',
      '469-555-1234',
      '(469) 555-1234',
      '+1 469 555 1234',
      '1-469-555-1234',
      '469.555.1234',
    ]) {
      const r = validatePhone(good);
      assert.equal(r.valid, true, `${good} must be accepted`);
      assert.equal(r.value, '+14695551234', `${good} must normalize to E.164`);
    }
  });

  test('normalizes every accepted form to one stored representation', () => {
    assert.equal(normalizePhone('(469) 555-1234'), '+14695551234');
    assert.equal(normalizePhone('+14695551234'), '+14695551234');
  });

  test('rejects too few digits', () => {
    for (const bad of ['469555123', '12345', '469']) {
      assert.equal(validatePhone(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects too many digits', () => {
    for (const bad of ['46955512345', '+1 469 555 12345']) {
      assert.equal(validatePhone(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects numbers that break NANP rules', () => {
    // These all pass a naive \d{10} check and none of them is dialable:
    // area code and exchange may not begin with 0 or 1.
    for (const bad of ['1234567890', '0000000000', '1115551234', '4691551234', '0695551234']) {
      assert.equal(validatePhone(bad).valid, false, `${bad} must be rejected`);
    }
  });

  test('rejects a number embedded in prose', () => {
    assert.equal(validatePhone('call me on 4695551234').valid, false);
  });

  test('formats for display while storing normalized', () => {
    assert.equal(formatPhone('4695551234'), '(469) 555-1234');
    assert.equal(formatPhone('+14695551234'), '(469) 555-1234');
  });

  test('the invalid message matches the specified copy', () => {
    assert.equal(validatePhone('469').error, 'Enter a valid phone number.');
  });

  test('never returns a best guess for an invalid number', () => {
    assert.equal(validatePhone('469').value, null);
    assert.equal(normalizePhone('469'), null);
  });
});

describe('normalizers are idempotent', () => {
  // Values are re-validated server-side after the client already normalized
  // them, so a second pass must not change anything.
  test('running twice produces the same result', () => {
    assert.equal(normalizeName(normalizeName('  O’Connor  ')), "O'Connor");
    assert.equal(normalizeEmail(normalizeEmail(' A@B.COM ')), 'A@b.com');
    assert.equal(normalizePhone(normalizePhone('(469) 555-1234')), '+14695551234');
  });
});

describe('whole-contact validation (server side)', () => {
  test('normalizes every field and derives the display name', () => {
    const r = validateContact({
      firstName: '  henry ',
      lastName: ' kabakwu ',
      email: ' Henry@GMAIL.com ',
      phone: '(469) 555-1234',
    });
    assert.equal(r.valid, true);
    assert.deepEqual(r.values, {
      firstName: 'henry',
      lastName: 'kabakwu',
      email: 'Henry@gmail.com',
      phone: '+14695551234',
    });
    assert.equal(r.fullName, 'henry kabakwu');
  });

  test('reports errors per field rather than one opaque failure', () => {
    const r = validateContact({ firstName: '123', email: 'henry@', phone: '469' });
    assert.equal(r.valid, false);
    assert.ok(r.errors.firstName, 'first name error expected');
    assert.ok(r.errors.email, 'email error expected');
    assert.ok(r.errors.phone, 'phone error expected');
  });

  test('a blank optional field is absent, not invalid', () => {
    const r = validateContact({ email: 'henry@gmail.com', phone: '' });
    assert.equal(r.valid, true);
    assert.equal(r.values.phone, null);
  });

  test('a blank required field is invalid', () => {
    const r = validateContact({ email: '' }, { require: ['email'] });
    assert.equal(r.valid, false);
    assert.ok(r.errors.email);
  });

  test('an invalid optional field is still rejected when supplied', () => {
    // Optional means "may be omitted", not "may be garbage".
    const r = validateContact({ email: 'henry@gmail.com', phone: '469' });
    assert.equal(r.valid, false);
    assert.ok(r.errors.phone);
  });
});
