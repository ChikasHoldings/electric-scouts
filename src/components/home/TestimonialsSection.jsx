import React, { useState } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";

// Review Card Component
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 group hover:-translate-y-1 relative overflow-hidden">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      {/* Timestamp in top right */}
      <div className="absolute top-4 right-4">
        <span className="text-xs text-gray-400 font-medium">{review.date}</span>
      </div>

      {/* Header with Profile */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
          {review.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <p className="text-sm font-bold text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-500">{review.location}</p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) =>
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        )}
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
        "{review.text}"
      </p>
    </div>);

}

const testimonials = [
{ name: "Sarah M.", location: "Houston, TX", rating: 5, text: "Switching was so easy! Found a plan that saved me $80/month. The comparison tool made it simple to see all my options.", date: "2 days ago" },
{ name: "Michael R.", location: "Dallas, TX", rating: 5, text: "Best decision I made this year. Customer service was helpful and the rates are unbeatable.", date: "1 week ago" },
{ name: "Jennifer L.", location: "Austin, TX", rating: 5, text: "I was skeptical at first, but Power Wizard really delivered. My electricity bill dropped significantly!", date: "3 days ago" },
{ name: "David K.", location: "San Antonio, TX", rating: 5, text: "Quick setup, transparent pricing, no hidden fees. Exactly what I was looking for in an electricity provider.", date: "5 days ago" },
{ name: "Lisa P.", location: "Fort Worth, TX", rating: 5, text: "The comparison feature is amazing. Saved me hours of research and hundreds of dollars on my bill.", date: "1 week ago" },
{ name: "James T.", location: "Plano, TX", rating: 5, text: "Finally, a service that actually cares about saving customers money. Highly recommend to anyone in Texas!", date: "4 days ago" },
{ name: "Amanda W.", location: "Arlington, TX", rating: 5, text: "Switched my whole family over. We're all saving money now. The process was seamless and fast.", date: "2 weeks ago" },
{ name: "Robert C.", location: "Corpus Christi, TX", rating: 5, text: "Great rates and excellent customer support. They walked me through everything step by step.", date: "3 days ago" },
{ name: "Karen H.", location: "Lubbock, TX", rating: 5, text: "I've been using Power Wizard for 6 months now and my bills are consistently lower. Very satisfied!", date: "1 week ago" },
{ name: "Chris B.", location: "Irving, TX", rating: 5, text: "The website is user-friendly and the plans are clearly explained. No surprises on my bill.", date: "5 days ago" },
{ name: "Patricia G.", location: "Laredo, TX", rating: 5, text: "Switched providers in under 10 minutes. The savings are real and the service is top-notch.", date: "2 days ago" },
{ name: "Steven A.", location: "Garland, TX", rating: 5, text: "Power Wizard made comparing electricity plans so simple. I found the perfect plan for my needs quickly.", date: "1 week ago" },
{ name: "Michelle D.", location: "Frisco, TX", rating: 5, text: "I was paying way too much before. Now I have a better plan at a lower rate. Thank you!", date: "4 days ago" },
{ name: "Daniel F.", location: "McKinney, TX", rating: 5, text: "Trustworthy service with real savings. I tell all my friends and coworkers about it.", date: "3 days ago" },
{ name: "Emily S.", location: "Mesquite, TX", rating: 5, text: "The customer reviews helped me choose the right provider. My experience has been excellent so far.", date: "1 week ago" },
{ name: "Brian N.", location: "Carrollton, TX", rating: 5, text: "Simple, fast, and effective. I'm saving over $100 a month compared to my old provider.", date: "2 weeks ago" },
{ name: "Rachel V.", location: "Denton, TX", rating: 5, text: "Power Wizard took all the guesswork out of finding a good electricity plan. Highly satisfied customer here!", date: "5 days ago" },
{ name: "Kevin J.", location: "Midland, TX", rating: 5, text: "I appreciate the transparency and the wide range of options. Found exactly what I was looking for.", date: "3 days ago" },
{ name: "Angela M.", location: "Abilene, TX", rating: 5, text: "Excellent service from start to finish. My new plan has better rates and no contract headaches.", date: "1 week ago" },
{ name: "Mark E.", location: "Beaumont, TX", rating: 5, text: "Finally ditched my overpriced plan. The switch was painless and I'm already seeing savings.", date: "4 days ago" },
{ name: "Nicole T.", location: "Waco, TX", rating: 5, text: "Power Wizard is a game-changer for Texas residents. Easy to use and delivers real results.", date: "2 days ago" },
{ name: "Jason L.", location: "Odessa, TX", rating: 5, text: "I was hesitant to switch, but I'm so glad I did. Lower rates and better service overall.", date: "1 week ago" },
{ name: "Stephanie R.", location: "Round Rock, TX", rating: 5, text: "The comparison tool is incredibly helpful. I saved money and got a plan with renewable energy options.", date: "5 days ago" },
{ name: "Timothy W.", location: "Pearland, TX", rating: 5, text: "Great experience all around. The team was responsive and the savings are exactly as promised.", date: "3 days ago" },
{ name: "Melissa K.", location: "College Station, TX", rating: 5, text: "As a student, every dollar counts. Power Wizard helped me find an affordable plan that works for me.", date: "2 weeks ago" },
{ name: "Andrew H.", location: "Tyler, TX", rating: 5, text: "I've recommended Power Wizard to my entire family. Everyone who switched is saving money now.", date: "1 week ago" },
{ name: "Catherine P.", location: "Lewisville, TX", rating: 5, text: "Quick signup, competitive rates, and no hidden fees. Everything they promised delivered.", date: "4 days ago" },
{ name: "Gregory S.", location: "Sugar Land, TX", rating: 5, text: "Best electricity comparison service in Texas. Made my decision easy and my wallet happy.", date: "2 days ago" },
{ name: "Samantha B.", location: "Allen, TX", rating: 5, text: "I switched my business and home electricity through Power Wizard. Both are saving significantly.", date: "1 week ago" },
{ name: "Richard M.", location: "The Woodlands, TX", rating: 5, text: "Professional service and genuine savings. Power Wizard lives up to the hype.", date: "5 days ago" }];



export default function TestimonialsSection() {
  const [visibleCount, setVisibleCount] = useState(8);
  const visibleTestimonials = testimonials.slice(0, visibleCount);
  const hasMore = visibleCount < testimonials.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, testimonials.length));
  };

  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-200 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900">4.8</span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-600 font-medium">1,200+ Reviews</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            What Our Customers Say
          </h2>
          <p className="text-sm text-gray-600">Real reviews from real people across Texas</p>
        </div>

        {/* Reviews Grid - Consistent 4 Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {visibleTestimonials.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMore}
              variant="outline"
              className="px-8 py-2 text-sm font-semibold hover:bg-[#0A5C8C] hover:text-white transition-colors"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}