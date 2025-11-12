import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function AboutSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://www.powerwizard.com/wp-content/uploads/2025/04/about-us-power.jpg"
                alt="The Power Wizard Way"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
              The Power Wizard Way
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our goal is simple. To empower you by simplifying your search for electricity 
              companies and plans. Whether you're looking for the cheapest electricity rate 
              or a plan that fits your needs, we're here to help you make the best choice.
            </p>

            {/* Stats with Icons */}
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <img 
                  src="https://www.powerwizard.com/wp-content/uploads/2022/05/powerwizard-logo.svg"
                  alt="Power Wizard"
                  className="w-16 h-16 flex-shrink-0"
                />
                <p className="text-gray-900 leading-relaxed pt-2">
                  Power Wizard has helped tens of thousands of Texans save on electricity since 2019
                </p>
              </div>

              <div className="flex items-start gap-4">
                <img 
                  src="https://www.powerwizard.com/wp-content/uploads/2025/04/expert-icon.svg"
                  alt="Expert team"
                  className="w-16 h-16 flex-shrink-0"
                  onError={(e) => {
                    e.target.outerHTML = '<div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>';
                  }}
                />
                <p className="text-gray-900 leading-relaxed pt-2">
                  A proven team of industry experts with 100+ years of experience
                </p>
              </div>

              <div className="flex items-start gap-4">
                <img 
                  src="https://www.powerwizard.com/wp-content/uploads/2025/05/rating-5star.svg"
                  alt="5 star rating"
                  className="w-16 h-16 flex-shrink-0"
                  onError={(e) => {
                    e.target.outerHTML = '<div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><div class="flex gap-0.5">' + 
                      Array(5).fill('<svg class="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>').join('') + 
                      '</div></div>';
                  }}
                />
                <p className="text-gray-900 leading-relaxed pt-2">
                  1,200+ Google Reviews and 4.8 Stars
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link to={createPageUrl("AboutUs")}>
                <Button 
                  variant="outline" 
                  className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-normal px-8 py-6 text-base rounded-lg"
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