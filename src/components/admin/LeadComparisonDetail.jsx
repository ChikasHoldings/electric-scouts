import { Badge } from "@/components/ui/badge";

/**
 * Comparison detail for a lead in the admin panel.
 *
 * Renders what the /compare-rates session captured: qualification, energy
 * profile, monetization route and an event timeline. Every section renders only
 * from data that is actually present — an older lead captured by a newsletter
 * form shows nothing here rather than a grid of "unknown".
 */

const QUALIFICATION_STYLES = {
  hot: "bg-red-50 text-red-700",
  warm: "bg-amber-50 text-amber-700",
  nurture: "bg-gray-100 text-gray-600",
};

const ROUTE_LABELS = {
  affiliate: "Affiliate",
  residential_partner: "Residential partner",
  commercial_partner: "Commercial partner",
  renewable_partner: "Renewable partner",
  concierge: "Concierge",
  nurture: "Nurture",
  unrouted: "Unrouted",
};

const USAGE_RANGE_LABELS = {
  under_500: "Under 500 kWh",
  "500_999": "500–999 kWh",
  "1000_1999": "1,000–1,999 kWh",
  "2000_plus": "2,000+ kWh",
  not_sure: "Not sure",
};

const SPEND_RANGE_LABELS = {
  under_500: "Under $500",
  "500_1499": "$500–$1,499",
  "1500_4999": "$1,500–$4,999",
  "5000_19999": "$5,000–$19,999",
  "20000_plus": "$20,000+",
  not_sure: "Not sure",
};

const TIMING_LABELS = {
  now: "Starting now",
  "30_days": "Within 30 days",
  "1_3_months": "1–3 months",
  "3_6_months": "3–6 months",
  "6_plus_months": "6+ months",
  comparing: "Just comparing",
};

const INTENT_LABELS = {
  moving: "Moving / new service",
  switching: "Switching providers",
  better_rate: "Looking for a better rate",
};

export function QualificationBadge({ qualification }) {
  if (!qualification) return null;
  return (
    <Badge
      variant="outline"
      className={`border-0 capitalize ${QUALIFICATION_STYLES[qualification] || QUALIFICATION_STYLES.nurture}`}
    >
      {qualification}
    </Badge>
  );
}

export function RouteBadge({ route }) {
  if (!route) return null;
  return (
    <Badge variant="outline" className="border-gray-200 text-gray-700 bg-white text-xs">
      {ROUTE_LABELS[route] || route}
    </Badge>
  );
}

/**
 * What happened when this lead was offered to a buyer.
 *
 * Three states, and the difference between the last two is the one that pays:
 * a lead nobody bought is a configuration gap to fix, while a lead that was
 * never offered is simply one the rules exclude — no partner route, or no
 * consent to be contacted. Showing them as one "not sold" would send an admin
 * hunting for a problem that is not there.
 */
export function DeliveryBadge({ lead }) {
  if (lead.lead_delivery_status === "delivered") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="border-0 bg-emerald-50 text-emerald-700 text-xs">
          Sold
          {lead.sale_price ? ` · $${Number(lead.sale_price).toFixed(2)}` : ""}
        </Badge>
        {lead.lead_buyer_name && (
          <span className="text-xs text-gray-500 truncate max-w-[120px]">{lead.lead_buyer_name}</span>
        )}
      </div>
    );
  }

  if (lead.lead_delivery_status === "unsold") {
    return (
      <Badge variant="outline" className="border-0 bg-amber-50 text-amber-700 text-xs">
        No buyer
      </Badge>
    );
  }

  return <span className="text-gray-400 italic text-sm">—</span>;
}

/** Compact customer-type cell: residential/commercial plus renewable intent. */
export function CustomerTypeCell({ lead }) {
  if (!lead.customer_type) {
    return <span className="text-gray-400 italic text-sm">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-sm capitalize text-gray-900">{lead.customer_type}</span>
      {lead.energy_preference === "renewable" && (
        <Badge variant="outline" className="border-0 bg-emerald-50 text-emerald-700 text-xs">
          Renewable
        </Badge>
      )}
    </div>
  );
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

const NUMBER = new Intl.NumberFormat("en-US");
const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The timeline.
 *
 * Only events that actually happened are listed — the milestones are inferred
 * from the columns the session wrote, so a lead that abandoned before phone
 * capture shows exactly how far it got.
 */
function buildTimeline(lead) {
  const events = [];

  if (lead.created_at) {
    events.push({ label: "Comparison started", at: lead.created_at });
  }
  if (lead.customer_type) {
    events.push({
      label: `${lead.customer_type === "commercial" ? "Commercial" : "Residential"} selected`,
    });
  }
  if (lead.bill_uploaded) {
    events.push({ label: "Bill uploaded" });
  }
  if (lead.bill_analysis_status === "complete") {
    events.push({
      label: `Bill analyzed${lead.bill_confidence ? ` (${lead.bill_confidence} confidence)` : ""}`,
      at: lead.bill_analyzed_at,
    });
  }
  if (lead.bill_analysis_status === "failed") {
    events.push({ label: "Bill analysis failed" });
  }
  if (lead.email) events.push({ label: "Contact captured" });
  if (lead.phone) events.push({ label: "Phone captured" });
  if (lead.comparison_status === "completed") {
    events.push({ label: "Results viewed", at: lead.completed_at });
  }
  if (lead.monetization_route) {
    events.push({ label: `Routed to ${ROUTE_LABELS[lead.monetization_route] || lead.monetization_route}` });
  }
  if (lead.converted_at) {
    events.push({ label: "Converted", at: lead.converted_at });
  }
  if (lead.confirmed_revenue > 0) {
    events.push({ label: `Revenue recorded: ${CURRENCY.format(lead.confirmed_revenue)}` });
  }

  return events;
}

export default function LeadComparisonDetail({ lead }) {
  if (!lead) return null;

  const hasComparison = Boolean(
    lead.customer_type || lead.comparison_session_id || lead.monetization_route
  );

  if (!hasComparison) {
    return (
      <p className="text-sm text-gray-500">
        This lead was captured outside the comparison flow, so there is no
        session detail to show.
      </p>
    );
  }

  const timeline = buildTimeline(lead);
  const isCommercial = lead.customer_type === "commercial";

  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Qualification
        </h4>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <QualificationBadge qualification={lead.qualification} />
          <RouteBadge route={lead.monetization_route} />
          {typeof lead.lead_score === "number" && lead.lead_score > 0 && (
            <span className="text-xs text-gray-500">Score {lead.lead_score}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Customer type" value={lead.customer_type} />
          <Field
            label="Renewable preference"
            value={lead.energy_preference === "renewable" ? "Yes" : null}
          />
          {isCommercial ? (
            <>
              <Field label="Business type" value={lead.business_type} />
              <Field label="Business name" value={lead.business_name} />
              <Field
                label="Monthly spend"
                value={SPEND_RANGE_LABELS[lead.monthly_spend_range] || lead.monthly_spend_range}
              />
              <Field label="Timing" value={TIMING_LABELS[lead.timing] || lead.timing} />
            </>
          ) : (
            <>
              <Field label="Property type" value={lead.property_type} />
              <Field
                label="Intent"
                value={INTENT_LABELS[lead.shopping_intent] || lead.shopping_intent}
              />
              <Field
                label="Usage range"
                value={USAGE_RANGE_LABELS[lead.usage_range] || lead.usage_range}
              />
            </>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Energy profile
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Monthly usage"
            value={lead.monthly_usage_kwh > 0 ? `${NUMBER.format(lead.monthly_usage_kwh)} kWh` : null}
          />
          <Field
            label="Monthly cost"
            value={lead.monthly_cost > 0 ? CURRENCY.format(lead.monthly_cost) : null}
          />
          <Field label="Current provider" value={lead.current_provider} />
          <Field label="Current plan" value={lead.current_plan} />
          <Field
            label="Effective rate"
            value={lead.effective_rate > 0 ? `${lead.effective_rate}¢/kWh` : null}
          />
          <Field label="Contract ends" value={lead.contract_end_date} />
          <Field
            label="Peak demand"
            value={lead.peak_demand_kw > 0 ? `${NUMBER.format(lead.peak_demand_kw)} kW` : null}
          />
          <Field
            label="Bill analyzed"
            value={lead.bill_uploaded ? (lead.bill_analysis_status === "complete" ? "Yes" : "Attempted") : "No"}
          />
        </div>
      </section>

      {(lead.utm_source || lead.utm_campaign || lead.referrer) && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Attribution
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source" value={lead.utm_source} />
            <Field label="Medium" value={lead.utm_medium} />
            <Field label="Campaign" value={lead.utm_campaign} />
            <Field label="Content" value={lead.utm_content} />
            <Field label="Referrer" value={lead.referrer} />
            <Field label="Landing page" value={lead.landing_page} />
          </div>
        </section>
      )}

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Timeline
        </h4>
        <ol className="space-y-2.5">
          {timeline.map((event, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0A5C8C] flex-shrink-0"
              />
              <span className="text-sm text-gray-900">
                {event.label}
                {event.at && (
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(event.at).toLocaleString()}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Consent
        </h4>
        <p className="text-sm text-gray-900">
          {lead.consent_contact
            ? `Agreed to be contacted about this comparison${
                lead.consent_recorded_at
                  ? ` on ${new Date(lead.consent_recorded_at).toLocaleString()}`
                  : ""
              }.`
            : "No contact consent recorded."}
        </p>
      </section>
    </div>
  );
}
