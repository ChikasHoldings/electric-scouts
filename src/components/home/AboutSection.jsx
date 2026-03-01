import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Award, TrendingUp, FileText, Search, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] leading-tight px-4">
            The Only Platform With a{" "}
            <span className="text-[#FF6B35]">
              Built-In Bill Analyzer
            </span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-3 max-w-3xl mx-auto px-4">
            Other comparison sites show you a list of plans. We show you exactly how much you're overpaying — and why. Upload your current bill and let our technology do the rest.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-full">
              <img
                src="https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/homepage/about-couple-savings.png"
                alt="Happy couple reviewing electricity savings on tablet, representing satisfied Electric Scouts customers"
                className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-5 sm:space-y-6">
            {/* Feature Cards */}
            <div className="space-y-4 px-4 lg:px-0">
              <div className="flex items-start gap-4 bg-gradient-to-r from-orange-50 to-white p-4 rounded-xl border border-orange-100">
                <div className="w-12 h-12 bg-[#FF6B35] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Bill Analyzer</h3>
                  <p className="text-sm text-gray-600 mt-1">Upload your electricity bill and we'll break down every charge. We identify hidden fees, inflated rates, and unnecessary add-ons that are costing you money every month.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                <div className="w-12 h-12 bg-[#0A5C8C] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Smart Plan Matching</h3>
                  <p className="text-sm text-gray-600 mt-1">We don't just list plans — we rank them based on your actual usage pattern, location, and preferences. Your top 3 recommendations are hand-picked for maximum savings.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">No Bias. No Sponsored Rankings.</h3>
                  <p className="text-sm text-gray-600 mt-1">Every plan is ranked by value to you — not by who pays us the most. We partner with 40+ providers so the best deal always wins, regardless of the brand.</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 px-4 lg:px-0">
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xl sm:text-2xl font-bold text-[#084a6f]">50K+</span>
                <p className="text-xs text-gray-600 mt-1">Households switched</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xl sm:text-2xl font-bold text-[#084a6f]">12</span>
                <p className="text-xs text-gray-600 mt-1">States covered</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xl sm:text-2xl font-bold text-[#FF6B35]">$600+</span>
                <p className="text-xs text-gray-600 mt-1">Avg. annual savings</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 px-4 lg:px-0">
              <Link to={createPageUrl("BillAnalyzer")} className="flex-1 inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-6 py-4 text-base rounded-xl transition-all duration-300 touch-manipulation shadow-lg hover:shadow-xl">
                <FileText className="w-5 h-5 mr-2" />
                Try the Bill Analyzer
              </Link>
              <Link to={createPageUrl("AboutUs")} className="flex-1 inline-flex items-center justify-center bg-white border-2 border-[#0A5C8C] text-[#0A5C8C] hover:bg-[#0A5C8C] hover:text-white font-semibold px-6 py-4 text-base rounded-xl transition-all duration-300 touch-manipulation">
                Learn About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
