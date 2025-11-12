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
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image with Overlay */}
          <div className="order-2 lg:order-1 group">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <img
                src="https://www.powerwizard.com/wp-content/uploads/2025/04/about-us-power.jpg"
                alt="The Power Wizard Way"
                className="w-full h-auto"
              />
              {/* Floating Badge */}
              <div className="absolute bottom-6 right-6 bg-white rounded-2xl px-6 py-4 shadow-xl z-20 transform group-hover:translate-y-[-8px] transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">4.8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="inline-block">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full px-4 py-2 border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-blue-600">TRUSTED BY THOUSANDS</span>
              </div>
            </div>

            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              The Power Wizard{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Way
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed font-light">
              Our goal is simple. To empower you by simplifying your search for electricity 
              companies and plans. Whether you're looking for the cheapest electricity rate 
              or a plan that fits your needs, we're here to help you make the best choice.
            </p>

            {/* Stats Cards */}
            <div className="grid gap-6 pt-4">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="group flex items-center gap-6 p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent cursor-pointer"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stat.number}</p>
                    <p className="text-gray-600 font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link to={createPageUrl("AboutUs")}>
                <Button 
                  size="lg"
                  className="group bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold px-10 py-7 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Learn More About Us
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}