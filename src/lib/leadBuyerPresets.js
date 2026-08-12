/**
 * Lead-buyer integration presets.
 *
 * The generic webhook already works, but "generic" means an admin has to know
 * the buyer's field names, their auth scheme and their success convention — and
 * get all three right — before a single lead is delivered. In practice that is
 * a developer task disguised as a config screen.
 *
 * A preset carries that knowledge. An admin picks the platform, pastes the one
 * or two credentials the buyer issued them, and delivery works. No code change,
 * no deploy.
 *
 * WHAT IS AND IS NOT ASSERTED HERE
 *
 * The field MAPPINGS below are ours: they say which of our canonical lead
 * fields corresponds to a given platform's documented parameter name. They are
 * editable in Admin precisely because a buyer can and does customise their own
 * field names per campaign — the preset is a correct starting point, not a
 * claim about a specific account's configuration.
 *
 * No endpoint host is hardcoded for the platforms that issue per-account
 * endpoints. Guessing a URL would send a customer's personal data to an address
 * we invented, so the admin pastes the exact endpoint their buyer gave them.
 */

/** How the buyer authenticates us. */
export const AUTH_STYLES = {
  NONE: 'none',
  BEARER: 'bearer',
  HEADER_KEY: 'header_key',
  QUERY_KEY: 'query_key',
  BASIC: 'basic',
};

/**
 * Our canonical lead fields, as produced by `buyerPayload` in leadDelivery.
 * A preset maps these onto whatever the buyer calls them.
 */
export const CANONICAL_FIELDS = [
  'first_name', 'last_name', 'email', 'phone',
  'zip', 'city', 'state',
  'service_address', 'service_city', 'service_state', 'service_zip',
  'customer_type', 'property_type', 'business_name',
  'monthly_usage_kwh', 'monthly_cost', 'current_provider',
  'energy_preference', 'shopping_intent',
  'lead_id', 'received_at',
];

/**
 * The presets.
 *
 * Chosen because they are the platforms that actually carry US energy and
 * home-services lead volume, plus the two CRMs a smaller buyer is most likely
 * to ask us to post into directly.
 */
export const LEAD_BUYER_PRESETS = [
  {
    id: 'boberdoo',
    name: 'Boberdoo',
    category: 'Lead distribution platform',
    docsUrl: 'https://www.boberdoo.com/',
    // Boberdoo issues a per-client endpoint; it is never guessed.
    endpointHint: 'https://<your-instance>.boberdoo.com/api/leadPost',
    authStyle: AUTH_STYLES.QUERY_KEY,
    authParamName: 'Key',
    contentType: 'form',
    // Boberdoo expects SRC/TYPE alongside the lead fields; both are issued per
    // campaign, so they are admin-entered rather than assumed.
    requiredExtras: [
      { key: 'SRC', label: 'Source ID (SRC)', hint: 'Issued by Boberdoo per campaign' },
      { key: 'TYPE', label: 'Lead type ID (TYPE)', hint: 'Numeric lead type' },
    ],
    fieldMap: {
      first_name: 'first_name', last_name: 'last_name',
      email: 'email_address', phone: 'phone_home',
      zip: 'zip', city: 'city', state: 'state',
      service_address: 'address',
    },
    // Boberdoo answers with a status document rather than an HTTP error.
    successWhen: { type: 'body_contains', value: 'matched' },
    notes: 'Ping/post supported. Ask your rep whether your campaign expects ping-then-post or direct post.',
  },
  {
    id: 'leadspedia',
    name: 'LeadsPedia',
    category: 'Lead distribution platform',
    docsUrl: 'https://www.leadspedia.com/',
    endpointHint: 'https://<your-account>.leadspedia.net/post.do',
    authStyle: AUTH_STYLES.QUERY_KEY,
    authParamName: 'api_key',
    contentType: 'form',
    requiredExtras: [
      { key: 'campaign_id', label: 'Campaign ID', hint: 'Issued by LeadsPedia' },
    ],
    fieldMap: {
      first_name: 'first_name', last_name: 'last_name',
      email: 'email', phone: 'phone',
      zip: 'zip_code', city: 'city', state: 'state',
      service_address: 'address',
    },
    successWhen: { type: 'json_field', path: 'status', value: 'success' },
    notes: 'Returns JSON with a status field. Rejections come back 200, so status is what decides.',
  },
  {
    id: 'leadprosper',
    name: 'LeadProsper',
    category: 'Lead distribution platform',
    docsUrl: 'https://leadprosper.io/',
    endpointHint: 'https://api.leadprosper.io/ingest/<campaign>',
    authStyle: AUTH_STYLES.QUERY_KEY,
    authParamName: 'key',
    contentType: 'json',
    requiredExtras: [],
    fieldMap: {
      first_name: 'first_name', last_name: 'last_name',
      email: 'email', phone: 'phone',
      zip: 'zip_code', city: 'city', state: 'state',
      service_address: 'address',
    },
    successWhen: { type: 'json_field', path: 'status', value: 'ACCEPTED' },
    notes: 'JSON ingest. Duplicate and reject responses are 200 with a status, not an HTTP error.',
  },
  {
    id: 'generic_webhook',
    name: 'Generic webhook (JSON)',
    category: 'Direct integration',
    docsUrl: null,
    endpointHint: 'https://buyer.example.com/leads',
    authStyle: AUTH_STYLES.BEARER,
    contentType: 'json',
    requiredExtras: [],
    // Our own canonical shape, unmapped. The right default for a buyer who
    // will build to our spec rather than us building to theirs.
    fieldMap: null,
    successWhen: { type: 'http_ok' },
    notes: 'Posts our canonical payload unchanged. Best when the buyer can accept our schema.',
  },
  {
    id: 'zapier',
    name: 'Zapier / Make catch hook',
    category: 'No-code bridge',
    docsUrl: 'https://zapier.com/apps/webhook/integrations',
    endpointHint: 'https://hooks.zapier.com/hooks/catch/<id>/<token>/',
    // The secret is inside the URL Zapier issues, so no separate credential.
    authStyle: AUTH_STYLES.NONE,
    contentType: 'json',
    requiredExtras: [],
    fieldMap: null,
    successWhen: { type: 'http_ok' },
    notes: 'Fastest way to onboard a buyer with no API: they receive it in a sheet, CRM or email.',
  },
  {
    id: 'hubspot',
    name: 'HubSpot (Forms API)',
    category: 'CRM',
    docsUrl: 'https://developers.hubspot.com/docs/api/marketing/forms',
    endpointHint: 'https://api.hsforms.com/submissions/v3/integration/submit/<portalId>/<formGuid>',
    authStyle: AUTH_STYLES.NONE,
    contentType: 'json',
    requiredExtras: [],
    fieldMap: {
      first_name: 'firstname', last_name: 'lastname',
      email: 'email', phone: 'phone',
      zip: 'zip', city: 'city', state: 'state',
      service_address: 'address',
    },
    successWhen: { type: 'http_ok' },
    notes: 'Portal and form GUID are in the endpoint. Fields must exist on the HubSpot form first.',
  },
  {
    id: 'salesforce_web_to_lead',
    name: 'Salesforce (Web-to-Lead)',
    category: 'CRM',
    docsUrl: 'https://help.salesforce.com/s/articleView?id=sf.setting_up_web-to-lead.htm',
    endpointHint: 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
    authStyle: AUTH_STYLES.NONE,
    contentType: 'form',
    requiredExtras: [
      { key: 'oid', label: 'Org ID (oid)', hint: 'Salesforce organisation id' },
    ],
    fieldMap: {
      first_name: 'first_name', last_name: 'last_name',
      email: 'email', phone: 'phone',
      zip: 'zip', city: 'city', state: 'state',
      service_address: 'street',
    },
    // Web-to-Lead always answers 200, even on rejection. Treating that as
    // proof of delivery would overstate what we know, so it is flagged.
    successWhen: { type: 'http_ok' },
    notes: 'Always returns 200 and gives no confirmation, so delivery cannot be verified from the response.',
  },
];

export const PRESETS_BY_ID = Object.fromEntries(LEAD_BUYER_PRESETS.map((p) => [p.id, p]));

/**
 * Translate our canonical payload into the buyer's field names.
 *
 * A preset with no `fieldMap` posts our shape unchanged. Unmapped canonical
 * fields are DROPPED rather than passed through under our own names: sending a
 * buyer keys they did not ask for is how a strict endpoint rejects an
 * otherwise-good lead.
 */
export function mapPayload(preset, canonical, extras = {}) {
  if (!preset?.fieldMap) return { ...canonical, ...extras };

  const mapped = {};
  for (const [ours, theirs] of Object.entries(preset.fieldMap)) {
    const value = canonical?.[ours];
    if (value !== undefined && value !== null && value !== '') mapped[theirs] = value;
  }
  return { ...mapped, ...extras };
}

/**
 * Was the delivery accepted?
 *
 * Deliberately not "did it return 200". Three of these platforms answer 200
 * for a rejected or duplicate lead, so counting HTTP status alone would record
 * revenue for leads the buyer never accepted.
 */
export function isAccepted(preset, { status, body }) {
  const rule = preset?.successWhen || { type: 'http_ok' };
  const httpOk = status >= 200 && status < 300;

  if (!httpOk) return false;

  if (rule.type === 'body_contains') {
    // Word-boundary matched, not substring: Boberdoo's rejection is
    // "unmatched", which CONTAINS "matched". A plain includes() would record
    // revenue for every lead the buyer refused.
    const token = String(rule.value).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${token}\\b`).test(String(body ?? '').toLowerCase());
  }

  if (rule.type === 'json_field') {
    let parsed = body;
    if (typeof body === 'string') {
      try { parsed = JSON.parse(body); } catch { return false; }
    }
    const actual = parsed?.[rule.path];
    return String(actual ?? '').toLowerCase() === String(rule.value).toLowerCase();
  }

  return true;
}

/**
 * What the admin still has to supply for this preset.
 *
 * Drives the form, and is what makes "connect and it works" true rather than
 * aspirational — an admin is told exactly which credentials to ask their buyer
 * for, instead of discovering a missing one when leads start failing.
 */
export function missingConfiguration(preset, config = {}) {
  const missing = [];
  if (!preset) return ['Select a platform.'];

  if (!String(config.endpoint || '').trim()) {
    missing.push(`Endpoint URL${preset.endpointHint ? ` (looks like ${preset.endpointHint})` : ''}`);
  }

  if (preset.authStyle !== AUTH_STYLES.NONE && !String(config.credential || '').trim()) {
    missing.push(preset.authParamName || 'API key or token');
  }

  for (const extra of preset.requiredExtras || []) {
    if (!String(config.extras?.[extra.key] || '').trim()) missing.push(extra.label);
  }

  return missing;
}

/** Whether delivery to this buyer can be confirmed from their response. */
export function deliveryIsVerifiable(preset) {
  return (preset?.successWhen?.type || 'http_ok') !== 'http_ok';
}
