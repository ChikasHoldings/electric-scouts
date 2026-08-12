/**
 * Who on the team receives an internal alert.
 *
 * Every admin notification went to one place: the `ADMIN_EMAILS` environment
 * variable, blasted to the whole list for every event. The Settings page has
 * offered four per-admin toggles the entire time — they saved to
 * `profiles.notification_preferences` and nothing on the server ever read
 * them, so switching one off changed nothing. An admin who turned lead alerts
 * off kept getting lead alerts, and adding a colleague meant editing an
 * environment variable and redeploying.
 *
 * Recipients are now the admin profiles themselves, each filtered by what that
 * person asked for. Adding a teammate is creating their account; muting an
 * alert is a switch that works.
 *
 * The selection is pure so the rules are testable without a database, and so
 * the one decision that actually matters here — when it is safe to send to
 * nobody — is written down rather than implied.
 */

/** Alerts an admin can opt out of. The values are the preference keys. */
export const ADMIN_NOTIFICATIONS = {
  /** A new lead was captured. */
  NEW_LEAD: 'new_lead_alert',
  /** The Monday performance summary. */
  WEEKLY_REPORT: 'weekly_report',
  /** A qualified lead no configured buyer would take — revenue on the floor. */
  UNSOLD_LEAD: 'unsold_lead_alert',
};

/**
 * Which roles are eligible for each alert, before preferences are applied.
 *
 * Editors work the lead queue, so they can receive lead traffic. The weekly
 * report and the unsold-lead alert carry commercial terms — buyer names and
 * per-lead prices — and stay with admins.
 */
const ELIGIBLE_ROLES = {
  [ADMIN_NOTIFICATIONS.NEW_LEAD]: ['admin', 'editor'],
  [ADMIN_NOTIFICATIONS.WEEKLY_REPORT]: ['admin'],
  [ADMIN_NOTIFICATIONS.UNSOLD_LEAD]: ['admin'],
};

/** Every preference key the Settings page writes, plus the master switch. */
export const PREFERENCE_KEYS = [
  'email_notifications',
  ...Object.values(ADMIN_NOTIFICATIONS),
];

/**
 * Does this person want this alert?
 *
 * Absent means yes. A profile created before the toggles existed has no
 * preferences at all, and defaulting those to "off" would silently mute the
 * whole team the moment this shipped. The Settings page reads the same way
 * (`!== false`), so the switch position an admin sees is the behaviour they
 * get.
 */
export function wantsNotification(profile, type) {
  const roles = ELIGIBLE_ROLES[type];
  if (!roles || !roles.includes(profile?.role)) return false;
  if (!profile?.email) return false;

  const prefs = profile.notification_preferences;
  if (!prefs || typeof prefs !== 'object') return true;

  // The master switch. Off means off for everything, whatever the individual
  // toggles say — that is what an admin means by "email notifications: no".
  if (prefs.email_notifications === false) return false;

  return prefs[type] !== false;
}

/**
 * The addresses for one alert, de-duplicated.
 *
 * @param {Array<{email?: string, role?: string, notification_preferences?: object}>} profiles
 * @param {string} type  one of ADMIN_NOTIFICATIONS
 */
export function selectRecipients(profiles, type) {
  const seen = new Set();

  for (const profile of Array.isArray(profiles) ? profiles : []) {
    if (!wantsNotification(profile, type)) continue;
    seen.add(String(profile.email).toLowerCase().trim());
  }

  return [...seen].filter(Boolean);
}

/**
 * Resolve recipients for real, against the profiles table.
 *
 * The fallback is the distinction that keeps this safe. Two situations look
 * identical in a list of zero addresses and must not be treated the same:
 *
 *   Everyone opted out — an explicit choice. Send to nobody.
 *
 *   Nobody could be asked — the query failed, or no staff profile exists yet
 *   in a fresh environment. Falling silent there would mean a production
 *   platform quietly stops reporting its own leads, so the configured
 *   `ADMIN_EMAILS` still receives the alert.
 *
 * @param {object} supabase          service-role client
 * @param {string} type              one of ADMIN_NOTIFICATIONS
 * @param {{fallback?: string[]}} options
 * @returns {Promise<{recipients: string[], source: 'profiles'|'fallback'|'opted_out'}>}
 */
export async function adminRecipients(supabase, type, { fallback = [] } = {}) {
  const roles = ELIGIBLE_ROLES[type] || [];
  if (!roles.length) return { recipients: [], source: 'opted_out' };

  let profiles = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, role, notification_preferences')
      .in('role', roles);
    if (error) throw new Error(error.message);
    profiles = data || [];
  } catch (err) {
    console.error(`adminRecipients(${type}) query failed:`, err?.message || err);
    return { recipients: fallback, source: 'fallback' };
  }

  if (profiles.length === 0) {
    return { recipients: fallback, source: 'fallback' };
  }

  const recipients = selectRecipients(profiles, type);
  return {
    recipients,
    source: recipients.length ? 'profiles' : 'opted_out',
  };
}
