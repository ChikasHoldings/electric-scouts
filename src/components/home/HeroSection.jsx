import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, CheckCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ValidatedZipInput from "../ValidatedZipInput";

export default function HeroSection({ zipCode, setZipCode }) {
  const [isZipValid, setIsZipValid] = useState(false);
  return (
    <section className="bg-slate-50 pt-16 pb-10 relative overflow-hidden sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-7 animate-fade-in-up">
            {/* Main Headline with Gradient */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#084a6f] leading-tight mb-3 sm:mb-5 tracking-tight">
                Find the Perfect{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]">
                  Electricity Plan
                </span>
                {" "}for Your Home
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                Compare electricity rates from 40+ providers across 12 deregulated states. Switch easily and save an average of $800 per year on your energy bills.
              </p>
            </div>

            {/* Enhanced ZIP Code Input */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-1.5 hover:shadow-2xl hover:border-gray-300 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-2.5">
                <div className="flex-1 px-5 py-3 bg-gray-50 rounded-xl">
                  <ValidatedZipInput
                    value={zipCode}
                    onChange={setZipCode}
                    placeholder="Enter ZIP code"
                    className="text-xl sm:text-2xl"
                    onValidationChange={setIsZipValid}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')} className="w-full sm:w-auto">
                  <Button
                    disabled={!isZipValid}
                    className="w-full sm:w-auto px-10 py-4 h-auto text-lg sm:text-xl font-bold rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#e55a2b] hover:to-[#e6703f] text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 touch-manipulation active:scale-95">
                    Compare Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 lg:flex lg:items-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1.5 sm:mb-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <span className="font-semibold text-xs sm:text-sm leading-tight">Instant<br className="sm:hidden" /> Results</span>
              </div>
              <span className="text-gray-300 hidden lg:inline">•</span>
              <div className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1.5 sm:mb-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-xs sm:text-sm leading-tight">100%<br className="sm:hidden" /> Free</span>
              </div>
              <span className="text-gray-300 hidden lg:inline">•</span>
              <div className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1.5 sm:mb-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <span className="font-semibold text-xs sm:text-sm leading-tight">No Hidden<br className="sm:hidden" /> Fees</span>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative hidden lg:block">
            <img
              src="https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/homepage/screenshot47.png"
              alt="Interactive electricity rate comparison dashboard showing multiple provider plans with pricing and savings calculations"
              className="w-full h-auto"
              loading="eager"
              decoding="async"
              width="800"
              height="600" />
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
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease-out;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>);

}