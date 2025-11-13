import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, ArrowRight, Users, Award, TrendingUp, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "../components/home/HeroSection";
import AnnouncementBanner from "../components/home/AnnouncementBanner";
import AboutSection from "../components/home/AboutSection";
import ProvidersSection from "../components/home/ProvidersSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import SEOHead, { getOrganizationSchema, getServiceSchema } from "../components/SEOHead";

export default function Home() {
  const [zipCode, setZipCode] = useState("");

  const structuredData = [
    getOrganizationSchema(),
    getServiceSchema("Multiple States"),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Power Scouts",
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
        title="Compare Electricity Rates - Save Up to $800/Year in 12 States | Power Scouts"
        description="Compare electricity rates from 40+ providers in TX, PA, NY, OH, IL, NJ, MD, MA, ME, NH, RI, CT. Find the best electricity plan for your home - fixed rates, renewable energy, variable plans. Free comparison tool, instant results. Serving Houston, Dallas, Chicago, Philadelphia, NYC & 100+ cities. Switch & save today."
        keywords="compare electricity rates, best electricity rates, electricity providers, energy comparison, electricity plans, power companies, cheap electricity, fixed rate electricity, variable rate plans, renewable energy plans, electricity rates by zip code, switch electricity provider, deregulated electricity markets"
        canonical="/"
        structuredData={structuredData}
      />
      <HeroSection zipCode={zipCode} setZipCode={setZipCode} />
      <ProvidersSection />
      <AboutSection />
      <HowItWorksSection />
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="bg-slate-50 py-20 from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-none shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] p-10 text-white flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Start Saving on Electricity Today
                  </h2>
                  <p className="text-lg opacity-90 mb-6">
                    Compare plans from 40+ providers in minutes
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Instant comparison results</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>Save up to $800/year</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span>100% free, no spam</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-10 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Enter Your ZIP Code
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter ZIP code"
                      maxLength={5}
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="h-14 text-base border-2"
                      aria-label="ZIP code to compare electricity plans" />

                    <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                      <Button
                        className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-14 text-base font-semibold"
                        disabled={zipCode.length !== 5}>
                        Compare Rates Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      Free comparison • No credit card required
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>);

}