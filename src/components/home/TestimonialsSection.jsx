import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const defaultTestimonials = [
  {
    customer_name: "Janice C",
    location: "Dallas, TX",
    rating: 5,
    review_text: "The representative of Power Wizard was very helpful. She answered all my questions. She explained anything I didn't understand. This company was highl...",
    review_date: "2024-10-06"
  },
  {
    customer_name: "Letitia T",
    location: "Houston, TX",
    rating: 5,
    review_text: "Caroline is an awesome customer service agent who made the process easy and thoroughly explained everything and answered every question. Professional,...",
    review_date: "2024-07-01"
  },
  {
    customer_name: "Tom P",
    location: "Plano, TX",
    rating: 5,
    review_text: "My agent was just great!! Very helpful and very personable!! We got things taken care of - and had a bit of fun doing it!! Much thanks!!",
    review_date: "2024-04-28"
  },
  {
    customer_name: "Kenneth E",
    location: "Houston, TX",
    rating: 5,
    review_text: "Very friendly, and responsive in a timely manner with helping me and my family switch providers for our electric bill. Was also able to help us save a...",
    review_date: "2024-09-13"
  },
  {
    customer_name: "Brandi F",
    location: "Corpus Christi, TX",
    rating: 5,
    review_text: "Had Power Wizard for years and cancelled when I moved. After 6 months I've realized just how much money and headache the company had saved me and I si...",
    review_date: "2024-08-15"
  },
  {
    customer_name: "Dee R",
    location: "Fort Worth, TX",
    rating: 5,
    review_text: "The agent was very helpful, pleasant and respectful, she explained everything so clearly and it didn't take a long time to sign me up, I'm very please...",
    review_date: "2024-08-28"
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: testimonials } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => base44.entities.Testimonial.list('-review_date'),
    initialData: [],
  });

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayTestimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);
  };

  const visibleTestimonials = [
    displayTestimonials[currentIndex],
    displayTestimonials[(currentIndex + 1) % displayTestimonials.length],
    displayTestimonials[(currentIndex + 2) % displayTestimonials.length]
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Don't Take Our Word For It
          </h2>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {visibleTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Review Date */}
                <p className="text-sm text-gray-500 mb-4">
                  {format(new Date(testimonial.review_date), "MMMM d, yyyy")}
                </p>

                {/* Review Text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {testimonial.review_text}
                </p>

                {/* Customer Info */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-bold text-gray-900">{testimonial.customer_name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}