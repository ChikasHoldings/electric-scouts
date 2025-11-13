import React from "react";
import { Award, Users, Target, Heart } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              About Power Scouts
            </h1>
            <p className="text-lg text-blue-100">
              Empowering Texans to make smarter energy choices since 2019
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center mb-12">
            <Target className="w-16 h-16 text-teal-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
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
        </div>

        {/* Story Section */}
        <div className="mt-16 space-y-8">
          <h2 className="text-4xl font-bold text-gray-900">Our Story</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 leading-relaxed">
              Founded in 2019, Power Scouts was created to solve a simple problem: finding the 
              right electricity plan in Texas's deregulated market shouldn't be complicated or 
              time-consuming.
            </p>
            <p className="text-xl text-gray-600 leading-relaxed">
              With over 100 years of combined industry experience, our team of energy experts 
              has helped tens of thousands of Texans navigate the complex world of electricity 
              providers and plans. We're proud to maintain a 4.8-star rating with over 1,200 
              Google reviews.
            </p>
            <p className="text-xl text-gray-600 leading-relaxed">
              Today, we continue to empower Texas residents and businesses to make informed 
              decisions about their energy needs, saving them time, money, and hassle along the way.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}