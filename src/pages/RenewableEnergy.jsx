import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Leaf, Sun, Wind, Droplet, CheckCircle, TrendingDown, 
  Shield, Heart, MapPin, ArrowRight, ChevronDown, Zap,
  Award, Globe, Sprout
} from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";

export default function RenewableEnergy() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Filter for renewable plans
  const renewablePlans = plans
    .filter(plan => plan.renewable_percentage >= 50)
    .sort((a, b) => b.renewable_percentage - a.renewable_percentage)
    .slice(0, 6);

  const benefits = [
    {
      icon: Heart,
      title: "Environmental Impact",
      description: "Reduce your carbon footprint by supporting clean, renewable energy from wind and solar farms nationwide"
    },
    {
      icon: TrendingDown,
      title: "Competitive Pricing",
      description: "Renewable energy plans are often priced competitively with traditional plans, sometimes even cheaper"
    },
    {
      icon: Shield,
      title: "Fixed Rate Protection",
      description: "Lock in stable rates with fixed-term renewable plans to protect against market volatility"
    },
    {
      icon: Award,
      title: "Support Clean Energy",
      description: "Your choice directly supports the growth of renewable energy infrastructure across America"
    }
  ];

  const energyTypes = [
    {
      icon: Wind,
      title: "Wind Energy",
      color: "blue",
      description: "Wind farms across TX, PA, OH, IL, and other states generate clean electricity from renewable wind resources",
      percentage: "Leading",
      stat: "renewable source"
    },
    {
      icon: Sun,
      title: "Solar Energy",
      color: "yellow",
      description: "Rapidly growing solar capacity nationwide, harnessing sunshine to power homes and businesses",
      percentage: "Fastest",
      stat: "growing source"
    },
    {
      icon: Droplet,
      title: "Hydro & Other",
      color: "cyan",
      description: "Hydroelectric and other renewable sources contribute to America's diverse clean energy portfolio",
      percentage: "Clean",
      stat: "& reliable"
    }
  ];

  const myths = [
    {
      myth: "Renewable energy is more expensive",
      reality: "Many renewable plans are competitively priced and can actually save you money. Abundant wind and solar resources make clean energy affordable nationwide."
    },
    {
      myth: "Renewable energy isn't reliable",
      reality: "Diverse renewable energy sources (wind, solar, hydro) combined with modern grid infrastructure ensure reliable power delivery 24/7 across all states."
    },
    {
      myth: "Switching to renewable is complicated",
      reality: "Switching to a renewable plan is as easy as switching to any other electricity plan - often taking just a few minutes online."
    },
    {
      myth: "My individual choice doesn't matter",
      reality: "Every household that switches to renewable energy supports clean energy development and reduces carbon emissions by several tons per year."
    }
  ];

  const faqs = [
    {
      id: 1,
      question: "What does 100% renewable energy mean?",
      answer: "When you choose a 100% renewable energy plan, your electricity provider purchases Renewable Energy Credits (RECs) equal to your usage from renewable sources like wind and solar farms. This ensures that for every kWh you use, an equivalent amount of clean energy is added to the Texas grid. While the actual electrons may be mixed, your plan financially supports renewable energy production."
    },
    {
      id: 2,
      question: "Are renewable energy plans more expensive?",
      answer: "Not necessarily! Many renewable energy plans are priced competitively with traditional plans. Thanks to Texas' abundant wind resources and growing solar capacity, renewable energy has become very cost-effective. In fact, some 100% renewable plans are among the cheapest available. The best way to know is to compare rates - you might be surprised at how affordable clean energy can be."
    },
    {
      id: 3,
      question: "Will my power be less reliable with renewable energy?",
      answer: "No. When you choose a renewable energy plan, your power reliability remains exactly the same. You're still connected to the same Texas grid with the same infrastructure. The difference is that your provider sources renewable energy credits equivalent to your usage. Your lights stay on 24/7 regardless of weather conditions."
    },
    {
      id: 4,
      question: "How does renewable energy help the environment?",
      answer: "Renewable energy reduces greenhouse gas emissions and air pollution by displacing fossil fuel generation. An average Texas household using 100% renewable energy avoids approximately 7-10 tons of CO2 emissions per year - equivalent to planting 150+ trees or not driving 16,000 miles. Your choice directly supports the development of more wind and solar farms in Texas."
    },
    {
      id: 5,
      question: "Can I get renewable energy anywhere in Texas?",
      answer: "Yes! If you live in a deregulated area of Texas (which covers about 85% of the state), you can choose from many 100% renewable energy plans. The deregulated areas include major cities like Houston, Dallas, Fort Worth, Austin, and San Antonio. Use our comparison tool to see renewable options in your ZIP code."
    }
  ];

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Resources", url: "/learning-center" },
    { name: "Renewable Energy", url: "/renewable-energy" }
  ]);

  const faqSchema = getFAQSchema(faqs);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="100% Renewable Energy Plans - Green Electricity Rates Across 12 States | Power Scouts"
        description="Compare 100% renewable energy plans from wind and solar in TX, PA, NY, OH, IL, NJ, MD, MA, ME, NH, RI, CT. Green electricity at competitive rates. 50+ clean energy plans. Reduce carbon footprint. Save money while supporting renewable energy. Fixed & variable green energy rates. Switch to solar and wind power today."
        keywords="renewable energy plans, 100% green energy, renewable electricity, solar energy plans, wind energy plans, clean energy, green electricity providers, renewable energy rates, eco-friendly electricity, sustainable energy plans, carbon-free electricity, green power, renewable energy Texas, renewable energy Pennsylvania, renewable energy New York, wind power plans, solar power plans"
        canonical="/renewable-energy"
        structuredData={[breadcrumbData, faqSchema]}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 border-4 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Leaf className="w-12 h-12" />
              <Wind className="w-10 h-10" />
              <Sun className="w-12 h-12" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              100% Renewable Energy Plans Across America
            </h1>
            <p className="text-lg text-green-100">
              Power your home with clean energy from wind and solar farms. Good for the planet, great for your wallet. Available in 12 states.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">50+</div>
              <div className="text-sm text-gray-600">Renewable Plans</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">12</div>
              <div className="text-sm text-gray-600">States Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">7-10</div>
              <div className="text-sm text-gray-600">Tons CO2 Saved/Year</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">$0</div>
              <div className="text-sm text-gray-600">Extra Cost</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ZIP Code Search */}
        <section className="mb-20">
          <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Find Renewable Energy Plans in Your Area
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Enter your ZIP code to compare 100% renewable energy rates
              </p>

              <div className="bg-white rounded-xl shadow-lg p-1.5 max-w-2xl mx-auto mb-6">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="Enter ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto font-semibold"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("RenewableCompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white h-full">
                      Compare Green Plans
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>100% Renewable Options</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Competitive Rates</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Easy Switching</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SEO Content Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Clean Energy Plans Across 12 States
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-base leading-relaxed mb-4">
                Renewable energy plans are now available across Texas, Pennsylvania, New York, Ohio, Illinois, New Jersey, Maryland, Massachusetts, Maine, New Hampshire, Rhode Island, and Connecticut. These 100% renewable electricity plans source power from wind farms, solar installations, and other clean energy sources, allowing you to reduce your carbon footprint without installing solar panels or making any changes to your home.
              </p>
              <p className="text-base leading-relaxed">
                Whether you're in Houston, Dallas, Chicago, Philadelphia, New York City, or any other city in a deregulated market, you can choose from dozens of renewable energy providers offering competitive rates. Many green energy plans are priced similarly to traditional electricity plans, and some are even cheaper. By choosing renewable energy, you're supporting the growth of clean energy infrastructure while potentially saving money on your monthly electricity bills.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Renewable Energy?
            </h2>
            <p className="text-xl text-gray-600">
              Good for the environment and your budget
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-2 hover:shadow-lg transition-all">
                  <CardContent className="p-8 flex gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Energy Types Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Renewable Energy Sources
            </h2>
            <p className="text-xl text-gray-600">
              Clean energy from wind, solar, and hydroelectric sources
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {energyTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card key={index} className="border-2 hover:border-green-500 hover:shadow-xl transition-all">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 bg-${type.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                      <Icon className={`w-10 h-10 text-${type.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{type.title}</h3>
                    <div className="text-3xl font-bold text-green-600 mb-1">{type.percentage}</div>
                    <div className="text-sm text-gray-600 mb-4">{type.stat}</div>
                    <p className="text-gray-600 leading-relaxed">{type.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Top Renewable Plans */}
        {renewablePlans.length > 0 && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Renewable Energy Plans
              </h2>
              <p className="text-xl text-gray-600">
                Current 100% renewable plans available in your area
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renewablePlans.map((plan) => (
                <Card key={plan.id} className="border-2 hover:border-green-500 hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.provider_name}</h3>
                        <p className="text-sm text-gray-600">{plan.plan_name}</p>
                      </div>
                      <div className="bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <Leaf className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">{plan.renewable_percentage}%</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 mb-4 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {plan.rate_per_kwh.toFixed(1)}¢
                      </div>
                      <div className="text-sm text-gray-600">per kWh</div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Contract Length:</span>
                        <span className="font-semibold text-gray-900">{plan.contract_length || 'N/A'} months</span>
                      </div>
                      {plan.monthly_base_charge > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Base Charge:</span>
                          <span className="font-semibold text-gray-900">${plan.monthly_base_charge.toFixed(2)}/mo</span>
                        </div>
                      )}
                    </div>

                    <Link to={createPageUrl("CompareRates")}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to={createPageUrl("RenewableCompareRates")}>
                <Button variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-50">
                  View All Renewable Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Myths vs Reality Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Common Myths About Renewable Energy
            </h2>
            <p className="text-xl text-gray-600">
              Let's separate fact from fiction
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {myths.map((item, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-red-600">✗</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Myth:</h3>
                      <p className="text-gray-700">{item.myth}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Reality:</h3>
                      <p className="text-gray-700">{item.reality}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Environmental Impact Section */}
        <section className="mb-20">
          <Card className="bg-gradient-to-br from-green-600 to-teal-600 text-white border-0">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <Globe className="w-16 h-16 mb-6 opacity-90" />
                  <h2 className="text-3xl font-bold mb-4">
                    Your Impact Matters
                  </h2>
                  <p className="text-lg text-green-100 mb-6">
                    Switching to 100% renewable energy makes a real difference for our planet and future generations.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-bold mb-1">Reduce Carbon Emissions</div>
                        <div className="text-green-100">Average household avoids 7-10 tons of CO2 per year</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-bold mb-1">Support Clean Energy Growth</div>
                        <div className="text-green-100">Drive investment in wind and solar farms nationwide</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-bold mb-1">Cleaner Air & Water</div>
                        <div className="text-green-100">Reduce pollution and improve public health</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">Equivalent To:</h3>
                  <div className="space-y-6">
                    <div className="text-center">
                      <Sprout className="w-12 h-12 mx-auto mb-3" />
                      <div className="text-4xl font-bold mb-2">150+</div>
                      <div className="text-green-100">Tree Seedlings Planted</div>
                    </div>
                    <div className="text-center">
                      <Zap className="w-12 h-12 mx-auto mb-3" />
                      <div className="text-4xl font-bold mb-2">16,000</div>
                      <div className="text-green-100">Miles Not Driven</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Renewable Energy FAQs
          </h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <Card 
                key={faq.id} 
                className="border-2 hover:border-green-500 transition-all cursor-pointer overflow-hidden"
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-green-600 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
            <CardContent className="p-12 text-center">
              <Leaf className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Go Green?
              </h2>
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                Compare 100% renewable energy plans and start making a positive impact today
              </p>
              
              <div className="bg-white rounded-xl shadow-lg p-1.5 max-w-2xl mx-auto mb-6">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="Enter your ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 text-lg p-0 h-auto font-semibold"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("RenewableCompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                      Compare Now
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>100% Renewable</span>
                </div>
                <span className="text-green-300">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Competitive Rates</span>
                </div>
                <span className="text-green-300">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Easy Switch</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}