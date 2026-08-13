import { Link } from "react-router-dom";
import { ShieldCheck, Scale, Receipt, Ban } from "lucide-react";
import { MARKET_TOTALS, MARKET_GENERATED_AT } from "@/seo/market";

/**
 * Why a visitor should trust the comparison — stated from things that are true.
 *
 * This section used to render twenty-plus customer reviews: invented names,
 * invented cities, specific dollar savings, dates like "2 days ago", and a
 * "4.8 | 2,500+ Reviews" badge, under the heading "Real People. Real Savings."
 * and the subtitle "Verified customers". None of it was real — the platform has
 * had two leads and no recorded conversions — and none of it came from any
 * table. The business hub carried the same thing with fabricated company names,
 * named executives and stock photos used as customer headshots.
 *
 * Fabricated endorsements are not a style problem. In the US they are
 * prohibited outright by the FTC's endorsement rules (16 CFR Part 255), and a
 * visitor who cross-checks one invented saving loses trust in every real number
 * on the page. ProviderDetails had already had its invented reviews removed for
 * exactly this reason; this brings the rest of the site in line.
 *
 * What replaces them is the honest version of the same argument: what the
 * platform actually does, and what it actually tracks. Every figure below comes
 * from the market snapshot the SEO pages read, so it cannot drift from reality.
 *
 * When real reviews exist, render them from the database — with Review markup
 * added at the same time, which invented ones could never have carried.
 */

const PROMISES = [
  {
    icon: Scale,
    title: "Every plan, ranked the same way",
    body:
      "Results are ordered by what a plan actually costs you at your usage — not by what a supplier pays us. Plans that pay us nothing are listed alongside the ones that do.",
  },
  {
    icon: Receipt,
    title: "The whole bill, not just the rate",
    body:
      "Estimates include delivery charges, base charges and bill credits. Where a component is unknown we say so rather than quietly leaving it out of the total.",
  },
  {
    icon: Ban,
    title: "No fee, ever",
    body:
      "Comparing is free and always will be. We are paid by suppliers when a customer switches, which is why we show you what each plan is worth to us.",
  },
  {
    icon: ShieldCheck,
    title: "Your details stay yours",
    body:
      "We never sell your contact details without your explicit consent, and we tell you who is receiving them when you give it.",
  },
];

export default function TestimonialsSection() {
  const snapshotDate = MARKET_GENERATED_AT
    ? new Date(MARKET_GENERATED_AT).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <section className="bg-slate-50 py-10 sm:py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] mb-2">
            How we make money, and why it doesn&rsquo;t change your results
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            A comparison site is only worth using if its ranking is not for sale.
            Here is exactly how ours works.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0A5C8C]/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-[13.5px] text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Figures from the same snapshot every state and city page reads. */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#0A5C8C]">
                {MARKET_TOTALS.activePlans.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Plans tracked</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#0A5C8C]">
                {MARKET_TOTALS.providersWithPlans}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Suppliers compared</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#0A5C8C]">
                {MARKET_TOTALS.states}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Deregulated states</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {snapshotDate ? `Catalog snapshot taken ${snapshotDate}. ` : ""}
            <Link to="/compare-rates" className="text-[#0A5C8C] hover:underline font-medium">
              Compare plans for your ZIP code
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
