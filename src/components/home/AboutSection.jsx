import React from "react";
import { Users, Award, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function AboutSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://www.powerwizard.com/wp-content/uploads/2025/04/about-us-power.jpg"
                alt="The Power Wizard Way"
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              The Power Wizard Way
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our goal is simple. To empower you by simplifying your search for electricity 
              companies and plans. Whether you're looking for the cheapest electricity rate 
              or a plan that fits your needs, we're here to help you make the best choice.
            </p>

            {/* Stats List */}
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 flex-shrink-0">
                  <div className="flex items-center gap-0 relative">
                    <span className="text-base font-normal text-gray-900">power</span>
                    <span className="text-base font-normal text-teal-500">wizard</span>
                    <svg 
                      className="absolute -top-0.5 -right-2 w-2 h-2" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M10 0L11.5 8.5L20 10L11.5 11.5L10 20L8.5 11.5L0 10L8.5 8.5L10 0Z" 
                        fill="#FF6B5B"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-gray-900 leading-relaxed">
                    Power Wizard has helped tens of thousands of Texans save on electricity since 2019
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-teal-500" />
                </div>
                <div>
                  <p className="text-gray-900 leading-relaxed">
                    A proven team of industry experts with 100+ years of experience
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-900 leading-relaxed">
                    1,200+ Google Reviews and 4.8 Stars
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link to={createPageUrl("AboutUs")}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-semibold px-8"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}