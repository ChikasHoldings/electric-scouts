import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, AlertCircle, Loader2, Shield, Send } from "lucide-react";

/**
 * Reusable Email Results Component
 * 
 * Allows users to email themselves comparison results with affiliate links.
 * Works for Residential, Business, and Renewable comparison flows.
 */
export default function EmailResults({ 
  plans = [], 
  zipCode, 
  cityName, 
  monthlyUsage, 
  comparisonType = 'residential',
  accentColor = '#0A5C8C',
  getAffiliateUrl
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSendResults = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (plans.length === 0) {
      setError("No plans available to send");
      return;
    }

    setSending(true);
    setError("");

    try {
      const plansWithLinks = plans.slice(0, 6).map(plan => ({
        ...plan,
        affiliateUrl: getAffiliateUrl ? getAffiliateUrl(plan) : undefined,
      }));

      const response = await fetch("/api/send-comparison-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plans: plansWithLinks,
          zipCode,
          cityName,
          monthlyUsage,
          comparisonType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSent(true);
      } else {
        setError(data.error || "Failed to send email. Please try again.");
      }
    } catch (err) {
      console.error("Email send error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const typeLabels = {
    residential: 'Residential',
    business: 'Business',
    renewable: 'Renewable Energy',
  };

  if (sent) {
    return (
      <Card className="border-2 border-green-300 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6 text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Results Sent Successfully!</h3>
          <p className="text-green-100 text-sm">
            Your {typeLabels[comparisonType] || 'comparison'} results have been sent to
          </p>
          <p className="text-white font-semibold text-sm mt-1">{email}</p>
        </div>
        <CardContent className="p-4 sm:p-5 bg-green-50">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Check your inbox (and spam folder) for your personalized plan recommendations with direct signup links.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 overflow-hidden" style={{ borderColor: `${accentColor}40` }}>
      {/* Header bar */}
      <div 
        className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
      >
        <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">Email Me These Results</h3>
          <p className="text-white/80 text-xs sm:text-sm hidden sm:block">
            Save your top {typeLabels[comparisonType] || ''} plans with direct signup links
          </p>
        </div>
      </div>

      {/* Body */}
      <CardContent className="p-4 sm:p-6">
        <p className="text-sm text-gray-600 mb-4 sm:hidden">
          Save your top {typeLabels[comparisonType] || ''} plans with direct signup links.
        </p>
        
        {/* Email input row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendResults()}
              className="h-12 pl-10 text-base border-2 focus:ring-2"
              style={{ 
                borderColor: error ? '#ef4444' : '#e5e7eb',
                '--tw-ring-color': accentColor 
              }}
              disabled={sending}
            />
          </div>
          <Button
            onClick={handleSendResults}
            disabled={sending || !email}
            className="h-12 px-6 sm:px-8 text-white font-semibold text-base whitespace-nowrap rounded-lg shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: accentColor }}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Results
              </>
            )}
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Trust indicators */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>No spam, ever</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>One-time email only</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="w-3.5 h-3.5 text-green-500" />
            <span>Includes direct signup links</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
