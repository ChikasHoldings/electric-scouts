import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADMIN_NOTIFICATIONS,
  adminRecipients,
  selectRecipients,
  wantsNotification,
} from '../api/_lib/adminNotifications.js';

const admin = (email, prefs) => ({ email, role: 'admin', notification_preferences: prefs });
const editor = (email, prefs) => ({ email, role: 'editor', notification_preferences: prefs });

/** A stub with the two shapes the real query can return. */
function supabaseReturning(data, error = null) {
  return {
    from: () => ({
      select: () => ({
        in: async () => ({ data, error }),
      }),
    }),
  };
}

test('an admin who switched an alert off stops receiving it', () => {
  const off = admin('a@x.com', { new_lead_alert: false });
  assert.equal(wantsNotification(off, ADMIN_NOTIFICATIONS.NEW_LEAD), false);
  // Only that one. The others are untouched.
  assert.equal(wantsNotification(off, ADMIN_NOTIFICATIONS.WEEKLY_REPORT), true);
});

test('the master switch beats the individual toggles', () => {
  const muted = admin('a@x.com', { email_notifications: false, new_lead_alert: true });
  for (const type of Object.values(ADMIN_NOTIFICATIONS)) {
    assert.equal(wantsNotification(muted, type), false, `${type} should be muted`);
  }
});

test('a profile with no preferences receives everything it is eligible for', () => {
  // Every profile created before the toggles existed is in this state.
  // Defaulting these to "off" would have muted the whole team on deploy.
  for (const prefs of [undefined, null, {}]) {
    assert.equal(wantsNotification(admin('a@x.com', prefs), ADMIN_NOTIFICATIONS.NEW_LEAD), true);
  }
});

test('an explicit true is honoured the same as an absent key', () => {
  assert.equal(
    wantsNotification(admin('a@x.com', { new_lead_alert: true }), ADMIN_NOTIFICATIONS.NEW_LEAD),
    true
  );
});

test('editors work the lead queue but do not receive commercial alerts', () => {
  const person = editor('e@x.com');
  assert.equal(wantsNotification(person, ADMIN_NOTIFICATIONS.NEW_LEAD), true);
  // Buyer names and per-lead prices are in these two.
  assert.equal(wantsNotification(person, ADMIN_NOTIFICATIONS.WEEKLY_REPORT), false);
  assert.equal(wantsNotification(person, ADMIN_NOTIFICATIONS.UNSOLD_LEAD), false);
});

test('a viewer receives nothing', () => {
  const viewer = { email: 'v@x.com', role: 'viewer' };
  for (const type of Object.values(ADMIN_NOTIFICATIONS)) {
    assert.equal(wantsNotification(viewer, type), false);
  }
});

test('a profile with no email address is never a recipient', () => {
  assert.equal(wantsNotification({ role: 'admin' }, ADMIN_NOTIFICATIONS.NEW_LEAD), false);
});

test('recipients are de-duplicated and lowercased', () => {
  const recipients = selectRecipients(
    [admin('Ops@X.com'), admin('ops@x.com'), admin(' OPS@x.com ')],
    ADMIN_NOTIFICATIONS.NEW_LEAD
  );
  assert.deepEqual(recipients, ['ops@x.com']);
});

test('selectRecipients tolerates junk instead of a profile list', () => {
  for (const input of [null, undefined, 'nope', 42]) {
    assert.deepEqual(selectRecipients(input, ADMIN_NOTIFICATIONS.NEW_LEAD), []);
  }
});

test('everybody opting out sends to nobody, not to the fallback', async () => {
  // The distinction this whole module exists for: an explicit opt-out is a
  // decision and must be obeyed, or the toggle is decorative again.
  const supabase = supabaseReturning([
    admin('a@x.com', { new_lead_alert: false }),
    admin('b@x.com', { email_notifications: false }),
  ]);

  const result = await adminRecipients(supabase, ADMIN_NOTIFICATIONS.NEW_LEAD, {
    fallback: ['env@x.com'],
  });

  assert.deepEqual(result.recipients, []);
  assert.equal(result.source, 'opted_out');
});

test('no staff profiles at all falls back to the configured addresses', async () => {
  const result = await adminRecipients(supabaseReturning([]), ADMIN_NOTIFICATIONS.NEW_LEAD, {
    fallback: ['env@x.com'],
  });

  assert.deepEqual(result.recipients, ['env@x.com']);
  assert.equal(result.source, 'fallback');
});

test('a failed query falls back rather than silencing the alert', async () => {
  const result = await adminRecipients(
    supabaseReturning(null, { message: 'connection reset' }),
    ADMIN_NOTIFICATIONS.WEEKLY_REPORT,
    { fallback: ['env@x.com'] }
  );

  assert.deepEqual(result.recipients, ['env@x.com']);
  assert.equal(result.source, 'fallback');
});

test('a query that throws is caught, not propagated to the caller', async () => {
  const exploding = {
    from: () => ({
      select: () => ({
        in: async () => {
          throw new Error('socket hang up');
        },
      }),
    }),
  };

  const result = await adminRecipients(exploding, ADMIN_NOTIFICATIONS.NEW_LEAD, {
    fallback: ['env@x.com'],
  });

  assert.deepEqual(result.recipients, ['env@x.com']);
});

test('an unknown notification type reaches nobody', async () => {
  const result = await adminRecipients(supabaseReturning([admin('a@x.com')]), 'not_a_real_alert', {
    fallback: ['env@x.com'],
  });

  assert.deepEqual(result.recipients, []);
});

test('profiles that opted in are used in preference to the fallback', async () => {
  const supabase = supabaseReturning([admin('kept@x.com'), admin('gone@x.com', { weekly_report: false })]);

  const result = await adminRecipients(supabase, ADMIN_NOTIFICATIONS.WEEKLY_REPORT, {
    fallback: ['env@x.com'],
  });

  assert.deepEqual(result.recipients, ['kept@x.com']);
  assert.equal(result.source, 'profiles');
});
