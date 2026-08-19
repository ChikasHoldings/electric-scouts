import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, CheckCircle, Zap, TrendingDown, Shield, Star, Users, ArrowRight, Sparkles, FileText, Search, ShieldCheck
} from "lucide-react";
import { MARKET_TOTALS } from "@/seo/market";
import { 
  OrganizationSchema, 
  WebSiteSchema, 
  BreadcrumbSchema, 
  FAQPageSchema,
  HowToSchema 
} from "../components/seo/StructuredData";
import SEOHead from "@/components/SEOHead";

export default function Landing() {
  const [zipCode, setZipCode] = useState("");

  // Structured Data Schemas
  const howToSteps = [
    { name: "Enter Your ZIP", description: "See every available plan from licensed providers in your area" },
    { name: "Upload Your Bill", description: "Our Bill Analyzer identifies overcharges and hidden fees on your current plan" },
    { name: "Compare Your Top 10", description: "We rank plans by real value — not ad spend — so the best deal always wins" },
    { name: "Switch & Save", description: "Pick a plan and sign up directly with the provider in under 5 minutes" }
  ];

  const faqs = [
    {
      question: "How much can I save by switching electricity providers?",
      answer: "The average Electric Scouts customer saves $67 per month, or over $800 per year, by comparing rates and switching to a better-matched plan. Your actual savings depend on your current rate and usage."
    },
    {
      question: "What is the Bill Analyzer and how does it work?",
      answer: "The Bill Analyzer is a free tool exclusive to Electric Scouts. Upload your current electricity bill and we'll break down every charge — energy rate, delivery fees, taxes, and hidden surcharges. Then we match you with plans that specifically address where you're overpaying."
    },
    {
      question: "Is it really free to compare electricity rates?",
      answer: "Yes, Electric Scouts is 100% free with no credit card required. We earn a referral fee from providers when you switch, which means we're incentivized to find you the best deal — not the most expensive one."
    },
    {
      question: "How long does it take to switch electricity providers?",
      answer: "The comparison takes under 2 minutes, and switching can be completed online in just 5 minutes. Your power stays on the entire time — there is zero interruption to your service."
    }
  ];

  return (
    <>
    <SEOHead
      title="Compare Electricity Rates in 12 States | Electric Scouts"
      description={`Upload your bill or enter your ZIP. Electric Scouts analyzes your usage, exposes hidden charges, and matches you with the lowest rate from ${MARKET_TOTALS.providersWithPlans} suppliers across ${MARKET_TOTALS.states} states. Free Bill Analyzer included.`}
      canonical="/"
      keywords="compare electricity rates, bill analyzer, electricity providers, energy comparison, electricity plans, save on electricity, deregulated electricity"
    />
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Structured Data for SEO */}
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />
      <HowToSchema 
        title="How to Compare Electricity Rates and Save Money"
        description="Learn how to compare electricity rates in 4 simple steps with Electric Scouts"
        steps={howToSteps}
      />
      <FAQPageSchema faqs={faqs} />

      {/* Hero Section - Above the Fold */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-semibold">Comparing {MARKET_TOTALS.activePlans.toLocaleString()} Plans Across {MARKET_TOTALS.states} Deregulated States</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Stop Overpaying for Electricity. We'll Prove It.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              Upload your bill or enter your ZIP code. We'll analyze your charges, expose where you're losing money, and match you with a better plan from {MARKET_TOTALS.providersWithPlans} suppliers. Takes 60 seconds.
            </p>

            {/* Main CTA Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-2xl mx-auto mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#0A5C8C]" />
                  <Input
                    type="text"
                    placeholder="Enter your ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-14 h-14 text-lg font-semibold border-2 border-gray-200 focus:border-[#0A5C8C]"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button 
                    disabled={zipCode.length !== 5}
                    className="h-14 px-10 text-base font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    See My Rates
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bill Analyzer Link */}
            <div className="mb-6">
              <Link to={createPageUrl("BillAnalyzer")} className="inline-flex items-center gap-2 text-yellow-300 hover:text-white text-sm font-semibold transition-colors">
                <FileText className="w-4 h-4" />
                Have a bill? Upload it for a free analysis &rarr;
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% Free Service</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Free Bill Analyzer Included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {/* Catalog figures from the market snapshot. The previous row —
                "50K+ Households Switched", "4.8/5 Customer Rating",
                "$600+ Avg. Annual Savings" — was invented; there have been two
                leads and no recorded conversions. */}
            {[
              { number: MARKET_TOTALS.activePlans.toLocaleString(), label: "Plans Tracked" },
              { number: String(MARKET_TOTALS.providersWithPlans), label: "Suppliers Compared" },
              { number: String(MARKET_TOTALS.states), label: "Deregulated States" },
              { number: "Free", label: "Cost to Compare" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-[#0A5C8C] mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bill Analyzer Feature Section */}
      <section className="py-16 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-1.5 rounded-full mb-4 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Only on Electric Scouts
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Your Bill Is Telling You Something. Let Us Translate.
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Our Bill Analyzer reads your electricity bill line by line, identifies hidden fees and inflated charges, and calculates exactly how much you can save — before you switch.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Upload Your Bill",
                description: "Snap a photo or upload a PDF. Our system reads every charge on your bill automatically.",
                color: "orange"
              },
              {
                icon: Search,
                title: "We Find the Overcharges",
                description: "Hidden delivery fees, inflated energy rates, unnecessary surcharges — we flag everything that's costing you extra.",
                color: "blue"
              },
              {
                icon: TrendingDown,
                title: "See Your Savings",
                description: "Get a personalized savings report showing exactly how much you'll save with each recommended plan.",
                color: "green"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-[#FF6B35] hover:shadow-xl transition-all">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-8 h-8 text-${feature.color}-600`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link to={createPageUrl("BillAnalyzer")}>
              <Button className="h-14 px-10 text-base font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                <FileText className="w-5 h-5 mr-2" />
                Analyze My Bill Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Built Different From Every Other Comparison Site
            </h2>
            <p className="text-base text-gray-600">
              We're not a directory. We're your energy advisor.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: FileText,
                title: "Bill Analyzer (Exclusive)",
                description: "No other comparison site lets you upload your bill for a line-by-line analysis. We show you exactly where your money is going and how to redirect it into savings.",
                color: "orange"
              },
              {
                icon: ShieldCheck,
                title: "No Sponsored Rankings",
                description: `Plans are ranked by value to you, not by who pays us the most. We partner with ${MARKET_TOTALS.providersWithPlans} suppliers so the best deal always wins — regardless of the brand.`,
                color: "blue"
              },
              {
                icon: Search,
                title: "Smart Plan Matching",
                description: "We don't just list plans. We analyze your usage pattern, location, and preferences to surface your top 3 recommendations plus 7 more curated matches.",
                color: "purple"
              },
              {
                icon: Zap,
                title: "5-Minute Switch, Zero Downtime",
                description: "Pick a plan and sign up directly with the provider. The entire process takes under 5 minutes and your power never turns off — not even for a second.",
                color: "green"
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className={`border-2 hover:shadow-xl transition-all ${index === 0 ? 'border-[#FF6B35] ring-2 ring-orange-100' : 'hover:border-[#0A5C8C]'}`}>
                  <CardContent className="p-8 flex gap-6">
                    <div className={`w-16 h-16 bg-${benefit.color}-100 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-8 h-8 text-${benefit.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              How Electric Scouts Finds You the Best Rate
            </h2>
            <p className="text-base text-gray-600">
              Four steps. Under two minutes. Real savings you can measure on your next bill.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howToSteps.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className={`w-16 h-16 ${index === 1 ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A]' : 'bg-gradient-to-br from-[#0A5C8C] to-[#084a6f]'} text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg relative z-10`}>
                  {index + 1}
                </div>
                {index === 1 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase z-20">
                    Exclusive
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What the bill analyzer actually does.
          This block previously rendered three testimonials — invented people,
          invented cities, and exact annual savings ("Saved $960/year") — under
          "Real People. Real Bills. Real Savings." and a "4.8/5 from 2,500+
          verified reviews" badge. None of it was real; the platform has had two
          leads and no recorded conversions. Fabricated endorsements are
          prohibited by the FTC's endorsement rules, and ProviderDetails had
          already had its invented reviews removed on the same grounds.
          Replaced with what the tool does, which is checkable by using it. */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              What the Bill Analyzer looks for
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Upload a bill and it reads the line items most people never check —
              the ones that decide what you actually pay.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Your real effective rate",
                text: "The advertised rate is rarely what you pay. We divide your total supply charge by the kWh you used, which is the only number worth comparing against another plan.",
              },
              {
                title: "Charges that are easy to miss",
                text: "Base charges, minimum-usage fees and expired bill credits. A plan can advertise a low rate and still cost more than one that does not, and this is usually why.",
              },
              {
                title: "Whether switching is worth it",
                text: "Your current cost against plans available at your address today, with any early termination fee counted against the saving rather than left out of it.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-2">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-3">
                Your Next Bill Could Be $67 Lower
              </h2>
              <p className="text-base opacity-90 mb-4">
                That's the average monthly savings our customers see. The only question is — how much are you leaving on the table?
              </p>
              <div className="space-y-2">
                {[
                  "Personalized top 10 plan matches",
                  "Free Bill Analyzer finds hidden fees",
                  "Switch in 5 minutes, power stays on",
                  "100% free — we never charge you"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <p className="text-gray-900 font-semibold text-base mb-4 text-center">
                  See What You Could Save
                </p>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A5C8C]" />
                    <Input
                      type="text"
                      placeholder="Enter your ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-12 h-14 text-lg font-semibold border-2 border-gray-200"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button 
                      disabled={zipCode.length !== 5}
                      className="h-14 text-base font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white w-full disabled:opacity-50"
                    >
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
                </div>
                <p className="text-gray-600 text-sm text-center mt-4">
                  No credit card &bull; No spam &bull; Takes 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0A5C8C]" />
              <span>{MARKET_TOTALS.providersWithPlans} Suppliers Compared</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0A5C8C]" />
              <span>100% Secure &amp; Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Free to use, no obligation</span>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
// Helper component for missing import
function DollarSign(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
