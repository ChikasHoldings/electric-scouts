import { Card, CardContent } from "@/components/ui/card";
import { Factory, Store, Server, Building2 } from "lucide-react";

/**
 * What commercial supply actually involves, by business shape.
 *
 * This component previously rendered six customer testimonials — invented
 * companies ("Austin Manufacturing Co.", "Philadelphia Medical Center"), named
 * individuals with job titles ("Dr. Emily Thompson, Facility Director"), exact
 * monthly and annual savings, five-star ratings, and Unsplash stock photographs
 * presented as those people's headshots. The platform has never had a
 * commercial customer; there are zero rows in custom_business_quotes.
 *
 * Attributing invented quotes to invented named people is prohibited by the
 * FTC's endorsement rules (16 CFR Part 255) and is the kind of claim a
 * prospective commercial buyer can check in a minute. ProviderDetails had
 * already had its fabricated reviews removed on the same grounds.
 *
 * The section keeps its job — help a business recognise itself and understand
 * what to expect — using descriptions of how commercial supply is priced, which
 * are true regardless of who has bought what.
 */

const PROFILES = [
  {
    icon: Store,
    name: "Retail and hospitality",
    usage: "Under 10,000 kWh/month",
    body:
      "Load follows opening hours, so a flat fixed rate is usually the simplest fit. Small accounts are often quoted from a rate card rather than bid, which means a quote can come back the same day.",
    watch: "Early termination fees, which bite hardest on short leases.",
  },
  {
    icon: Building2,
    name: "Offices and professional services",
    usage: "10,000 – 50,000 kWh/month",
    body:
      "Weekday-heavy consumption with a pronounced summer cooling peak. At this size suppliers begin pricing against your actual interval data rather than a standard profile.",
    watch: "Demand charges, which are billed separately from the rate you are quoted.",
  },
  {
    icon: Factory,
    name: "Manufacturing and logistics",
    usage: "50,000+ kWh/month",
    body:
      "Round-the-clock or shift-based load. Contracts are individually bid, and the price depends on when you use power as much as how much — a flat overnight profile prices very differently from a daytime peak.",
    watch: "Whether the quote is fixed, indexed, or a blend, and what triggers a reprice.",
  },
  {
    icon: Server,
    name: "Multi-site operators",
    usage: "Any size, several meters",
    body:
      "Aggregating sites inside one deregulated market gives a supplier more volume to price against. Sites in different states are separate contracts, because the markets are separate.",
    watch: "Contract end dates drifting apart, which loses the aggregation benefit.",
  },
];

export default function BusinessTestimonials() {
  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6">
        {PROFILES.map(({ icon: Icon, name, usage, body, watch }) => (
          <Card key={name} className="border-2 border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-[#0A5C8C]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-[15px]">{name}</h4>
                  <p className="text-xs text-gray-500">{usage}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-3">{body}</p>

              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-[13px] text-amber-900">
                  <span className="font-semibold">Worth checking: </span>
                  {watch}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-[13px] text-gray-500 text-center max-w-2xl mx-auto leading-relaxed">
        Commercial supply is quoted against your load profile rather than sold from
        a list, so the only way to know your rate is to ask for a quote. It is free
        and carries no obligation.
      </p>
    </div>
  );
}
