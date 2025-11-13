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
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            What Sets Us{" "}
            <span className="text-[#FF6B35]">
              Apart
            </span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-xl overflow-hidden shadow-lg h-full">
              <img
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80"
                alt="Happy family enjoying their home"
                className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-6">
            <p className="text-lg text-gray-600 leading-relaxed">
              We've cracked the code on Texas electricity shopping. While other comparison sites 
              overwhelm you with options, we cut through the noise to surface only the plans that 
              truly save you money. No gimmicks, no hidden fees—just transparent rates from 
              trusted providers, backed by our team of energy experts who monitor the market daily.
            </p>

            {/* Stats List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0"></div>
                <div>
                  <span className="text-lg font-bold text-gray-900">50,000+</span>
                  <span className="text-base text-gray-600 ml-2">Texans switched and saved</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0"></div>
                <div>
                  <span className="text-lg font-bold text-gray-900">125+</span>
                  <span className="text-base text-gray-600 ml-2">Years of combined energy industry expertise</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0"></div>
                <div>
                  <span className="text-lg font-bold text-gray-900">$600+</span>
                  <span className="text-base text-gray-600 ml-2">Average annual savings per household</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link to={createPageUrl("AboutUs")}>
                <Button
                  size="lg"
                  className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white font-semibold px-8 py-6 text-base rounded-lg transition-all duration-300">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);

}