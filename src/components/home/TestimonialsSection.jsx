import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { format } from "date-fns";

const defaultTestimonials = [
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg",
    customer_name: "Janice C",
    location: "Dallas, TX",
    rating: 5,
    review_text: "The representative of Power Wizard was very helpful. She answered all my questions. She explained anything I didn't understand. This company was highly recommended and I can see why!",
    review_date: "2024-10-06"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/star-rating.svg",
    customer_name: "Letitia T",
    location: "Houston, TX",
    rating: 5,
    review_text: "Caroline is an awesome customer service agent who made the process easy and thoroughly explained everything and answered every question. Professional, patient and friendly.",
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
    review_text: "Very friendly, and responsive in a timely manner with helping me and my family switch providers for our electric bill. Was also able to help us save a lot of money.",
    review_date: "2024-09-13"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/star-rating.svg",
    customer_name: "Brandi F",
    location: "Corpus Christi, TX",
    rating: 5,
    review_text: "Had Power Wizard for years and cancelled when I moved. After 6 months I've realized just how much money and headache the company had saved me and I signed back up immediately.",
    review_date: "2024-08-15"
  },
  {
    rating_image: "https://www.powerwizard.com/wp-content/uploads/2025/04/rating-5star.svg",
    customer_name: "Dee R",
    location: "Fort Worth, TX",
    rating: 5,
    review_text: "The agent was very helpful, pleasant and respectful, she explained everything so clearly and it didn't take a long time to sign me up, I'm very pleased with the service.",
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
    <section className="py-24 bg-gradient-to-b from-white via-blue-50 to-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-xl font-bold text-gray-900">4.8</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 font-medium">1,200+ Reviews</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Don't Take Our{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Word For It
            </span>
          </h2>
          <p className="text-xl text-gray-600 font-light">See what our customers are saying</p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex gap-8 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
            >
              {displayTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full md:w-[calc(33.333%-21px)]"
                >
                  <div className="group relative h-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition duration-500"></div>
                    <div className="relative bg-white rounded-3xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                      {/* Quote Icon */}
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:rotate-12 transition-transform duration-300">
                        <Quote className="w-6 h-6 text-white" />
                      </div>

                      {/* Rating */}
                      <div className="mb-4 mt-4">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="text-gray-700 leading-relaxed text-lg mb-6 flex-grow font-light italic">
                        "{testimonial.review_text}"
                      </p>

                      {/* Customer Info */}
                      <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                          {testimonial.customer_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{testimonial.customer_name}</p>
                          <p className="text-sm text-gray-600">{testimonial.location}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(testimonial.review_date), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Navigation */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 lg:-translate-x-16 w-14 h-14 rounded-full bg-white shadow-2xl hover:shadow-xl transition-all flex items-center justify-center border border-gray-100 hover:scale-110 group z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 lg:translate-x-16 w-14 h-14 rounded-full bg-white shadow-2xl hover:shadow-xl transition-all flex items-center justify-center border border-gray-100 hover:scale-110 group z-10"
          >
            <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* Progress Dots */}
          <div className="flex justify-center gap-3 mt-12">
            {displayTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex 
                    ? "w-12 h-3 bg-gradient-to-r from-blue-600 to-purple-600" 
                    : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}