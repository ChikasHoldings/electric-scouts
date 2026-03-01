import React, { useState, useEffect } from "react";
import { Zap, Building, Leaf, Shield, Search, BarChart3, CheckCircle2 } from "lucide-react";

const THEMES = {
  residential: {
    icon: Zap,
    gradient: "from-[#0A5C8C] to-[#084a6f]",
    accent: "#FF6B35",
    accentLight: "rgba(255,107,53,0.1)",
    ring: "#0A5C8C",
    steps: [
      { label: "Scanning providers in your area", icon: Search },
      { label: "Analyzing rate structures", icon: BarChart3 },
      { label: "Comparing plans for best value", icon: Shield },
      { label: "Preparing your personalized results", icon: CheckCircle2 },
    ],
  },
  business: {
    icon: Building,
    gradient: "from-[#0A5C8C] to-[#084a6f]",
    accent: "#0A5C8C",
    accentLight: "rgba(10,92,140,0.1)",
    ring: "#0A5C8C",
    steps: [
      { label: "Identifying commercial providers", icon: Search },
      { label: "Evaluating business rate tiers", icon: BarChart3 },
      { label: "Matching plans to your usage", icon: Shield },
      { label: "Finalizing your business recommendations", icon: CheckCircle2 },
    ],
  },
  renewable: {
    icon: Leaf,
    gradient: "from-emerald-600 to-green-700",
    accent: "#059669",
    accentLight: "rgba(5,150,105,0.1)",
    ring: "#059669",
    steps: [
      { label: "Locating green energy providers", icon: Search },
      { label: "Verifying renewable certifications", icon: Shield },
      { label: "Comparing clean energy rates", icon: BarChart3 },
      { label: "Curating your green energy options", icon: CheckCircle2 },
    ],
  },
};

export default function PlanSearchLoader({ type = "residential", providerCount = 0, onComplete }) {
  const theme = THEMES[type] || THEMES.residential;
  const MainIcon = theme.icon;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation — smooth fill over ~3.2 seconds
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 0.8;
      });
    }, 25);

    // Step transitions at 0.8s intervals
    const stepTimers = theme.steps.map((_, i) =>
      setTimeout(() => setCurrentStep(i), i * 800)
    );

    // Complete after ~3.5 seconds
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      stepTimers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Main spinner area */}
        <div className="text-center mb-10">
          {/* Outer ring */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            {/* Background ring */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={theme.ring}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 3.27} 327`}
                transform="rotate(-90 60 60)"
                className="transition-all duration-100 ease-linear"
              />
            </svg>
            {/* Spinning accent ring */}
            <div
              className="absolute inset-2 rounded-full animate-spin"
              style={{
                border: `3px solid transparent`,
                borderTopColor: theme.accent,
                animationDuration: "1.5s",
              }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: theme.accentLight }}
              >
                <MainIcon className="w-7 h-7" style={{ color: theme.accent }} />
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Finding Your Best Rates
          </h2>
          <p className="text-sm text-gray-500">
            {providerCount > 0
              ? `Analyzing ${providerCount} providers in your area`
              : "Scanning available providers"}
          </p>
        </div>

        {/* Step indicators */}
        <div className="space-y-3 mb-8">
          {theme.steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  isActive
                    ? "bg-white shadow-md border border-gray-100 scale-[1.02]"
                    : isDone
                    ? "bg-gray-50 opacity-60"
                    : "opacity-30"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    isDone
                      ? "bg-green-100"
                      : isActive
                      ? ""
                      : "bg-gray-100"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: theme.accentLight }
                      : {}
                  }
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <StepIcon
                      className="w-4 h-4"
                      style={{ color: isActive ? theme.accent : "#9ca3af" }}
                    />
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive ? "text-gray-900" : isDone ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.accent, animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.accent, animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.accent, animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="px-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: `linear-gradient(90deg, ${theme.ring}, ${theme.accent})`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {Math.min(Math.round(progress), 100)}% complete
          </p>
        </div>
      </div>
    </div>
  );
}
