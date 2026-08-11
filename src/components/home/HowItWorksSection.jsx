import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, BarChart3, Zap } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: MapPin,
    title: "Enter Your ZIP Code",
    description: "We instantly pull every available plan from licensed providers in your area. No account needed.",
    color: "from-[#0A5C8C] to-[#084a6f]"
  },
  {
    number: "2",
    icon: BarChart3,
    title: "Compare Your Top 10",
    description: "Plans ranked by real value — not ad spend. See your top 3 picks plus 7 more curated options, side by side.",
    color: "from-[#FF6B35] to-[#FF8C5A]"
  },
  {
    number: "3",
    icon: Zap,
    title: "Switch & Start Saving",
    description: "Pick a plan and sign up directly with the provider. Takes under 5 minutes. Your power stays on — guaranteed.",
    color: "from-emerald-500 to-emerald-600"
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-12 lg:py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] mb-1.5 sm:mb-2">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
            Three steps. Under two minutes. Real savings.
          </p>
        </div>

        {/* Steps — horizontal scroll on mobile, grid on desktop */}
        <div className="sm:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-5 text-center border border-gray-100 relative flex-shrink-0 w-[75vw] snap-center">
                <div className="mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${step.color} text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Step {step.number}</div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-8 mb-10">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 border border-gray-100 relative">
                <div className="mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.color} text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Step {step.number}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-5 sm:mt-0">
          <Link to={createPageUrl("CompareRates")} className="inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 w-full sm:w-auto max-w-sm">
            Compare Rates Now
          </Link>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
