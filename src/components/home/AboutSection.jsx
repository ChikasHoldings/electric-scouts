import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Search, ShieldCheck } from "lucide-react";
import { MARKET_TOTALS } from "@/seo/market";

export default function AboutSection() {
  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Section Header — shorter on mobile */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] leading-tight">
            <span className="sm:hidden">The Only Platform With a<br /><span className="text-[#FF6B35]">Built-In Bill Analyzer</span></span>
            <span className="hidden sm:inline">The Only Platform With a{" "}<span className="text-[#FF6B35]">Built-In Bill Analyzer</span></span>
          </h2>
          <p className="text-sm sm:text-lg text-gray-600 mt-2 sm:mt-3 max-w-2xl mx-auto">
            Other sites show you rates. We show you what you're actually paying — and exactly how much you'd save.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-stretch">
          {/* Image — compact on mobile */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-full min-h-[220px] sm:min-h-[420px]">
              <picture>
                <source srcSet="/images/homepage/about-couple-savings.webp" type="image/webp" />
                <img
                  src="/images/homepage/about-couple-savings.jpg"
                  alt="Happy couple reviewing electricity savings on tablet"
                  className="w-full h-full object-cover absolute inset-0"
                  loading="lazy"
                  width="800"
                  height="446"
                />
              </picture>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 flex flex-col justify-center space-y-4 sm:space-y-5">
            {/* Feature highlights */}
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-gray-900">Bill Analyzer</span>
                  <p className="text-sm sm:text-base text-gray-600 mt-0.5">Upload your bill. We find hidden fees and overcharges automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-[#0A5C8C]" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-gray-900">Smart Plan Matching</span>
                  <p className="text-sm sm:text-base text-gray-600 mt-0.5">Plans ranked by real value — not by who pays us the most.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-gray-900">No Bias. No Sponsored Rankings.</span>
                  <p className="text-sm sm:text-base text-gray-600 mt-0.5">Competing suppliers means the best deal wins your business.</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-8 pt-1 sm:pt-2">
              <div className="text-center">
                <span className="text-xl sm:text-2xl font-bold text-[#084a6f]">{MARKET_TOTALS.activePlans.toLocaleString()}</span>
                <span className="text-xs sm:text-sm text-gray-500 block">Plans tracked</span>
              </div>
              <div className="w-px h-8 sm:h-10 bg-gray-200"></div>
              <div className="text-center">
                <span className="text-xl sm:text-2xl font-bold text-[#084a6f]">{MARKET_TOTALS.states}</span>
                <span className="text-xs sm:text-sm text-gray-500 block">States covered</span>
              </div>
              <div className="w-px h-8 sm:h-10 bg-gray-200"></div>
              <div className="text-center">
                <span className="text-xl sm:text-2xl font-bold text-[#FF6B35]">{MARKET_TOTALS.providersWithPlans}</span>
                <span className="text-xs sm:text-sm text-gray-500 block">Suppliers compared</span>
              </div>
            </div>

            {/* CTAs — full width stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <Link to={createPageUrl("BillAnalyzer")} className="inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg">
                <FileText className="w-4 h-4 mr-2" />
                Try the Bill Analyzer
              </Link>
              <Link to={createPageUrl("AboutUs")} className="inline-flex items-center justify-center border-2 border-[#0A5C8C] text-[#0A5C8C] hover:bg-[#0A5C8C] hover:text-white font-semibold px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl transition-all duration-300">
                Learn About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
