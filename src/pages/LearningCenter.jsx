import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Zap, DollarSign, Leaf, TrendingDown, Shield, 
  Clock, Users, ArrowRight, Search, CheckCircle
} from "lucide-react";

const articles = [
  {
    id: 1,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "Understanding Electricity Deregulation",
    description: "Learn how deregulated electricity markets work and why you have the power to choose your provider in 12 states.",
    content: "Twelve states across the U.S. have deregulated electricity markets, giving residents and businesses the power to choose their electricity provider. This means you're not stuck with one utility company – you can shop around for the best rates, plan types, and customer service. Your local utility company still maintains the power lines and handles outages, but you choose who supplies your electricity and how much you pay. States with electricity choice include Texas, Illinois, Ohio, Pennsylvania, New York, New Jersey, Maryland, Massachusetts, Maine, New Hampshire, Rhode Island, and Connecticut.",
    readTime: "5 min"
  },
  {
    id: 2,
    category: "Plans & Rates",
    icon: DollarSign,
    color: "green",
    title: "Fixed vs. Variable Rate Plans: Which Is Right for You?",
    description: "Compare the pros and cons of fixed and variable rate electricity plans to find the best option for your needs.",
    content: "Fixed-rate plans lock in your electricity rate for the contract term (typically 6, 12, or 24 months), protecting you from market price fluctuations. You'll pay the same rate per kWh throughout your contract, making budgeting easier. Variable-rate plans change monthly based on market conditions and can go up or down. They offer flexibility with no long-term commitment but less predictability. Most consumers prefer fixed-rate plans for stability, especially during peak demand seasons when prices tend to spike.",
    readTime: "7 min"
  },
  {
    id: 3,
    category: "Saving Money",
    icon: TrendingDown,
    color: "purple",
    title: "10 Ways to Lower Your Electricity Bill",
    description: "Practical tips and strategies to reduce your monthly electricity costs and save hundreds of dollars per year.",
    content: "1. Compare rates regularly – Electricity rates change frequently in deregulated markets. 2. Choose the right plan – Match your usage to plan incentives. 3. Adjust your thermostat – Every degree counts. 4. Use ceiling fans – They make rooms feel 4°F cooler. 5. Seal air leaks – Stop paying to condition the outdoors. 6. Upgrade to LED bulbs – Use 75% less energy than incandescent. 7. Unplug devices – Eliminate phantom power drain. 8. Use appliances efficiently – Run full loads during off-peak hours. 9. Maintain your HVAC – Regular service improves efficiency. 10. Consider time-of-use plans – Save by using power during off-peak hours.",
    readTime: "10 min"
  },
  {
    id: 4,
    category: "Renewable Energy",
    icon: Leaf,
    color: "green",
    title: "Green Energy Plans: How to Go Solar Without Panels",
    description: "Discover how 100% renewable energy plans work and how you can support clean energy without installing solar panels.",
    content: "You don't need solar panels on your roof to use renewable energy. Many electricity providers offer 100% renewable energy plans powered by wind and solar farms. When you choose a green energy plan, your provider ensures that renewable energy equivalent to your usage is added to the grid. These plans are often competitively priced with traditional plans and help reduce your carbon footprint while supporting clean energy development. Look for plans labeled 100% renewable or check the renewable percentage in the plan details.",
    readTime: "6 min"
  },
  {
    id: 5,
    category: "Understanding Bills",
    icon: Zap,
    color: "yellow",
    title: "How to Read Your Electricity Bill",
    description: "Decode your electricity bill and understand exactly what you're paying for each month.",
    content: "Your electricity bill has several key components: 1. Energy Charge – The cost per kWh you used (e.g., 10¢ × 1,000 kWh = $100). 2. Base Charge – A fixed monthly fee covering administrative costs ($5-$15 typically). 3. Delivery/Distribution Charges – Fees paid to your utility company for maintaining power lines. 4. Total Usage – How many kWh you consumed during the billing period. Understanding these components helps you compare plans accurately. When comparing, look at the total estimated bill, not just the per-kWh rate, as base charges and delivery fees vary by provider.",
    readTime: "8 min"
  },
  {
    id: 6,
    category: "Switching Providers",
    icon: Users,
    color: "blue",
    title: "How to Switch Electricity Providers Without Hassle",
    description: "A step-by-step guide to switching providers seamlessly with no interruption to your power.",
    content: "Switching electricity providers is easier than you think. 1. Compare plans – Use Power Scouts to find better rates. 2. Check your current contract – Note any early termination fees. 3. Choose your new plan – Consider rate, contract length, and features. 4. Sign up – Online or by phone with your account information. 5. Let your new provider handle the rest – They coordinate with your old provider. 6. Your power stays on – No interruption during the switch. The entire process typically takes 1-3 business days. Moving? That's the perfect time to switch since you won't owe an early termination fee.",
    readTime: "6 min"
  },
  {
    id: 7,
    category: "Contract Tips",
    icon: Clock,
    color: "orange",
    title: "When to Switch: Timing Your Contract Renewal",
    description: "Learn the best time to switch providers and how to avoid automatic renewals at higher rates.",
    content: "Many consumers overpay for electricity because they miss their contract renewal window. Your provider must notify you before your contract ends. This is the critical time to shop for new rates – don't wait! If you don't choose a new plan, you'll automatically renew, often at a higher rate. Set a calendar reminder for 45 days before your contract ends. Rates can vary significantly throughout the year, with lower rates typically available in spring and fall. During your renewal window, you can switch without penalty. Moving is also penalty-free, making it an ideal time to find better rates.",
    readTime: "7 min"
  },
  {
    id: 8,
    category: "Understanding Fees",
    icon: Shield,
    color: "red",
    title: "Hidden Fees to Watch Out For",
    description: "Identify common electricity plan fees and avoid surprises on your bill.",
    content: "Understanding fees helps you compare plans accurately: 1. Base/Customer Charge – Fixed monthly fee ($5-$15 typically), regardless of usage. 2. Early Termination Fee (ETF) – Charged if you cancel before contract ends ($100-$300 typically). 3. Late Payment Fee – Usually $5-$10 for late payments. 4. Disconnect/Reconnect Fees – Charged if service is turned off for non-payment. 5. Paper Bill Fee – Some providers charge $2-$5 for paper statements. All fees must be disclosed in the plan documents. When comparing plans, look at the total estimated bill, not just the per-kWh rate. Some low rates come with high base charges that make them more expensive overall.",
    readTime: "8 min"
  },
  {
    id: 9,
    category: "Summer Tips",
    icon: Zap,
    color: "orange",
    title: "Managing High Electricity Bills During Summer",
    description: "Special strategies for keeping your electricity costs under control during the hottest months.",
    content: "Summer heat can send electricity bills soaring. Here's how to keep cool without breaking the bank: 1. Set your thermostat to 78°F when home – Each degree lower increases costs by 6-8%. 2. Use programmable thermostats – Increase temperature when away. 3. Close blinds during the day – Block out heat from direct sunlight. 4. Run ceiling fans – They make rooms feel cooler using less energy. 5. Avoid using ovens – Cook outdoors or use smaller appliances. 6. Schedule AC maintenance – Clean filters and coils improve efficiency. 7. Consider a time-of-use plan – Save by using power during off-peak hours. 8. Seal ductwork – Prevent conditioned air from escaping. Remember, your AC accounts for 40-50% of summer electricity usage.",
    readTime: "9 min"
  },
  {
    id: 10,
    category: "Plan Selection",
    icon: CheckCircle,
    color: "teal",
    title: "Choosing the Right Contract Length",
    description: "Find the perfect balance between savings and flexibility with the right contract term.",
    content: "Contract length significantly impacts your rate and flexibility. Short-term (1-6 months): Higher rates but maximum flexibility. Good if you're moving soon or expect rates to drop. Medium-term (12 months): Most popular option, balancing competitive rates with reasonable commitment. Ideal for most households. Long-term (24-36 months): Lowest rates but less flexibility. Best if you're staying long-term and want maximum savings. Month-to-month: No contract but variable rates that can spike. Consider your situation: Are you moving soon? How long do you plan to stay? Do you prefer rate stability or flexibility? Most consumers choose 12-month plans for the best balance.",
    readTime: "6 min"
  }
];

const colorClasses = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" }
};

export default function LearningCenter() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(articles.map(a => a.category))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Learning Center
            </h1>
            <p className="text-lg text-blue-100">
              Expert guides to help you save money and understand electricity markets
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!selectedArticle ? (
          <>
            {/* Search Bar */}
            <div className="mb-12">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base border-2 shadow-lg"
                />
              </div>
              {searchTerm && (
                <p className="text-center text-gray-600 mt-4">
                  Found {filteredArticles.length} article(s)
                </p>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(category)}
                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-[#0A5C8C] hover:text-[#0A5C8C] transition-all"
                >
                  {category}
                </button>
              ))}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-[#0A5C8C] text-white rounded-full text-sm font-medium hover:bg-[#084a6f] transition-all"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => {
                  const Icon = article.icon;
                  const colors = colorClasses[article.color];
                  return (
                    <Card 
                      key={article.id} 
                      className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#0A5C8C] cursor-pointer group"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-7 h-7 ${colors.text}`} />
                        </div>
                        
                        <div className="mb-3">
                          <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wider`}>
                            {article.category}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#0A5C8C] transition-colors">
                          {article.title}
                        </h3>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {article.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {article.readTime} read
                          </span>
                          <ArrowRight className="w-5 h-5 text-[#FF6B35] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No articles found matching "{searchTerm}"</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Article Detail View */
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setSelectedArticle(null)}
              className="mb-8"
            >
              ← Back to Articles
            </Button>

            <Card className="border-2">
              <CardContent className="p-12">
                {(() => {
                  const Icon = selectedArticle.icon;
                  const colors = colorClasses[selectedArticle.color];
                  return (
                    <>
                      <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-6`}>
                        <Icon className={`w-8 h-8 ${colors.text}`} />
                      </div>

                      <div className="mb-4">
                        <span className={`text-sm font-semibold ${colors.text} uppercase tracking-wider`}>
                          {selectedArticle.category}
                        </span>
                      </div>

                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {selectedArticle.title}
                      </h1>

                      <div className="flex items-center gap-4 mb-8 text-gray-500">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {selectedArticle.readTime} read
                        </span>
                      </div>

                      <div className="prose prose-lg max-w-none">
                        <p className="text-xl text-gray-700 leading-relaxed mb-6">
                          {selectedArticle.description}
                        </p>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {selectedArticle.content}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Related Articles */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {articles
                  .filter(a => a.id !== selectedArticle.id && a.category === selectedArticle.category)
                  .slice(0, 3)
                  .map((article) => {
                    const Icon = article.icon;
                    const colors = colorClasses[article.color];
                    return (
                      <Card 
                        key={article.id} 
                        className="hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                            <Icon className={`w-6 h-6 ${colors.text}`} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          <span className="text-sm text-gray-500">{article.readTime} read</span>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {!selectedArticle && (
          <section className="mt-16">
            <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white border-0">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Find Better Rates?
                </h2>
                <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                  Put your knowledge to work and start saving on electricity today
                </p>
                <Link to={createPageUrl("CompareRates")}>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold">
                    Compare Rates Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}