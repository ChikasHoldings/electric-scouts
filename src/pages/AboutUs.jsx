import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Award, Users, Heart, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead, { getBreadcrumbSchema, getOrganizationSchema } from "../components/SEOHead";

export default function AboutUs() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about-us" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="About Power Scouts - America's Electricity Comparison Platform | Our Story"
        description="Learn about Power Scouts, the leading electricity rate comparison platform serving 12 states. Our mission: simplify energy shopping and help millions save on electricity. Founded to bring transparency to deregulated energy markets. Compare 40+ providers, save up to $800/year. Trusted by thousands nationwide."
        keywords="about power scouts, electricity comparison platform, energy comparison service, who we are, our mission, electricity shopping help, trusted energy comparison"
        canonical="/about-us"
        structuredData={[breadcrumbData, getOrganizationSchema()]}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              About Power Scouts
            </h1>
            <p className="text-lg text-blue-100">
              Empowering Americans to make smarter energy choices since 2019
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Section */}
        <section className="bg-white rounded-2xl shadow-xl p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Our goal is simple. To empower you by simplifying your search for electricity 
              companies and plans. Whether you're looking for the cheapest electricity rate 
              or a plan that fits your needs, we're here to help you make the best choice.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl">
              <Users className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">100+</div>
              <div className="text-gray-600">Years of Experience</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
              <Heart className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">4.8★</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Story</h2>
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                Founded in 2019, Power Scouts was created to solve a simple problem: finding the 
                right electricity plan in competitive energy markets shouldn't be complicated or 
                time-consuming.
              </p>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                With over 100 years of combined industry experience, our team of energy experts 
                has helped tens of thousands of households across 12 states navigate the complex world of electricity 
                providers and plans. We're proud to maintain a 4.8-star rating with over 1,200 
                Google reviews.
              </p>
              <p className="text-xl text-gray-600 leading-relaxed">
                Today, we continue to empower residents and businesses in Texas, Pennsylvania, New York, 
                Illinois, Ohio, New Jersey, Maryland, Massachusetts, and beyond to make informed 
                decisions about their energy needs, saving them time, money, and hassle along the way.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Comparison Service</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                We provide a completely free electricity plan comparison service across 12 competitive energy markets. 
                Our platform allows you to instantly compare rates from 40+ electricity providers, 
                helping you find the perfect plan based on your ZIP code, usage, and preferences.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Expert Guidance</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our team of energy experts is here to help you understand competitive electricity 
                markets. From fixed vs. variable rates to renewable energy options, we provide 
                clear, unbiased information to help you make informed decisions.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Time & Money Savings</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                We save you time by aggregating plans from dozens of providers in one place. 
                On average, our users save $800 per year by switching to a better plan through 
                our platform. No hidden fees, no obligations.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Continuous Support</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our service doesn't end once you choose a plan. We provide ongoing support, 
                renewal reminders, and market updates to ensure you're always getting the best 
                electricity rate available in your area.
              </p>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Transparency</h3>
                  <p className="text-gray-600">
                    We believe in complete transparency. No hidden fees, no misleading offers, 
                    just honest information to help you make the best choice.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Customer First</h3>
                  <p className="text-gray-600">
                    Your satisfaction is our priority. We're independent and unbiased, 
                    always recommending plans that truly benefit you.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Innovation</h3>
                  <p className="text-gray-600">
                    We continuously improve our platform with the latest technology to 
                    make comparing electricity plans faster and easier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Why Choose Power Scouts?</h2>
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">100% Free Service</div>
                      <div className="text-gray-600">Our comparison tool is completely free with no hidden costs or obligations</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Comprehensive Coverage</div>
                      <div className="text-gray-600">Access to 40+ providers and thousands of electricity plans across 12 states</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Real-Time Rates</div>
                      <div className="text-gray-600">Up-to-date pricing information ensuring you see the latest available rates</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Independent & Unbiased</div>
                      <div className="text-gray-600">We're not owned by any electricity provider, ensuring fair comparisons</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Easy Switching Process</div>
                      <div className="text-gray-600">Streamlined enrollment process with same-day or next-day activation</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Expert Support Team</div>
                      <div className="text-gray-600">Knowledgeable energy experts available to answer your questions</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Proven Track Record</div>
                      <div className="text-gray-600">Thousands of satisfied customers and consistent 4.8-star ratings</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Personalized Recommendations</div>
                      <div className="text-gray-600">Customized plan suggestions based on your specific usage and needs</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Start Saving on Electricity?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of households nationwide who trust Power Scouts to find the best electricity rates
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={createPageUrl("CompareRates")}>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold rounded-lg shadow-lg">
                Compare Rates Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="mailto:support@powerscouts.com">
              <Button variant="outline" className="bg-white hover:bg-gray-100 text-[#0A5C8C] border-2 border-white px-8 py-6 text-lg font-bold rounded-lg">
                <Mail className="w-5 h-5 mr-2" />
                Email Us
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
              <span>Expert Support</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}