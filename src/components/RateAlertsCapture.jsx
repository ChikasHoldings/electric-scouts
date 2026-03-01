import React, { useState } from "react";
import { Bell, CheckCircle, MapPin, Mail, User, ArrowRight, Shield, Zap, Clock } from "lucide-react";

export default function RateAlertsCapture({ sourcePage = "homepage" }) {
  const [firstName, setFirstName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Check if already submitted in this session
  const alreadySubmitted = typeof window !== "undefined" && localStorage.getItem("es_rate_alerts_captured");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

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

  // Don't show if already submitted
  if (alreadySubmitted && !isSubmitted) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0A3A5C] to-[#0A5C8C]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-500 rounded-full filter blur-[120px] opacity-10" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400 rounded-full filter blur-[120px] opacity-10" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {isSubmitted ? (
          /* ─── Success State ─── */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              You're All Set, {firstName}!
            </h3>
            <p className="text-blue-200 text-base sm:text-lg max-w-lg mx-auto mb-2">
              We'll monitor rates in your area and notify you when better plans become available.
            </p>
            <p className="text-blue-300/70 text-sm">
              Check your inbox for a confirmation email.
            </p>
          </div>
        ) : (
          /* ─── Form State ─── */
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* Left: Copy */}
            <div className="lg:w-5/12 mb-8 lg:mb-0">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
                <Bell className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">Free Rate Alerts</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                Get Rate Alerts{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  for Your Area
                </span>
              </h2>
              
              <p className="text-blue-200 text-base sm:text-lg leading-relaxed mb-6">
                Be the first to know when electricity rates drop in your ZIP code. No spam — just savings opportunities delivered to your inbox.
              </p>

              {/* Trust points */}
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span className="text-sm text-blue-200">Instant alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-sm text-blue-200">No spam ever</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                  <span className="text-sm text-blue-200">Unsubscribe anytime</span>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:w-7/12">
              <form onSubmit={handleSubmit} className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* First Name */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setError(null); }}
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-3 bg-white/90 border border-white/20 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* ZIP Code */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                      ZIP Code
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => { 
                          const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                          setZipCode(val); 
                          setError(null); 
                        }}
                        placeholder="77001"
                        maxLength={5}
                        className="w-full pl-10 pr-4 py-3 bg-white/90 border border-white/20 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Email - Full Width */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/90 border border-white/20 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-400/30 rounded-xl">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 px-6 rounded-xl text-base shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting Up Alerts...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Get Rate Alerts
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-blue-300/60 mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
