import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HeroSection({ zipCode, setZipCode, onCompare }) {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden py-20 lg:py-28">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Star Rating with Badge */}
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-100">
              <img 
                src="https://www.powerwizard.com/wp-content/uploads/2025/04/star-rating.svg"
                alt="4.8 star rating"
                className="h-5"
                onError={(e) => {
                  e.target.outerHTML = '<div class="flex gap-0.5">' + 
                    Array(5).fill('<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>').join('') + 
                    '</div>';
                }}
              />
              <span className="text-gray-900 font-bold text-lg">4.8</span>
              <span className="text-gray-400">•</span>
              <Link to={createPageUrl("Home")} className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                1,200+ Reviews
              </Link>
            </div>

            {/* Main Headline with Gradient */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
                Compare the Best{" "}
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  Electricity Rates
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed font-light">
                Finding the right electricity plan that fits your lifestyle has never been easier.
              </p>
            </div>

            {/* Enhanced ZIP Code Input */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative flex items-stretch bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex-1 flex items-center gap-3 px-6 py-5 bg-white">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto placeholder:text-gray-400 font-medium"
                    maxLength={5}
                  />
                </div>
                <Button
                  onClick={onCompare}
                  className="px-12 py-5 text-lg font-bold rounded-none border-0 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Compare Rates
                </Button>
              </div>
            </div>

            {/* Secondary CTA with Icon */}
            <div className="flex items-center gap-4">
              <Link
                to={createPageUrl("BusinessRates")}
                className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg transition-all"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Shop Business Electricity Rates
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">100% Free</p>
                  <p className="text-xs text-gray-500">No hidden fees</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Instant Results</p>
                  <p className="text-xs text-gray-500">Compare in seconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Illustration with Enhanced Effects */}
          <div className="relative animate-fade-in-right">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 rounded-3xl opacity-20 blur-2xl"></div>
            <div className="relative transform hover:scale-105 transition-transform duration-500">
              <img 
                src="https://www.powerwizard.com/wp-content/uploads/2025/08/hero-house-4-600x435-1-e1755614726248.webp"
                alt="Smart home with electricity savings"
                className="w-full h-auto drop-shadow-2xl"
              />
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">$</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Avg. Savings</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">$475</p>
                  </div>
                </div>
              </div>
            </div>
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
          50% { transform: translateY(-15px); }
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
    </section>
  );
}