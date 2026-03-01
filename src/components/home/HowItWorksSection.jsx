import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, BarChart3, FileText, Zap } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: MapPin,
    title: "Enter Your ZIP Code",
    description: "We'll instantly pull every available plan from licensed providers in your area — no account needed.",
    color: "from-[#0A5C8C] to-[#084a6f]"
  },
  {
    number: "2",
    icon: FileText,
    title: "Upload Your Bill (Optional)",
    description: "Our Bill Analyzer reads your current bill, identifies overcharges, and calculates your exact savings potential.",
    color: "from-[#FF6B35] to-[#FF8C5A]",
    highlight: true
  },
  {
    number: "3",
    icon: BarChart3,
    title: "Compare Your Top 10",
    description: "We rank plans by real value — not ad spend. See your top 3 picks plus 7 more curated options, side by side.",
    color: "from-[#0A5C8C] to-[#084a6f]"
  },
  {
    number: "4",
    icon: Zap,
    title: "Switch & Start Saving",
    description: "Pick a plan and sign up directly with the provider. Takes under 5 minutes. Your power stays on — guaranteed.",
    color: "from-emerald-500 to-emerald-600"
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-12 lg:py-14 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#084a6f] mb-1.5 px-4">
            How Electric Scouts Finds You the Best Rate
          </h2>
          <p className="text-sm sm:text-[15px] text-gray-600 max-w-xl mx-auto px-4">
            Four steps. Under two minutes. Real savings on your next bill.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className={`bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition-all duration-300 border ${step.highlight ? 'border-[#FF6B35] ring-1 ring-orange-100' : 'border-gray-100'} relative`}>
                {step.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Only on Electric Scouts
                  </div>
                )}
                <div className="mb-3">
                  <div className={`w-11 h-11 bg-gradient-to-br ${step.color} text-white rounded-xl flex items-center justify-center mx-auto shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Step {step.number}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5 px-1">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed px-1">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center px-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link to={createPageUrl("CompareRates")} className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold px-8 py-3 text-sm rounded-lg transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg active:scale-95">
            Compare Rates Now
          </Link>
          <Link to={createPageUrl("BillAnalyzer")} className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-[#0A5C8C] text-[#0A5C8C] hover:bg-[#0A5C8C] hover:text-white font-bold px-8 py-3 text-sm rounded-lg transition-all duration-300 touch-manipulation">
            <FileText className="w-4 h-4 mr-1.5" />
            Analyze My Bill
          </Link>
        </div>
      </div>
    </section>);
}
