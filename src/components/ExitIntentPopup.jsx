import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, User, Mail, CheckCircle, TrendingDown, Shield, Zap } from "lucide-react";
import popupImage from "/images/exit-popup-illustration.png";

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const hasTriggered = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Don't show if already dismissed or submitted
    if (localStorage.getItem("exitPopupDismissed") || localStorage.getItem("rateAlertsSubmitted")) {
      hasTriggered.current = true;
      return;
    }

    // Wait at least 5 seconds before enabling exit intent detection
    timeoutRef.current = setTimeout(() => {
      const handleMouseLeave = (e) => {
        // Only trigger when mouse moves above the viewport (toward browser chrome/close button)
        if (e.clientY <= 0 && !hasTriggered.current) {
          hasTriggered.current = true;
          setIsVisible(true);
          document.removeEventListener("mouseout", handleMouseLeave);
        }
      };

      document.addEventListener("mouseout", handleMouseLeave);

      return () => {
        document.removeEventListener("mouseout", handleMouseLeave);
      };
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("exitPopupDismissed", "true");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) { setError("Please enter your first name"); return; }
    if (!/^\d{5}$/.test(zipCode)) { setError("Please enter a valid 5-digit ZIP code"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: firstName.trim(),
          email: email.trim(),
          zip_code: zipCode,
          source: "exit_intent_rate_alerts",
        }),
      });
      if (!response.ok) throw new Error("Failed to submit");
      setSubmitted(true);
      localStorage.setItem("rateAlertsSubmitted", "true");
      localStorage.setItem("exitPopupDismissed", "true");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Popup — centered with split layout */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[92vw] max-w-[720px] animate-popup-in">
        <div className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)] overflow-hidden relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors z-10 shadow-sm"
            aria-label="Close popup"
          >
            <X className="w-4 h-4" />
          </button>

          {submitted ? (
            /* ─── Success State ─── */
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                We'll notify you when rates drop in your area. Check your inbox for a confirmation email.
              </p>
              <button
                onClick={handleDismiss}
                className="px-8 py-3 bg-[#084a6f] text-white font-semibold rounded-xl hover:bg-[#063a57] transition-colors text-sm"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            /* ─── Split Layout: Image Left + Form Right ─── */
            <div className="flex flex-col md:flex-row">
              {/* Left — Image Panel */}
              <div className="hidden md:flex md:w-[44%] relative bg-gradient-to-br from-[#0A2540] to-[#084a6f] overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />

                <div className="flex flex-col justify-between p-6 relative z-10 w-full">
                  {/* Top badge */}
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6B35]/20 text-[#FF9F6B] text-xs font-semibold rounded-full mb-4">
                      <Zap className="w-3 h-3" /> FREE RATE ALERTS
                    </span>
                    <h3 className="text-white text-xl font-bold leading-snug mb-2">
                      Before You Go...
                    </h3>
                    <p className="text-blue-200/80 text-sm leading-relaxed">
                      Don't miss the chance to save on your electricity bill.
                    </p>
                  </div>

                  {/* Illustration */}
                  <div className="flex-1 flex items-center justify-center py-2">
                    <img
                      src={popupImage}
                      alt="Save on electricity"
                      className="w-full max-w-[280px] h-auto object-contain drop-shadow-lg"
                    loading="lazy" />
                  </div>

                  {/* Bottom stats */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs">
                      <TrendingDown className="w-3.5 h-3.5 text-green-400" />
                      <span>Avg. $600/yr saved</span>
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="flex items-center gap-1.5 text-white/70 text-xs">
                      <Shield className="w-3.5 h-3.5 text-blue-300" />
                      <span>50K+ users</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Form Panel */}
              <div className="flex-1 p-6 md:p-8">
                {/* Mobile-only header (shown when image panel is hidden) */}
                <div className="md:hidden text-center mb-5">
                  <div className="w-12 h-12 bg-[#084a6f]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-[#084a6f]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Before You Go...</h3>
                  <p className="text-gray-500 text-sm">Get notified when rates drop in your area.</p>
                </div>

                {/* Desktop header */}
                <div className="hidden md:block mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1.5 leading-tight">
                    Get Rate Drop Alerts
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Be the first to know when electricity rates drop in your ZIP code. 100% free.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 ml-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084a6f]/20 focus:border-[#084a6f] transition-all bg-gray-50/50 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 ml-1">ZIP Code</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084a6f]/20 focus:border-[#084a6f] transition-all bg-gray-50/50 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#084a6f]/20 focus:border-[#084a6f] transition-all bg-gray-50/50 placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs text-center py-1">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] hover:from-[#e55a2b] hover:to-[#e6703f] text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-orange-200/50 hover:shadow-orange-300/50 disabled:opacity-60 mt-1"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Get Free Rate Alerts →"
                    )}
                  </button>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Shield className="w-3 h-3" /> No spam
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <CheckCircle className="w-3 h-3" /> Free forever
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <X className="w-3 h-3" /> Unsubscribe anytime
                    </span>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popup-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-popup-in { animation: popup-in 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
      `}</style>
    </>
  );
}
