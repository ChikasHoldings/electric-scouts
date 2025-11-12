import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const defaultTestimonials = [
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg",
    customer_name: "Janice C",
    location: "Dallas, TX",
    rating: 5,
    review_text: "The representative of Power Wizard was very helpful. She answered all my questions. She explained anything I didn't understand. This company was highl...",
    review_date: "2024-10-06"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/star-rating.svg",
    customer_name: "Letitia T",
    location: "Houston, TX",
    rating: 5,
    review_text: "Caroline is an awesome customer service agent who made the process easy and thoroughly explained everything and answered every question. Professional,...",
    review_date: "2024-07-01"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg",
    customer_name: "Tom P",
    location: "Plano, TX",
    rating: 5,
    review_text: "My agent was just great!! Very helpful and very personable!! We got things taken care of - and had a bit of fun doing it!! Much thanks!!",
    review_date: "2024-04-28"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg",
    customer_name: "Kenneth E",
    location: "Houston, TX",
    rating: 5,
    review_text: "Very friendly, and responsive in a timely manner with helping me and my family switch providers for our electric bill. Was also able to help us save a...",
    review_date: "2024-09-13"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/star-rating.svg",
    customer_name: "Brandi F",
    location: "Corpus Christi, TX",
    rating: 5,
    review_text: "Had Power Wizard for years and cancelled when I moved. After 6 months I've realized just how much money and headache the company had saved me and I si...",
    review_date: "2024-08-15"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg",
    customer_name: "Dee R",
    location: "Fort Worth, TX",
    rating: 5,
    review_text: "The agent was very helpful, pleasant and respectful, she explained everything so clearly and it didn't take a long time to sign me up, I'm very please...",
    review_date: "2024-08-28"
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const { data: testimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => base44.entities.Testimonial.list('-review_date'),
    initialData: [],
  });

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, displayTestimonials.length - 2));
    }, 5000);
    return () => clearInterval(timer);
  }, [displayTestimonials.length, isAutoPlaying]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, displayTestimonials.length - 2));
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, displayTestimonials.length - 2)) % Math.max(1, displayTestimonials.length - 2));
  };

  const visibleTestimonials = displayTestimonials.slice(currentIndex, currentIndex + 3);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
            Don't Take Our Word For It
          </h2>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Carousel Container with horizontal scroll */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
            >
              {displayTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full md:w-[calc(33.333%-16px)]"
                >
                  <div className="bg-white rounded-xl p-8 h-full shadow-sm border border-gray-200">
                    {/* Rating Image */}
                    <div className="mb-4">
                      <img 
                        src={testimonial.rating_image || "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg"}
                        alt="5 star rating"
                        className="h-5"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>

                    {/* Review Date */}
                    <p className="text-sm text-gray-600 mb-4">
                      {format(new Date(testimonial.review_date), "MMMM d, yyyy")}
                    </p>

                    {/* Review Text */}
                    <p className="text-gray-800 mb-6 leading-relaxed text-base">
                      {testimonial.review_text}
                    </p>

                    {/* Customer Info */}
                    <div className="pt-4">
                      <p className="font-bold text-gray-900">{testimonial.customer_name}</p>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows - Positioned outside on sides */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}