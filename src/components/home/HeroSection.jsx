import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HeroSection({ zipCode, setZipCode, onCompare }) {
  return (
    <section className="relative bg-white overflow-hidden py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Star Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-900 font-semibold">4.8</span>
              <span className="text-gray-600">•</span>
              <Link to={createPageUrl("Testimonials")} className="text-teal-600 hover:text-teal-700 font-normal">
                1,200+ Reviews
              </Link>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
                Compare the Best Electricity Rates
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Finding the right electricity plan that fits your lifestyle has never been easier.
              </p>
            </div>

            {/* ZIP Code Input */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-1 flex flex-col sm:flex-row gap-0">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto"
                  maxLength={5}
                />
              </div>
              <Button
                onClick={onCompare}
                className="bg-coral-500 hover:bg-coral-600 text-white px-8 sm:px-12 py-6 text-lg font-semibold rounded-lg shadow-none m-0"
              >
                Compare Rates
              </Button>
            </div>

            {/* Secondary CTA */}
            <div>
              <Link
                to={createPageUrl("BusinessRates")}
                className="text-teal-600 hover:text-teal-700 font-normal inline-flex items-center gap-2 group"
              >
                Shop Business Electricity Rates
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Illustration - More detailed house */}
          <div className="relative lg:pl-8">
            <div className="relative">
              <img 
                src="https://www.powerwizard.com/wp-content/uploads/2025/08/hero-house-4-600x435-1-e1755614726248.webp"
                alt="Smart home with electricity savings"
                className="w-full h-auto"
                onError={(e) => {
                  // Fallback to SVG illustration if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              {/* Fallback SVG */}
              <svg viewBox="0 0 600 450" className="w-full h-auto hidden" style={{display: 'none'}}>
                {/* Background clouds */}
                <ellipse cx="100" cy="80" rx="60" ry="30" fill="#E0F2F7" opacity="0.5" />
                <ellipse cx="500" cy="60" rx="80" ry="35" fill="#E0F2F7" opacity="0.5" />
                
                {/* Trees in background */}
                <path d="M50,350 Q50,300 50,250" stroke="#B4D4C3" strokeWidth="8" fill="none" opacity="0.3" />
                <circle cx="50" cy="230" r="35" fill="#86EFAC" opacity="0.3" />
                <circle cx="35" cy="250" r="25" fill="#86EFAC" opacity="0.3" />
                <circle cx="65" cy="250" r="25" fill="#86EFAC" opacity="0.3" />
                
                {/* Main House Structure */}
                <rect x="180" y="200" width="280" height="200" fill="#00A9CE" opacity="0.15" rx="12" />
                <rect x="180" y="200" width="280" height="200" fill="none" stroke="#00A9CE" strokeWidth="4" rx="12" />
                
                {/* Roof */}
                <polygon points="160,200 320,120 480,200" fill="#00A9CE" opacity="0.25" />
                <polygon points="160,200 320,120 480,200" fill="none" stroke="#00A9CE" strokeWidth="4" />
                
                {/* Chimney */}
                <rect x="380" y="140" width="30" height="60" fill="#00A9CE" opacity="0.3" />
                
                {/* Windows - Top Floor */}
                <rect x="210" y="230" width="70" height="70" fill="#FFB347" opacity="0.4" rx="6" />
                <line x1="245" y1="230" x2="245" y2="300" stroke="#00A9CE" strokeWidth="2" />
                <line x1="210" y1="265" x2="280" y2="265" stroke="#00A9CE" strokeWidth="2" />
                
                <rect x="370" y="230" width="70" height="70" fill="#FFB347" opacity="0.4" rx="6" />
                <line x1="405" y1="230" x2="405" y2="300" stroke="#00A9CE" strokeWidth="2" />
                <line x1="370" y1="265" x2="440" y2="265" stroke="#00A9CE" strokeWidth="2" />
                
                {/* Door */}
                <rect x="280" y="320" width="80" height="80" fill="#FF6B5B" opacity="0.6" rx="6" />
                <circle cx="345" cy="360" r="4" fill="#00A9CE" />
                
                {/* Side Building/Garage */}
                <rect x="460" y="280" width="80" height="120" fill="#00BFE7" opacity="0.15" rx="8" />
                <rect x="460" y="280" width="80" height="120" fill="none" stroke="#00BFE7" strokeWidth="3" rx="8" />
                
                {/* Garage Door */}
                <rect x="475" y="320" width="50" height="75" fill="#00A9CE" opacity="0.2" rx="4" />
                <line x1="475" y1="340" x2="525" y2="340" stroke="#00A9CE" strokeWidth="1" />
                <line x1="475" y1="360" x2="525" y2="360" stroke="#00A9CE" strokeWidth="1" />
                <line x1="475" y1="380" x2="525" y2="380" stroke="#00A9CE" strokeWidth="1" />
                
                {/* Car */}
                <ellipse cx="550" cy="390" rx="45" ry="20" fill="#00BFE7" opacity="0.25" />
                <rect x="520" y="375" width="60" height="25" fill="#00BFE7" opacity="0.4" rx="8" />
                <circle cx="535" cy="395" r="8" fill="#333" opacity="0.3" />
                <circle cx="565" cy="395" r="8" fill="#333" opacity="0.3" />
                
                {/* Trees - Right side */}
                <circle cx="550" cy="320" r="30" fill="#86EFAC" opacity="0.4" />
                <circle cx="535" cy="335" r="20" fill="#86EFAC" opacity="0.4" />
                <circle cx="565" cy="335" r="20" fill="#86EFAC" opacity="0.4" />
                
                {/* Grass/Ground */}
                <ellipse cx="320" cy="420" rx="250" ry="20" fill="#86EFAC" opacity="0.2" />
                
                {/* Chart/Graph Floating Element */}
                <rect x="100" y="150" width="80" height="60" fill="white" rx="8" stroke="#00A9CE" strokeWidth="2" />
                <polyline points="110,190 130,170 150,180 170,160" fill="none" stroke="#FF6B5B" strokeWidth="2" />
                <text x="140" y="175" fontSize="10" fill="#00A9CE" textAnchor="middle" fontWeight="bold">↑ Savings</text>
                
                {/* Rating Badge Floating */}
                <rect x="480" y="100" width="90" height="60" fill="white" rx="8" stroke="#00A9CE" strokeWidth="2" />
                <text x="525" y="120" fontSize="11" fill="#666" textAnchor="middle">Rating</text>
                <text x="525" y="145" fontSize="20" fill="#00A9CE" textAnchor="middle" fontWeight="bold">4.75</text>
                <g transform="translate(500, 148)">
                  {[0,1,2,3,4].map(i => (
                    <star key={i} className="inline">
                      <polygon 
                        points={`${i*10},0 ${i*10+3},6 ${i*10+9},6 ${i*10+4},10 ${i*10+6},16 ${i*10},12 ${i*10-6},16 ${i*10-4},10 ${i*10-9},6 ${i*10-3},6`}
                        fill="#FFB347"
                        transform={`scale(0.4) translate(${i*25}, 0)`}
                      />
                    </star>
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-coral-500 { background-color: #FF6B5B; }
        .hover\\:bg-coral-600:hover { background-color: #E95A4A; }
      `}</style>
    </section>
  );
}