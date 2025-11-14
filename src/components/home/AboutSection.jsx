import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Award, TrendingUp } from "lucide-react";

export default function AboutSection() {
  const stats = [
  {
    icon: Users,
    number: "10,000+",
    label: "Happy Customers",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Award,
    number: "100+",
    label: "Years Combined Experience",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: TrendingUp,
    number: "$475",
    label: "Average Monthly Savings",
    color: "from-green-500 to-emerald-500"
  }];


  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] leading-tight px-4">
            What Sets Us{" "}
            <span className="text-[#FF6B35]">
              Apart
            </span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-full">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/86a6bbb00_portrait-happy-multi-ethnic-family-embracing-adopted-kids-bonding-together.jpg"
                alt="Happy multi-ethnic family embracing at home, representing satisfied electricity customers saving money with Power Scouts"
                className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-5 sm:space-y-6">
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed px-4 lg:px-0">
              We've cracked the code on electricity shopping in deregulated energy markets across America. While other comparison sites 
              overwhelm you with options, we cut through the noise to surface only the plans that 
              truly save you money in your specific state and ZIP code. No gimmicks, no hidden fees—just transparent rates from 
              trusted providers, backed by our team of energy experts who monitor markets in 12 states daily.
            </p>

            {/* Stats List */}
            <div className="space-y-3 px-4 lg:px-0">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1">
                  <span className="text-base sm:text-lg font-bold text-gray-900">50,000+</span>
                  <span className="text-sm sm:text-base text-gray-600 ml-2">Households switched and saved</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1">
                  <span className="text-base sm:text-lg font-bold text-gray-900">125+</span>
                  <span className="text-sm sm:text-base text-gray-600 ml-2">Years of combined energy industry expertise</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0 mt-2"></div>
                <div className="flex-1">
                  <span className="text-base sm:text-lg font-bold text-gray-900">$600+</span>
                  <span className="text-sm sm:text-base text-gray-600 ml-2">Average annual savings per household</span>
                </div>
              </div>
            </div>

            <div className="pt-3 px-4 lg:px-0">
              <Link to={createPageUrl("AboutUs")}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#0A5C8C] hover:bg-[#084a6f] text-white font-semibold px-8 py-5 text-base rounded-xl transition-all duration-300 touch-manipulation">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);

}