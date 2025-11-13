import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Sparkles, CheckCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HeroSection({ zipCode, setZipCode, onCompare }) {
  return (
    <section className="bg-slate-50 py-16 relative overflow-hidden lg:py-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-7 animate-fade-in-up">
            {/* Star Rating with Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-200">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-gray-900 font-bold text-sm">4.8</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600 text-sm font-medium">1,200+ Reviews</span>
            </div>

            {/* Main Headline with Gradient */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5 tracking-tight">
                Find the Perfect{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]">
                  Electricity Plan
                </span>
                {" "}for Your Home
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                Compare rates from 40+ Texas providers in seconds. Switch easily and save an average of $800 per year.
              </p>
            </div>

            {/* Enhanced ZIP Code Input */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-1.5 hover:shadow-2xl hover:border-gray-300 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto placeholder:text-gray-400 font-semibold"
                    maxLength={5} />
                </div>
                <Button
                  onClick={onCompare}
                  className="px-10 py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#e55a2b] hover:to-[#e6703f] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0">
                  Compare Now
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold">Instant Results</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold">100% Free</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold">No Hidden Fees</span>
              </div>
            </div>
          </div>

          {/* Right Illustration with Enhanced Effects */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-3xl opacity-30 blur-3xl animate-pulse"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/25aa21e12_Screenshot47.png"
                alt="Electricity comparison dashboard"
                className="w-full h-auto rounded-lg" />
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