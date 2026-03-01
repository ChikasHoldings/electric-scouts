import React, { useState } from "react";
import { Bell, CheckCircle, MapPin, Mail, User, ArrowRight } from "lucide-react";

export default function RateAlertsCapture({ sourcePage = "homepage" }) {
  const [firstName, setFirstName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const alreadySubmitted = typeof window !== "undefined" && localStorage.getItem("es_rate_alerts_captured");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) { setError("Please enter your first name"); return; }
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) { setError("Please enter a valid 5-digit ZIP code"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          zip: zipCode.trim(),
          name: firstName.trim(),
          source: "rate_alerts",
          source_page: `rate_alerts_${sourcePage}`,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsSubmitted(true);
        localStorage.setItem("es_rate_alerts_captured", "true");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Rate alerts signup error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadySubmitted && !isSubmitted) return null;

  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dark container card — centered on mobile */}
        <div className="bg-[#0A2540] rounded-2xl px-6 py-8 sm:px-10 sm:py-10 mx-auto">
          {isSubmitted ? (
            <div className="flex items-center justify-center gap-3 py-2">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <p className="text-white text-base font-medium">
                You're all set, {firstName}! We'll notify you when rates drop in your area.
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
              {/* Left: Copy */}
              <div className="lg:w-5/12 flex-shrink-0 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Free Rate Alerts</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
                  Get Rate Alerts{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                    for Your Area
                  </span>
                </h3>
                <p className="text-sm text-blue-200/80 leading-relaxed">
                  Be the first to know when rates drop in your ZIP code. No spam, unsubscribe anytime.
                </p>
              </div>

              {/* Right: Form */}
              <div className="lg:w-7/12">
                <form onSubmit={handleSubmit}>
                  {/* Row 1: First Name + ZIP Code */}
                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setError(null); }}
                        placeholder="First name"
                        className="w-full pl-9 pr-3 py-3 bg-white/95 border border-white/20 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                          setZipCode(val);
                          setError(null);
                        }}
                        placeholder="ZIP code"
                        maxLength={5}
                        className="w-full pl-9 pr-3 py-3 bg-white/95 border border-white/20 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Email + Get Alerts Button */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        placeholder="Email address"
                        className="w-full pl-9 pr-3 py-3 bg-white/95 border border-white/20 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-5 rounded-lg text-sm whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Get Alerts
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <p className="mt-2 text-xs text-red-400">{error}</p>
                  )}
                  <p className="mt-2.5 text-xs text-blue-300/50 text-center sm:text-left">
                    We respect your privacy. Unsubscribe at any time.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
