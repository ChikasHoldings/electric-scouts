import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Award, Users, Heart, CheckCircle, ArrowRight, Mail, Zap, Shield, TrendingDown, Globe, Target, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema, getOrganizationSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";

export default function AboutUs() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about-us" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="About Electric Scouts | Who We Are & Why We Built This"
        description="Electric Scouts was built with one goal: make it dead simple to find a better electricity deal. We are an independent comparison platform covering 12 deregulated states, 40+ providers, and hundreds of plans. No hidden fees, no bias — just clarity."
        keywords="about electricscouts, electricity comparison platform, energy comparison service, who we are, our mission, electricity shopping help, trusted energy comparison"
        canonical="/about-us"
        structuredData={[breadcrumbData, getOrganizationSchema()]}
      />

      {/* Hero Section with Image */}
      <div className="relative bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <PageBreadcrumbs
                items={[
                  { name: "Home", url: "/" },
                  { name: "About Us" }
                ]}
                variant="light"
                className="mb-4"
              />
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm text-blue-100 mb-6">
                <Zap className="w-4 h-4" />
                Serving 12 States Across America
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                We Built the <span className="text-[#FF6B35]">Electricity Tool</span> We Wished Existed
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed mb-8">
                Electric Scouts is an independent platform that makes it simple to find a better electricity deal. We pull live rates from 40+ providers across 12 deregulated states so you can compare, decide, and switch — all without the sales pressure.
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>40+ Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>No Obligations</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="/images/about-hero.jpg" 
                alt="Electric Scouts team analyzing electricity rate comparison data" 
                className="rounded-2xl shadow-2xl w-full object-cover h-[400px]"
              loading="lazy" />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "12", label: "States Served", icon: Globe, color: "blue" },
            { value: "40+", label: "Energy Providers", icon: Zap, color: "orange" },
            { value: "$800", label: "Avg. Annual Savings", icon: TrendingDown, color: "green" },
            { value: "4.8★", label: "Customer Rating", icon: Award, color: "purple" }
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-5 text-center">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${
                  stat.color === 'blue' ? 'text-blue-600' : 
                  stat.color === 'orange' ? 'text-orange-500' : 
                  stat.color === 'green' ? 'text-green-600' : 'text-purple-600'
                }`} />
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Our Mission */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <div className="w-20 h-1 bg-[#FF6B35] mx-auto rounded-full"></div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 lg:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <Target className="w-12 h-12 text-[#0A5C8C] mx-auto mb-6" />
              <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium">
                "We believe picking an electricity plan should be as easy as choosing a streaming service. Our mission is to strip away the complexity, lay out every option side by side, and let you decide what’s best for your wallet and your values."
              </p>
              <p className="text-lg text-gray-600 mt-6 leading-relaxed">
                In states with energy choice, you have the freedom to pick your provider — but freedom without clarity is just confusion. Electric Scouts organizes the chaos: we gather every available plan, normalize the fine print, and present your options in a format that actually makes sense. No jargon, no upsells, just the facts you need to make a smart call.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="w-20 h-1 bg-[#FF6B35] rounded-full mb-8"></div>
              <div className="space-y-5 text-lg text-gray-600 leading-relaxed">
                <p>
                  It started with a frustrating afternoon spent comparing electricity plans in a spreadsheet. Dozens of tabs, confusing rate structures, hidden fees buried in fine print — and still no confidence we were getting a fair deal. That’s when we decided to build something better.
                </p>
                <p>
                  Electric Scouts launched in Texas — one of the most competitive energy markets in the country — with a simple idea: pull every available plan into one place and let people see the real numbers. No jargon, no sponsored rankings, no pressure to sign up.
                </p>
                <p>
                  Today we cover 12 deregulated states, 40+ providers, and hundreds of plans. Thousands of households and businesses use Electric Scouts every month to find rates that actually fit their needs — and on average, switchers save around $800 a year.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { year: "2019", event: "Electric Scouts founded in Texas", detail: "Launched with a mission to bring transparency to electricity shopping" },
                { year: "2020", event: "Expanded to 6 states", detail: "Added Pennsylvania, New York, Illinois, Ohio, and New Jersey" },
                { year: "2022", event: "Reached 10,000+ users", detail: "Milestone of helping thousands of families save on electricity" },
                { year: "2024", event: "12 states, 40+ providers", detail: "Added Maryland, Massachusetts, Connecticut, and more" },
                { year: "2025", event: "Business & Renewable tools", detail: "Launched commercial rates comparison and green energy tools" },
                { year: "2026", event: "AI-powered bill analysis", detail: "Introduced smart bill analyzer for personalized savings recommendations" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-16 h-16 bg-[#0A5C8C] text-white rounded-xl flex items-center justify-center font-bold text-sm">
                    {item.year}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{item.event}</h4>
                    <p className="text-sm text-gray-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">What We Do</h2>
            <div className="w-20 h-1 bg-[#FF6B35] mx-auto rounded-full mb-4"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Electric Scouts provides a complete suite of free tools to help you find, compare, and switch to better electricity plans.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                color: "bg-blue-100 text-blue-600",
                title: "Rate Comparison",
                desc: "Compare electricity rates from 40+ providers across 12 states. Enter your ZIP code and see every available plan ranked by price, term length, and features — all in one place."
              },
              {
                icon: Zap,
                color: "bg-orange-100 text-orange-600",
                title: "Bill Analysis",
                desc: "Upload your electricity bill or enter your details manually. Our analyzer breaks down your costs, identifies overcharges, and recommends plans that could save you hundreds per year."
              },
              {
                icon: Lightbulb,
                color: "bg-green-100 text-green-600",
                title: "Green Energy Options",
                desc: "Find 100% renewable energy plans from certified green providers. Compare solar, wind, and clean energy options without sacrificing savings or convenience."
              },
              {
                icon: Users,
                color: "bg-purple-100 text-purple-600",
                title: "Business Solutions",
                desc: "Specialized comparison tools for small businesses, offices, and commercial properties. Find competitive business electricity rates tailored to your industry and usage."
              },
              {
                icon: Shield,
                color: "bg-teal-100 text-teal-600",
                title: "Unbiased Recommendations",
                desc: "Our comparison algorithm ranks plans objectively based on price and value. We're not owned by any provider, so our recommendations are always in your best interest."
              },
              {
                icon: Heart,
                color: "bg-red-100 text-red-600",
                title: "Ongoing Support",
                desc: "Rate drop alerts, contract renewal reminders, and market updates keep you informed. We help you stay on the best plan — not just today, but every day."
              }
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Values */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <div className="w-20 h-1 bg-[#FF6B35] mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Transparency",
                desc: "Every rate, fee, and plan detail is presented clearly. We never hide costs or use misleading comparisons. What you see is what you get.",
                gradient: "from-blue-500 to-blue-700"
              },
              {
                icon: Heart,
                title: "Customer First",
                desc: "We exist to serve you, not providers. Our recommendations are based on what saves you the most money, not what earns us the highest commission.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: Lightbulb,
                title: "Innovation",
                desc: "From AI-powered bill analysis to real-time rate tracking, we continuously invest in technology that makes electricity shopping faster and smarter.",
                gradient: "from-green-500 to-teal-600"
              }
            ].map((item, i) => (
              <div key={i} className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-8 text-white text-center`}>
                <item.icon className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/90 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Electric Scouts */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Electric Scouts?</h2>
            <div className="w-20 h-1 bg-[#FF6B35] mx-auto rounded-full"></div>
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 lg:p-12">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { title: "100% Free Service", desc: "Our comparison tool is completely free. No hidden costs, no subscriptions, no obligations — ever." },
                  { title: "Comprehensive Coverage", desc: "Access plans from 40+ providers across 12 deregulated states. The widest selection available anywhere." },
                  { title: "Real-Time Rates", desc: "Our database is continuously updated with the latest rates so you always see current pricing." },
                  { title: "Independent & Unbiased", desc: "We're not owned by any electricity provider. Our comparisons are fair, objective, and always in your favor." },
                  { title: "Easy Switching", desc: "Found a better plan? Switch directly through our platform with same-day or next-day activation." },
                  { title: "Expert Support", desc: "Our energy experts are available to answer questions and guide you through the comparison process." },
                  { title: "Proven Track Record", desc: "Thousands of satisfied customers trust Electric Scouts to find them the best electricity rates." },
                  { title: "Personalized Results", desc: "Our smart algorithms consider your location, usage, and preferences to recommend the best plans for you." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                      <div className="text-gray-600 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-8 lg:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Start Saving on Electricity?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of households and businesses across America who trust Electric Scouts to find the best electricity rates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to={createPageUrl("CompareRates")}>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold rounded-lg shadow-lg">
                  Compare Rates Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="mailto:support@electricscouts.com">
                <Button variant="outline" className="bg-white hover:bg-gray-100 text-[#0A5C8C] border-2 border-white px-8 py-6 text-lg font-bold rounded-lg">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-6 flex-wrap text-sm mt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>100% Free</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No Obligations</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Save Up to $800/Year</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
