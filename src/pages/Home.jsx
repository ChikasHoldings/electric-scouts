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

      {/* CTA Section */}
      <section className="bg-slate-50 py-10 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-center">
                  <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                    Your Next Bill Could Be $67 Lower
                  </h2>
                  <p className="text-sm sm:text-base opacity-90 mb-4 sm:mb-6">
                    That's the average monthly savings our customers see after switching. The only question is — how much are you leaving on the table?
                  </p>
                  <ul className="space-y-2.5 sm:space-y-3">
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Personalized top 10 plan matches</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Free Bill Analyzer finds hidden fees</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Switch in 5 minutes, power stays on</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">100% free — we never charge you</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                    See What You Could Save
                  </h3>
                  <div className="space-y-5">
                    <div className="h-16 px-4 py-4 border-2 rounded-xl bg-white">
                      <ValidatedZipInput
                        value={zipCode}
                        onChange={handleZipChange}
                        placeholder="Enter your ZIP code"
                        className="text-xl [&_input]:text-xl [&_input]:h-8 [&_input]:placeholder:text-gray-400"
                        onValidationChange={setIsZipValid}
                      />
                    </div>

                    <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                      <Button
                        className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-14 text-base font-bold touch-manipulation rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300"
                        disabled={!isZipValid}>
                        Show Me My Rates
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>

                    <div className="text-center">
                      <Link to={createPageUrl("BillAnalyzer")} className="inline-flex items-center gap-2 text-[#0A5C8C] hover:text-[#FF6B35] text-sm font-semibold transition-colors">
                        <FileText className="w-4 h-4" />
                        Or upload your bill for a free analysis
                      </Link>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
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
      <React.Suspense fallback={<div className="py-16 bg-white"></div>}>
        <SEOContentSection />
      </React.Suspense>
    </div>);

}
