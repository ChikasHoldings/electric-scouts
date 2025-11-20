import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Phone, Mail, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SEOHead, { getFAQSchema, getBreadcrumbSchema } from "../components/SEOHead";

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        id: 1,
        question: "How does electricity deregulation work?",
        answer: "In deregulated electricity markets across 12 states (TX, PA, NY, OH, IL, NJ, MD, MA, ME, NH, RI, CT), you can choose your electricity provider. Unlike regulated states where you're assigned a utility company, residents in deregulated markets can shop for the best rates and plans. Your local utility company still maintains the power lines and handles outages, but you choose who supplies your electricity and at what rate."
      },
      {
        id: 2,
        question: "Is Power Scouts really free to use?",
        answer: "Yes! Our service is 100% free with no hidden fees, no obligations, and no credit card required. We're compensated by electricity providers when customers sign up through our platform, so you never pay anything to compare rates or switch providers."
      },
      {
        id: 3,
        question: "How do I compare electricity rates?",
        answer: "Simply enter your ZIP code and monthly usage on our comparison tool. We'll show you available plans from 40+ providers in your state, sorted by rate. You can filter by plan type, contract length, and renewable energy options. Each plan shows the estimated monthly cost based on your usage. Our tool works across all 12 deregulated states."
      },
      {
        id: 4,
        question: "What information do I need to compare rates?",
        answer: "You'll need your ZIP code and an estimate of your monthly electricity usage (in kWh). You can find your usage on your current electricity bill. If you don't know your usage, 1,000 kWh is a good average for most homes (though usage varies by climate and home size)."
      }
    ]
  },
  {
    category: "Plans & Rates",
    questions: [
      {
        id: 5,
        question: "What's the difference between fixed and variable rate plans?",
        answer: "Fixed-rate plans lock in your electricity rate for the contract term (typically 6, 12, or 24 months), protecting you from market fluctuations. Variable-rate plans change monthly based on market conditions and can go up or down. Fixed rates offer predictability, while variable rates offer flexibility with no long-term commitment."
      },
      {
        id: 6,
        question: "What is a kWh?",
        answer: "A kilowatt-hour (kWh) is the unit used to measure electricity consumption. One kWh equals 1,000 watts used for one hour. For example, running a 100-watt light bulb for 10 hours uses 1 kWh. The average home uses about 800-1,200 kWh per month, depending on climate, home size, and efficiency."
      },
      {
        id: 7,
        question: "How long should my contract be?",
        answer: "Most people choose 12 or 24-month fixed-rate plans for the best balance of savings and flexibility. Longer contracts often have lower rates but less flexibility. Shorter contracts (3-6 months) offer more flexibility but typically higher rates. Month-to-month plans provide maximum flexibility with variable rates."
      },
      {
        id: 8,
        question: "What are renewable energy plans?",
        answer: "Renewable energy plans source electricity from clean, sustainable sources like wind and solar farms. Many providers offer 100% renewable plans at competitive rates across all 12 deregulated states. These plans help reduce your carbon footprint and support clean energy development nationwide."
      },
      {
        id: 9,
        question: "What is an early termination fee?",
        answer: "An early termination fee (ETF) is a charge if you cancel your electricity plan before the contract ends. ETFs typically range from $100-$300 but vary by provider and plan. Some plans have no ETF. Always check the Electricity Facts Label (EFL) for ETF details before signing up."
      }
    ]
  },
  {
    category: "Switching Providers",
    questions: [
      {
        id: 10,
        question: "How do I switch electricity providers?",
        answer: "Switching is easy! Compare plans on Power Scouts, select your preferred plan, and sign up online or by phone. Your new provider handles the switch with your old provider. There's no interruption to your service, and the entire process typically takes 1-3 business days."
      },
      {
        id: 11,
        question: "Will my power be shut off when I switch?",
        answer: "No! Your power will never be interrupted when switching providers. The transition happens seamlessly behind the scenes. Your local utility company continues to deliver power through the same lines – only your electricity supplier changes."
      },
      {
        id: 12,
        question: "Can I switch if I'm currently under contract?",
        answer: "Yes, but you may owe an early termination fee (ETF) to your current provider. Check your current contract for ETF details. Sometimes the savings from a new plan can offset the ETF, especially if rates have dropped significantly since you signed up."
      },
      {
        id: 13,
        question: "How long does it take to switch providers?",
        answer: "The switch typically takes 1-3 business days. If you're moving to a new address, service can often start the same day or next business day. Your new provider will coordinate everything with your previous provider and the local utility company."
      },
      {
        id: 14,
        question: "Can I switch providers if I'm moving?",
        answer: "Yes! Moving is actually the perfect time to compare rates since you won't owe an early termination fee. Simply enter your new address's ZIP code in our comparison tool, choose a plan, and schedule your start date for your move-in day."
      }
    ]
  },
  {
    category: "Billing & Payments",
    questions: [
      {
        id: 15,
        question: "How will I be billed?",
        answer: "Your new electricity provider will send you a monthly bill, typically via email or mail. Most providers offer paperless billing, autopay, and online payment options through their website or mobile app. Billing details vary by provider."
      },
      {
        id: 16,
        question: "What are base charges or monthly fees?",
        answer: "Base charges (also called monthly fees or customer charges) are fixed fees charged by some providers regardless of usage. These typically range from $5-$15 per month and cover administrative costs. When comparing plans, look at the total estimated bill, not just the per-kWh rate."
      },
      {
        id: 17,
        question: "Are there any hidden fees?",
        answer: "Reputable providers disclose all fees in the Electricity Facts Label (EFL). Common fees include base charges, early termination fees, and late payment fees. Power Scouts shows you the estimated total monthly cost, including all fees, so you can make informed comparisons."
      },
      {
        id: 18,
        question: "Do I need to pay a deposit?",
        answer: "Deposit requirements vary by provider and depend on your credit score. Many providers offer no-deposit plans, especially with autopay enrollment. Some providers may require a deposit of $100-$300 for customers with lower credit scores or no credit history."
      }
    ]
  },
  {
    category: "Technical & Service",
    questions: [
      {
        id: 19,
        question: "Who do I call if my power goes out?",
        answer: "Always contact your local utility company (TDU) for power outages, not your electricity provider. In most areas, this is Oncor, CenterPoint, or AEP Texas. Your utility company maintains the power lines and handles all outage-related issues."
      },
      {
        id: 20,
        question: "What's the difference between my provider and utility company?",
        answer: "Your electricity provider (REP) is the company you choose that supplies your electricity and sends your bill. Your utility company (TDU) owns the power lines, reads your meter, and handles outages. You choose your provider, but your utility company is determined by your location."
      },
      {
        id: 21,
        question: "Will switching affect my smart meter?",
        answer: "No, your smart meter is owned and maintained by your utility company, not your electricity provider. Switching providers doesn't affect your meter in any way. The same meter will simply report your usage to your new provider instead."
      },
      {
        id: 22,
        question: "Can I keep my same electricity provider if I move?",
        answer: "It depends on where you're moving. If your provider serves your new ZIP code, you can often transfer your service. However, moving is a great time to compare rates since you won't owe an early termination fee if you switch."
      }
    ]
  }
];

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter FAQs based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  // Flatten all FAQs for schema
  const allFaqsFlat = faqCategories.flatMap(cat => cat.questions);
  const faqSchema = getFAQSchema(allFaqsFlat);
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "FAQs", url: "/faq" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Electricity FAQ - 22+ Common Questions Answered | Power Scouts"
        description="Get answers to frequently asked questions about electricity deregulation, switching providers, plan types, rates, billing, contracts & saving money. Expert guidance for TX, PA, NY, OH, IL, NJ, MD, MA & more. Learn about fixed vs variable rates, kWh usage, early termination fees, renewable energy, deposits & more."
        keywords="electricity FAQ, energy questions, electricity rates FAQ, switching providers FAQ, electricity deregulation questions, how to switch electricity, electricity bill questions, kWh explained, contract length guide, early termination fee, renewable energy FAQ, electricity deposit requirements"
        canonical="/faq"
        structuredData={[faqSchema, breadcrumbData]}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-blue-100">
              Everything you need to know about choosing your electricity provider
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-base border-2 shadow-lg"
            />
          </div>
          {searchTerm && (
            <p className="text-center text-gray-600 mt-4">
              Found {filteredCategories.reduce((acc, cat) => acc + cat.questions.length, 0)} result(s)
            </p>
          )}
        </div>

        {/* FAQ Categories */}
        {filteredCategories.length > 0 ? (
          <div className="space-y-12">
            {filteredCategories.map((category, catIndex) => (
              <section key={catIndex}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq) => (
                    <Card 
                      key={faq.id} 
                      className="border-2 hover:border-[#0A5C8C] transition-all cursor-pointer overflow-hidden"
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between p-6">
                          <h3 className="text-lg font-bold text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          <ChevronDown 
                            className={`w-5 h-5 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No questions found matching "{searchTerm}"</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          </div>
        )}

        {/* Contact Section */}
        <section className="mt-16">
          <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-2">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Our energy experts are here to help you find the perfect electricity plan across all 12 deregulated states
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Link to={createPageUrl("CompareRates")}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Compare Plans</h3>
                      <p className="text-sm text-gray-600">Start comparing</p>
                    </CardContent>
                  </Card>
                </Link>

                <a href="mailto:support@powerscouts.com">
                  <Card className="hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                      <p className="text-sm text-gray-600">support@powerscouts.com</p>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}