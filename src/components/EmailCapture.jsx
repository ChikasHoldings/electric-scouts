import React, { useState, useEffect } from "react";
import { Zap, Mail, CheckCircle, X, ArrowRight, Shield } from "lucide-react";

/**
 * Non-Intrusive Email Capture Component
 * 
 * A polished, subtle email capture that appears as:
 * - Inline banner (default) — sits naturally in page flow
 * - Slide-up bar — appears after scroll engagement
 * 
 * Tagged by source for admin panel tracking.
 * Captures name, email, and ZIP for personalized follow-ups.
 */
export default function EmailCapture({ 
  variant = 'inline', // 'inline' | 'slide-up'
  source = 'newsletter',
  sourcePage = 'homepage',
  zipCode = '',
  cityName = '',
  onCapture = null,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState(zipCode || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(variant === 'inline');
  const [dismissed, setDismissed] = useState(false);

  // For slide-up variant: show after user scrolls 60% of page
  useEffect(() => {
    if (variant !== 'slide-up') return;
    
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('es_capture_dismissed');
    const wasSubmitted = localStorage.getItem('es_lead_captured');
    if (wasDismissed || wasSubmitted) return;

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 60) {
        setVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    // Delay adding scroll listener to avoid showing immediately
    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 5000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [variant]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem('es_capture_dismissed', 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || submitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          zip: zip || zipCode || null,
          city: cityName || null,
          source,
          source_page: sourcePage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        localStorage.setItem('es_lead_captured', 'true');
        if (onCapture) onCapture({ email, name, zip });
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Email capture error:', err);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if dismissed or already captured
  if (dismissed || !visible) return null;
  if (localStorage.getItem('es_lead_captured') && variant === 'slide-up') return null;

  // ── Success State ──
  if (submitted) {
    return (
      <div className={`${variant === 'slide-up' ? 'fixed bottom-0 left-0 right-0 z-50 shadow-2xl' : ''}`}>
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-white">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm sm:text-base font-medium">
              {name ? `Thanks, ${name.split(' ')[0]}!` : 'Thank you!'} Check your inbox for money-saving tips and exclusive deals.
            </p>
            {variant === 'slide-up' && (
              <button onClick={handleDismiss} className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Inline Variant ──
  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-br from-[#f0f7fc] to-[#e8f4f8] border border-[#0A5C8C]/10 rounded-xl p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#0A5C8C]/10 text-[#0A5C8C] text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Save Up to $800/Year</span>
          </div>
          
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
            Get Personalized Savings Tips
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 max-w-lg mx-auto">
            Join thousands of homeowners saving on electricity. We'll send you the best rates for your area — no spam, just savings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input
                type="text"
                placeholder="First name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A5C8C] focus:ring-2 focus:ring-[#0A5C8C]/20 transition-colors"
                disabled={submitting}
              />
              <div className="flex-[2] relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A5C8C] focus:ring-2 focus:ring-[#0A5C8C]/20 transition-colors"
                  required
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !email}
                className="h-10 px-5 bg-[#0A5C8C] hover:bg-[#084a6f] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Get Savings</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}

            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-3">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                No spam, ever
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Unsubscribe anytime
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Slide-Up Bar Variant ──
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-out"
         style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}>
      <div className="bg-white border-t-2 border-[#0A5C8C] shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Left: Message */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-[#0A5C8C]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[#0A5C8C]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  Don't miss out on savings!
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Get the best electricity rates delivered to your inbox
                </p>
              </div>
            </div>

            {/* Center: Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="First name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A5C8C] sm:w-32"
                disabled={submitting}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A5C8C]"
                required
                disabled={submitting}
              />
              <input
                type="text"
                placeholder="ZIP code"
                value={zip}
                onChange={(e) => { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }}
                className="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A5C8C] sm:w-24"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !email}
                className="h-10 px-5 bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Get Rates</>
                )}
              </button>
            </form>

            {/* Right: Dismiss */}
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-xs mt-2 text-center sm:text-left sm:ml-14">{error}</p>
          )}

          <p className="text-[10px] text-gray-400 mt-2 text-center sm:text-left sm:ml-14">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
