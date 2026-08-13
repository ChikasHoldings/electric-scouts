import { useState, useEffect } from "react";
import { Zap, CheckCircle, X } from "lucide-react";

/**
 * Non-Intrusive Email Capture Component
 * 
 * - Inline banner — sits naturally in page flow
 * - Slide-up bar — compact, single-line bar at bottom (not covering content)
 */
export default function EmailCapture({ 
  variant = 'inline',
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

  // For slide-up variant: show after user scrolls 70% of page
  useEffect(() => {
    if (variant !== 'slide-up') return;
    
    const wasDismissed = sessionStorage.getItem('es_capture_dismissed');
    const wasSubmitted = localStorage.getItem('es_lead_captured');
    if (wasDismissed || wasSubmitted) return;

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 70) {
        setVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 8000); // Wait 8 seconds before even listening

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

  if (dismissed || !visible) return null;
  if (localStorage.getItem('es_lead_captured') && variant === 'slide-up') return null;

  // ── Success State ──
  if (submitted) {
    if (variant === 'slide-up') {
      return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-emerald-600 py-3 px-4">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-white text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{name ? `Thanks, ${name.split(' ')[0]}!` : 'Thank you!'} We'll send you the best rates.</span>
              <button onClick={handleDismiss} className="ml-3 p-1 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>{name ? `Thanks, ${name.split(' ')[0]}!` : 'Thank you!'} Check your inbox for savings tips.</span>
        </div>
      </div>
    );
  }

  // ── Inline Variant ──
  if (variant === 'inline') {
    return (
      <div className="bg-[#084a6f] rounded-xl p-5 sm:p-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Left: Copy */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">
              Get Rate Alerts for Your Area
            </h3>
            {/* No subscriber count. The previous copy claimed "Join 50,000+
                homeowners", which is not a number this platform can support —
                and a claim a visitor can disprove costs more trust than the
                claim was ever going to buy. */}
            <p className="text-sm text-white/70">
              We&rsquo;ll email you when a better rate lands in your area. No spam, unsubscribe anytime.
            </p>
          </div>

          {/* Right: Form — single row on desktop */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="First name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="h-10 px-3 text-sm bg-white/95 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400 sm:w-32"
              disabled={submitting}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="h-10 px-3 text-sm bg-white/95 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400 sm:w-48"
              required
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !email}
              className="h-10 px-5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Subscribe</>
              )}
            </button>
          </form>
        </div>
        {error && (
          <p className="text-red-300 text-xs mt-2 text-center">{error}</p>
        )}
      </div>
    );
  }

  // ── Slide-Up Bar Variant — compact, non-intrusive ──
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-out"
         style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}>
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex items-center gap-3">
            {/* Message */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <Zap className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-sm font-semibold text-gray-800">Get rate alerts</span>
            </div>

            {/* Form — inline */}
            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0A5C8C]"
                required
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !email}
                className="h-9 px-4 bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Subscribe</>
                )}
              </button>
            </form>

            {/* Dismiss */}
            <button 
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
