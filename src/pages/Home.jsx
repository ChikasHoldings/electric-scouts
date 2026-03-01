import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ValidatedZipInput from "../components/ValidatedZipInput";
import SEOHead, { getOrganizationSchema, getServiceSchema } from "../components/SEOHead";
import { useZipDetection } from "../components/hooks/useZipDetection";

// Lazy load heavy components for better performance
const HeroSection = React.lazy(() => import("../components/home/HeroSection"));
const AnnouncementBanner = React.lazy(() => import("../components/home/AnnouncementBanner"));
const AboutSection = React.lazy(() => import("../components/home/AboutSection"));
const ProvidersSection = React.lazy(() => import("../components/home/ProvidersSection"));
const HowItWorksSection = React.lazy(() => import("../components/home/HowItWorksSection"));
const TestimonialsSection = React.lazy(() => import("../components/home/TestimonialsSection"));
const SEOContentSection = React.lazy(() => import("../components/home/SEOContentSection"));

export default function Home() {
  const [zipCode, setZipCode] = useState("");
  const [isZipValid, setIsZipValid] = useState(false);
  const { detectedZip, saveZip } = useZipDetection();

  useEffect(() => {
    if (detectedZip && !zipCode) {
      setZipCode(detectedZip);
    }
  }, [detectedZip]);

  const handleZipChange = (newZip) => {
    setZipCode(newZip);
    if (newZip.length === 5) {
      saveZip(newZip);
    }
  };

  const structuredData = [
    getOrganizationSchema(),
    getServiceSchema("Multiple States"),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Electric Scouts",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/compare-rates?zip={zip_code}`,
        "query-input": "required name=zip_code"
      }
    }
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Electric Scouts | Stop Overpaying for Electricity — We'll Prove It"
        description="Upload your bill or enter your ZIP. Electric Scouts analyzes your usage, exposes hidden charges, and matches you with the lowest rate from 40+ providers across 12 states. Free Bill Analyzer included."
        keywords="compare electricity rates, bill analyzer, electricity providers, energy comparison, electricity plans, power companies, cheap electricity, fixed rate electricity, variable rate plans, renewable energy plans, electricity rates by zip code, switch electricity provider, deregulated electricity markets, electricity bill analysis"
        canonical="/"
        structuredData={structuredData}
      />
      <React.Suspense fallback={<div className="min-h-screen bg-white"></div>}>
        <HeroSection zipCode={zipCode} setZipCode={setZipCode} />
        <ProvidersSection />
        <AboutSection />
        <HowItWorksSection />
        <TestimonialsSection />
      </React.Suspense>

      {/* CTA Section — compact */}
      <section className="bg-slate-50 py-8 sm:py-10 lg:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] p-5 sm:p-6 lg:p-7 text-white flex flex-col justify-center">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
                    Your Next Bill Could Be $67 Lower
                  </h2>
                  <p className="text-xs sm:text-sm opacity-90 mb-3">
                    That's the average monthly savings our customers see after switching.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 opacity-80" />
                      <span className="text-xs sm:text-sm">Personalized top 10 plan matches</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 opacity-80" />
                      <span className="text-xs sm:text-sm">Free Bill Analyzer finds hidden fees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 opacity-80" />
                      <span className="text-xs sm:text-sm">Switch in 5 minutes, power stays on</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 opacity-80" />
                      <span className="text-xs sm:text-sm">100% free — we never charge you</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 sm:p-6 lg:p-7 flex flex-col justify-center">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">
                    See What You Could Save
                  </h3>
                  <div className="space-y-3">
                    <div className="h-12 px-3 py-2.5 border border-gray-200 rounded-lg bg-white">
                      <ValidatedZipInput
                        value={zipCode}
                        onChange={handleZipChange}
                        placeholder="Enter your ZIP code"
                        className="text-base [&_input]:text-base [&_input]:h-7 [&_input]:placeholder:text-gray-400"
                        onValidationChange={setIsZipValid}
                      />
                    </div>

                    <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                      <Button
                        className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-11 text-sm font-bold touch-manipulation rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-300"
                        disabled={!isZipValid}>
                        Show Me My Rates
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>

                    <div className="text-center">
                      <Link to={createPageUrl("BillAnalyzer")} className="inline-flex items-center gap-1.5 text-[#0A5C8C] hover:text-[#FF6B35] text-xs font-semibold transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                        Or upload your bill for a free analysis
                      </Link>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center">
                      No credit card required &bull; No spam &bull; Takes 60 seconds
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SEO Content Section with Internal Links */}
      <React.Suspense fallback={<div className="py-12 bg-white"></div>}>
        <SEOContentSection />
      </React.Suspense>
    </div>);
}
