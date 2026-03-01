import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ValidatedZipInput from "../ValidatedZipInput";

export default function HeroSection({ zipCode, setZipCode }) {
  const [isZipValid, setIsZipValid] = useState(false);
  return (
    <section className="bg-slate-50 py-16 relative overflow-hidden sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-16">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Content — centered on mobile, left-aligned on desktop */}
          <div className="space-y-5 sm:space-y-6 animate-fade-in-up text-left">
            {/* Main Headline */}
            <div>
              <h1 className="text-[32px] sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-[#084a6f] leading-[1.15] sm:leading-tight mb-3 sm:mb-4 tracking-tight">
                Cut Your{"\u00A0"}Electric{"\u00A0"}Bill.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]">
                  Keep{"\u00A0"}the{"\u00A0"}Lights{"\u00A0"}On.
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                Enter your ZIP code to compare plans from 40+ providers across 12 deregulated states. Free, unbiased, instant.
              </p>
            </div>

            {/* ZIP Code Input — centered on mobile */}
            {/* ZIP + Button — wrapped container on mobile, inline on desktop */}
            <div className="bg-white rounded-2xl sm:rounded-none sm:bg-transparent p-4 sm:p-0 shadow-lg sm:shadow-none border border-gray-200 sm:border-0 max-w-md">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 sm:hidden">Find your best rate</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2">
                <div className="flex-1 bg-white sm:bg-white rounded-xl sm:shadow-lg border border-gray-200 px-4 py-3 sm:p-1 sm:hover:shadow-xl transition-shadow duration-300">
                  <ValidatedZipInput
                    value={zipCode}
                    onChange={setZipCode}
                    placeholder="Enter your ZIP code"
                    className="text-lg sm:text-xl [&_input]:text-lg [&_input]:sm:text-xl [&_input]:h-9 [&_input]:sm:h-8 [&_input]:placeholder:text-gray-400"
                    onValidationChange={setIsZipValid}
                  />
                </div>
                <Link 
                  to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')} 
                  className={`inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 sm:py-3 text-base font-bold rounded-xl sm:rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#e55a2b] hover:to-[#e6703f] text-white shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap ${!isZipValid ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={(e) => { if (!isZipValid) e.preventDefault(); }}
                >
                  See My Rates <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Social Proof — centered on mobile */}
            <div className="flex items-center gap-3 sm:gap-4 justify-start">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#084a6f] flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-white">S</div>
                <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-white">M</div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-white">J</div>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-white">R</div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[9px] sm:text-[10px] font-bold ring-2 ring-white">+50K</div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-gray-500 font-medium ml-1 text-xs">4.8/5</span>
                </div>
                <p className="text-gray-600 text-xs sm:text-xs font-medium">Joined by <span className="text-[#084a6f] font-bold">50,000+</span> households saving avg <span className="text-[#FF6B35] font-bold">$600/yr</span></p>
              </div>
            </div>

            {/* Trust Indicators — icon on top on mobile, inline row on desktop */}
            <div className="flex text-sm text-gray-600 justify-between sm:justify-start sm:gap-6 max-w-xs sm:max-w-none">
              <div className="flex flex-col items-center gap-1.5 sm:flex-row">
                <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Instant Results</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:flex-row">
                <Shield className="w-5 h-5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">100% Free</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 sm:flex-row">
                <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">No Hidden Fees</span>
              </div>
            </div>
          </div>

          {/* Right Illustration — hidden on mobile and tablet */}
          <div className="relative hidden lg:block">
            <img
              src="https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/homepage/hero-smart-home.png"
              alt="Smart home energy comparison dashboard"
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
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
      `}</style>
    </section>);
}
