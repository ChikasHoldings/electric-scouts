import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, FileText, Search, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="py-10 sm:py-12 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#084a6f] leading-tight px-4">
            The Only Platform With a{" "}
            <span className="text-[#FF6B35]">Built-In Bill Analyzer</span>
          </h2>
          <p className="text-sm sm:text-[15px] text-gray-600 mt-2 max-w-2xl mx-auto px-4">
            Other comparison sites show you a list of plans. We show you exactly how much you're overpaying — and why.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src="https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/homepage/about-couple-savings.png"
                alt="Happy couple reviewing electricity savings on tablet"
                className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-3">
            {/* Feature Cards — compact */}
            <div className="space-y-3 px-4 lg:px-0">
              <div className="flex items-start gap-3 bg-gradient-to-r from-orange-50 to-white p-3 rounded-lg border border-orange-100">
                <div className="w-9 h-9 bg-[#FF6B35] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-gray-900">Bill Analyzer</h3>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">Upload your electricity bill and we'll break down every charge — hidden fees, inflated rates, and unnecessary add-ons costing you money.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-100">
                <div className="w-9 h-9 bg-[#0A5C8C] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-gray-900">Smart Plan Matching</h3>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">We rank plans based on your actual usage, location, and preferences. Your top 3 recommendations are hand-picked for maximum savings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-white p-3 rounded-lg border border-green-100">
                <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-gray-900">No Bias. No Sponsored Rankings.</h3>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">Every plan is ranked by value to you — not by who pays us the most. We partner with 40+ providers so the best deal always wins.</p>
                </div>
              </div>
            </div>

            {/* Stats — compact row */}
            <div className="grid grid-cols-3 gap-2 px-4 lg:px-0">
              <div className="text-center py-2.5 bg-slate-50 rounded-lg">
                <span className="text-lg sm:text-xl font-bold text-[#084a6f]">50K+</span>
                <p className="text-[10px] text-gray-500 mt-0.5">Households switched</p>
              </div>
              <div className="text-center py-2.5 bg-slate-50 rounded-lg">
                <span className="text-lg sm:text-xl font-bold text-[#084a6f]">12</span>
                <p className="text-[10px] text-gray-500 mt-0.5">States covered</p>
              </div>
              <div className="text-center py-2.5 bg-slate-50 rounded-lg">
                <span className="text-lg sm:text-xl font-bold text-[#FF6B35]">$600+</span>
                <p className="text-[10px] text-gray-500 mt-0.5">Avg. annual savings</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 px-4 lg:px-0">
              <Link to={createPageUrl("BillAnalyzer")} className="flex-1 inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-5 py-3 text-sm rounded-lg transition-all duration-300 touch-manipulation shadow-md hover:shadow-lg">
                <FileText className="w-4 h-4 mr-1.5" />
                Try the Bill Analyzer
              </Link>
              <Link to={createPageUrl("AboutUs")} className="flex-1 inline-flex items-center justify-center bg-white border border-[#0A5C8C] text-[#0A5C8C] hover:bg-[#0A5C8C] hover:text-white font-semibold px-5 py-3 text-sm rounded-lg transition-all duration-300 touch-manipulation">
                Learn About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);
}
