import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, CheckCircle, Shield, Users, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ValidatedZipInput from "../ValidatedZipInput";

export default function HeroSection({ zipCode, setZipCode }) {
  const [isZipValid, setIsZipValid] = useState(false);
  return (
    <section className="bg-slate-50 pt-10 pb-8 relative overflow-hidden sm:pt-14 sm:pb-10 lg:pt-16 lg:pb-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-3 sm:space-y-4 animate-fade-in-up">
            {/* Main Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-bold text-[#084a6f] leading-tight mb-2 sm:mb-3 tracking-tight">
                Stop Overpaying for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]">
                  Electricity.
                </span>
                {" "}We'll Prove It.
              </h1>
              <p className="text-sm sm:text-base lg:text-[17px] text-gray-600 leading-relaxed max-w-xl">
                Upload your bill. We'll analyze it, show you exactly where you're losing money, and match you with a better plan in under 60 seconds. Rates from 40+ providers across 12 states.
              </p>
            </div>

            {/* ZIP Code Input — slim and tight */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-1 hover:shadow-lg hover:border-gray-300 transition-all duration-300 max-w-md">
              <div className="flex items-stretch gap-1.5">
                <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-lg">
                  <ValidatedZipInput
                    value={zipCode}
                    onChange={setZipCode}
                    placeholder="Enter your ZIP code"
                    className="text-base [&_input]:text-base [&_input]:h-7 [&_input]:placeholder:text-gray-400"
                    onValidationChange={setIsZipValid}
                  />
                </div>
                <Link 
                  to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')} 
                  className={`inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#e55a2b] hover:to-[#e6703f] text-white shadow-sm hover:shadow-md transition-all duration-300 touch-manipulation active:scale-95 whitespace-nowrap ${!isZipValid ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={(e) => { if (!isZipValid) e.preventDefault(); }}
                >
                  See My Rates
                </Link>
              </div>
            </div>

            {/* Bill Analyzer Callout — compact */}
            <Link 
              to={createPageUrl("BillAnalyzer")}
              className="flex items-center gap-2.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg px-3 py-2 hover:shadow-sm transition-all duration-300 group max-w-md"
            >
              <div className="w-8 h-8 bg-[#FF6B35] rounded-md flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">Have a bill? Upload it for a free analysis.</p>
                <p className="text-[11px] text-gray-500">Our Bill Analyzer finds hidden charges other tools miss.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FF6B35] group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>

            {/* Social Proof — single line, compact */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-[#084a6f] flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">S</div>
                <div className="w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">M</div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">J</div>
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">R</div>
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[8px] font-bold ring-2 ring-white">+50K</div>
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-gray-500 font-medium ml-1 text-[11px]">4.8/5</span>
                </div>
                <p className="text-gray-600 text-[11px] font-medium leading-tight">Joined by <span className="text-[#084a6f] font-bold">50,000+</span> households saving avg <span className="text-[#FF6B35] font-bold">$600/yr</span></p>
              </div>
            </div>

            {/* Trust Indicators — inline, no circles */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="font-medium">Instant Results</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">100% Free</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-medium">No Hidden Fees</span>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative hidden lg:block">
            <img
              src="https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/homepage/hero-smart-home.png"
              alt="Smart home with solar panels and energy analytics dashboard showing electricity rate comparisons and savings"
              className="w-full h-auto max-w-lg mx-auto"
              loading="eager"
              decoding="async"
              width="800"
              height="800" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
      `}</style>
    </section>);
}
