import React, { useState } from "react";
import { Star, User, ThumbsUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Review Card Component
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2 h-full flex flex-col">
      {/* Header with Profile */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 bg-gradient-to-br ${review.gradient} rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-lg`}>
          {review.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Verified
          </p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-700 leading-relaxed mb-auto">
        "{review.text}"
      </p>

      {/* Footer with location and timestamp */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <p className="text-xs text-gray-600 font-medium">{review.location}</p>
        <span className="text-xs text-gray-400">{review.date}</span>
      </div>
    </div>
  );
}

const testimonials = [
  { name: "Sarah M.", location: "Houston, TX", rating: 5, text: "Switching was so easy! Found a plan that saved me $80/month. The comparison tool made it simple to see all my options.", date: "3 days ago", gradient: "from-blue-500 to-blue-600" },
  { name: "Michael R.", location: "Dallas, TX", rating: 5, text: "Best decision I made this year. Customer service was helpful and the rates are unbeatable.", date: "1 week ago", gradient: "from-purple-500 to-purple-600" },
  { name: "Jennifer L.", location: "Austin, TX", rating: 5, text: "I was skeptical at first, but Power Wizard really delivered. My electricity bill dropped significantly!", date: "2 weeks ago", gradient: "from-teal-500 to-teal-600" },
  { name: "David K.", location: "San Antonio, TX", rating: 5, text: "Quick setup, transparent pricing, no hidden fees. Exactly what I was looking for in an electricity provider.", date: "5 days ago", gradient: "from-orange-500 to-orange-600" },
  { name: "Lisa P.", location: "Fort Worth, TX", rating: 5, text: "The comparison feature is amazing. Saved me hours of research and hundreds of dollars on my bill.", date: "3 weeks ago", gradient: "from-pink-500 to-pink-600" },
  { name: "James T.", location: "Plano, TX", rating: 5, text: "Finally, a service that actually cares about saving customers money. Highly recommend to anyone in Texas!", date: "1 week ago", gradient: "from-indigo-500 to-indigo-600" },
  { name: "Amanda W.", location: "Arlington, TX", rating: 5, text: "Switched my whole family over. We're all saving money now. The process was seamless and fast.", date: "1 month ago", gradient: "from-green-500 to-green-600" },
  { name: "Robert C.", location: "Corpus Christi, TX", rating: 5, text: "Great rates and excellent customer support. They walked me through everything step by step.", date: "4 days ago", gradient: "from-red-500 to-red-600" },
  { name: "Karen H.", location: "Lubbock, TX", rating: 5, text: "I've been using Power Wizard for 6 months now and my bills are consistently lower. Very satisfied!", date: "2 weeks ago", gradient: "from-blue-500 to-blue-600" },
  { name: "Chris B.", location: "Irving, TX", rating: 5, text: "The website is user-friendly and the plans are clearly explained. No surprises on my bill.", date: "6 days ago", gradient: "from-purple-500 to-purple-600" },
  { name: "Patricia G.", location: "Laredo, TX", rating: 5, text: "Switched providers in under 10 minutes. The savings are real and the service is top-notch.", date: "1 week ago", gradient: "from-teal-500 to-teal-600" },
  { name: "Steven A.", location: "Garland, TX", rating: 5, text: "Power Wizard made comparing electricity plans so simple. I found the perfect plan for my needs quickly.", date: "3 weeks ago", gradient: "from-orange-500 to-orange-600" },
  { name: "Michelle D.", location: "Frisco, TX", rating: 5, text: "I was paying way too much before. Now I have a better plan at a lower rate. Thank you!", date: "10 days ago", gradient: "from-pink-500 to-pink-600" },
  { name: "Daniel F.", location: "McKinney, TX", rating: 5, text: "Trustworthy service with real savings. I tell all my friends and coworkers about it.", date: "2 weeks ago", gradient: "from-indigo-500 to-indigo-600" },
  { name: "Emily S.", location: "Mesquite, TX", rating: 5, text: "The customer reviews helped me choose the right provider. My experience has been excellent so far.", date: "1 month ago", gradient: "from-green-500 to-green-600" },
  { name: "Brian N.", location: "Carrollton, TX", rating: 5, text: "Simple, fast, and effective. I'm saving over $100 a month compared to my old provider.", date: "5 weeks ago", gradient: "from-red-500 to-red-600" },
  { name: "Rachel V.", location: "Denton, TX", rating: 5, text: "Power Wizard took all the guesswork out of finding a good electricity plan. Highly satisfied customer here!", date: "8 days ago", gradient: "from-blue-500 to-blue-600" },
  { name: "Kevin J.", location: "Midland, TX", rating: 5, text: "I appreciate the transparency and the wide range of options. Found exactly what I was looking for.", date: "2 weeks ago", gradient: "from-purple-500 to-purple-600" },
  { name: "Angela M.", location: "Abilene, TX", rating: 5, text: "Excellent service from start to finish. My new plan has better rates and no contract headaches.", date: "4 weeks ago", gradient: "from-teal-500 to-teal-600" },
  { name: "Mark E.", location: "Beaumont, TX", rating: 5, text: "Finally ditched my overpriced plan. The switch was painless and I'm already seeing savings.", date: "1 week ago", gradient: "from-orange-500 to-orange-600" },
  { name: "Nicole T.", location: "Waco, TX", rating: 5, text: "Power Wizard is a game-changer for Texas residents. Easy to use and delivers real results.", date: "6 weeks ago", gradient: "from-pink-500 to-pink-600" },
  { name: "Jason L.", location: "Odessa, TX", rating: 5, text: "I was hesitant to switch, but I'm so glad I did. Lower rates and better service overall.", date: "3 weeks ago", gradient: "from-indigo-500 to-indigo-600" },
  { name: "Stephanie R.", location: "Round Rock, TX", rating: 5, text: "The comparison tool is incredibly helpful. I saved money and got a plan with renewable energy options.", date: "9 days ago", gradient: "from-green-500 to-green-600" },
  { name: "Timothy W.", location: "Pearland, TX", rating: 5, text: "Great experience all around. The team was responsive and the savings are exactly as promised.", date: "2 months ago", gradient: "from-red-500 to-red-600" },
  { name: "Melissa K.", location: "College Station, TX", rating: 5, text: "As a student, every dollar counts. Power Wizard helped me find an affordable plan that works for me.", date: "7 weeks ago", gradient: "from-blue-500 to-blue-600" },
  { name: "Andrew H.", location: "Tyler, TX", rating: 5, text: "I've recommended Power Wizard to my entire family. Everyone who switched is saving money now.", date: "1 month ago", gradient: "from-purple-500 to-purple-600" },
  { name: "Catherine P.", location: "Lewisville, TX", rating: 5, text: "Quick signup, competitive rates, and no hidden fees. Everything they promised delivered.", date: "11 days ago", gradient: "from-teal-500 to-teal-600" },
  { name: "Gregory S.", location: "Sugar Land, TX", rating: 5, text: "Best electricity comparison service in Texas. Made my decision easy and my wallet happy.", date: "3 weeks ago", gradient: "from-orange-500 to-orange-600" },
  { name: "Samantha B.", location: "Allen, TX", rating: 5, text: "I switched my business and home electricity through Power Wizard. Both are saving significantly.", date: "2 months ago", gradient: "from-pink-500 to-pink-600" },
  { name: "Richard M.", location: "The Woodlands, TX", rating: 5, text: "Professional service and genuine savings. Power Wizard lives up to the hype.", date: "5 weeks ago", gradient: "from-indigo-500 to-indigo-600" }
];


export default function TestimonialsSection() {
  const [visibleCount, setVisibleCount] = useState(6);
  const visibleTestimonials = testimonials.slice(0, visibleCount);
  const hasMore = visibleCount < testimonials.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, testimonials.length));
  };

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full px-5 py-2.5 shadow-md border-2 border-amber-200 mb-5">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-base font-bold text-gray-900">4.8 out of 5</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-700 font-semibold">1,200+ Verified Reviews</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Trusted by Thousands of Texans
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories from real customers who switched and saved with Power Wizard
          </p>
        </div>

        {/* Reviews Grid - Consistent 3 Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {visibleTestimonials.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMore}
              className="px-10 py-6 text-base font-semibold bg-[#0A5C8C] hover:bg-[#084a6f] text-white shadow-lg hover:shadow-xl transition-all"
            >
              Show More Reviews
              <Star className="w-4 h-4 ml-2 fill-amber-400 text-amber-400" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}