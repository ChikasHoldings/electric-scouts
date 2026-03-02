import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Building, TrendingDown } from "lucide-react";

const testimonials = [
  {
    business: "Austin Manufacturing Co.",
    industry: "Manufacturing",
    location: "Austin, TX",
    size: "Large",
    monthlySavings: "$2,400",
    annualSavings: "$28,800",
    usage: "120,000 kWh/month",
    testimonial: "Switching to a competitive supplier through Electric Scouts saved us nearly $30k in the first year. The volume discounts for our manufacturing facility were game-changing.",
    contact: "Michael Rodriguez",
    position: "Operations Manager",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=150&fit=crop"
  },
  {
    business: "Chicago Retail Group",
    industry: "Retail",
    location: "Chicago, IL",
    size: "Medium",
    monthlySavings: "$850",
    annualSavings: "$10,200",
    usage: "25,000 kWh/month",
    testimonial: "Managing energy costs across 5 retail locations was challenging. Electric Scouts found us a plan with consistent rates that works for all our stores.",
    contact: "Sarah Chen",
    position: "Regional Director",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
  },
  {
    business: "Dallas Tech Solutions",
    industry: "Technology",
    location: "Dallas, TX",
    size: "Small",
    monthlySavings: "$320",
    annualSavings: "$3,840",
    usage: "8,500 kWh/month",
    testimonial: "As a growing tech startup, every dollar counts. The 18% savings on our electricity bill goes straight to our growth initiatives. The process was incredibly easy.",
    contact: "James Patterson",
    position: "Co-Founder & CEO",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"
  },
  {
    business: "Philadelphia Medical Center",
    industry: "Healthcare",
    location: "Philadelphia, PA",
    size: "Large",
    monthlySavings: "$1,900",
    annualSavings: "$22,800",
    usage: "85,000 kWh/month",
    testimonial: "Healthcare facilities can't compromise on reliability. We needed a provider offering both competitive rates and 24/7 support. Electric Scouts delivered exactly that.",
    contact: "Dr. Emily Thompson",
    position: "Facility Director",
    rating: 5,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop"
  },
  {
    business: "Columbus Warehouse LLC",
    industry: "Logistics",
    location: "Columbus, OH",
    size: "Large",
    monthlySavings: "$1,650",
    annualSavings: "$19,800",
    usage: "65,000 kWh/month",
    testimonial: "Our warehouse operates 24/7, so electricity is a major expense. The fixed-rate plan Electric Scouts recommended has stabilized our operating costs significantly.",
    contact: "Robert Martinez",
    position: "Logistics Manager",
    rating: 5,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop"
  },
  {
    business: "Brooklyn Restaurant Group",
    industry: "Food Service",
    location: "Brooklyn, NY",
    size: "Medium",
    monthlySavings: "$680",
    annualSavings: "$8,160",
    usage: "18,000 kWh/month",
    testimonial: "Running 3 restaurants in NYC with high energy costs was eating into our margins. Electric Scouts helped us save over $8k annually across all locations.",
    contact: "Maria Gonzalez",
    position: "Owner",
    rating: 5,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop"
  }
];

export default function BusinessTestimonials() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <Card key={index} className="border-2 border-gray-100 hover:border-blue-300 transition-colors">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.contact}
                  className="w-12 h-12 rounded-full object-cover"
                loading="lazy" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{testimonial.contact}</h4>
                  <p className="text-xs text-gray-600">{testimonial.position}</p>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="flex gap-1 mb-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Testimonial */}
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              "{testimonial.testimonial}"
            </p>

            {/* Business Info */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {testimonial.business}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {testimonial.industry} • {testimonial.location}
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-600">Annual Savings</div>
                    <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      {testimonial.annualSavings}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Usage</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {testimonial.usage}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}