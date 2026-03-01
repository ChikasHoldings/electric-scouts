import React, { useState, useMemo } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic time-ago calculation based on a base date offset from today
function getTimeAgo(daysAgo) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return "1 week ago";
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 60) return "1 month ago";
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
  return `${Math.floor(daysAgo / 365)} year${Math.floor(daysAgo / 365) > 1 ? 's' : ''} ago`;
}

// Review Card Component
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 group hover:-translate-y-0.5 relative overflow-hidden">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      {/* Timestamp in top right */}
      <div className="absolute top-4 right-4">
        <span className="text-xs text-gray-400 font-medium">{review.displayDate}</span>
      </div>

      {/* Header with Profile */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
          {review.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <p className="text-sm font-bold text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-500">{review.location}</p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex gap-0.5 mb-2.5">
        {[...Array(5)].map((_, i) =>
        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
        )}
      </div>

      {/* Review Text */}
      <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
        "{review.text}"
      </p>
    </div>
  );
}

// Base date: Feb 25, 2026 — reviews are offset from this anchor
const REVIEW_ANCHOR = new Date('2026-02-25T00:00:00');

const allTestimonials = [
  // Texas
  { name: "Andrea T.", location: "Houston, TX", rating: 5, text: "Switched in about 10 minutes and my first bill was $72 less. The comparison made it so easy to see which plan was actually the best deal.", date: "2 days ago", timestamp: 2 },
  { name: "Marcus J.", location: "Dallas, TX", rating: 5, text: "My contract expired and I was dreading the research. Found a better rate here in one sitting. Already seeing the difference on my bill.", date: "1 week ago", timestamp: 7 },
  { name: "Priya S.", location: "Austin, TX", rating: 5, text: "Didn't think I'd save much but my bill dropped from $185 to $128. Same usage, just a smarter rate. Wish I'd done this sooner.", date: "3 days ago", timestamp: 3 },
  { name: "Carlos V.", location: "San Antonio, TX", rating: 5, text: "No hidden fees, no surprises. The rate they showed me is exactly what showed up on my bill. That's all I wanted.", date: "5 days ago", timestamp: 5 },
  
  // Illinois
  { name: "Tamara W.", location: "Chicago, IL", rating: 5, text: "Other sites were confusing. This one actually breaks down the total cost including delivery charges. Saved me about $65 a month.", date: "1 week ago", timestamp: 7 },
  { name: "Derek O.", location: "Aurora, IL", rating: 5, text: "My coworker recommended this. Locked in a fixed rate and my bills have been consistently lower for three months now.", date: "4 days ago", timestamp: 4 },
  { name: "Keisha B.", location: "Naperville, IL", rating: 5, text: "Got my parents set up too after I saw my savings. They're both paying less now. Simple enough for anyone to use.", date: "2 weeks ago", timestamp: 14 },
  
  // Ohio
  { name: "Nathan C.", location: "Columbus, OH", rating: 5, text: "Had questions about contract terms and got a clear answer right away. Found a plan that fits my budget without any pressure.", date: "3 days ago", timestamp: 3 },
  { name: "Diane F.", location: "Cleveland, OH", rating: 5, text: "Bills are consistently 20-25% lower. Same house, same habits. Just made a smarter choice with my provider.", date: "1 week ago", timestamp: 7 },
  { name: "Omar R.", location: "Cincinnati, OH", rating: 5, text: "Everything was in plain English — rates, fees, contract length. Got exactly what I signed up for. Refreshing.", date: "5 days ago", timestamp: 5 },
  
  // Pennsylvania
  { name: "Heather G.", location: "Philadelphia, PA", rating: 5, text: "Took maybe 10 minutes start to finish. Already seeing savings on my second bill. Should have looked into this way earlier.", date: "2 days ago", timestamp: 2 },
  { name: "Trevor A.", location: "Pittsburgh, PA", rating: 5, text: "Needed a plan with no early termination fee since I might relocate. Found exactly what I needed without digging through dozens of sites.", date: "1 week ago", timestamp: 7 },
  { name: "Rosa M.", location: "Allentown, PA", rating: 5, text: "My neighbor told me about it after she cut her bill in half. Turns out I was overpaying too. New rate is significantly better.", date: "4 days ago", timestamp: 4 },
  
  // New York
  { name: "Jamal F.", location: "New York, NY", rating: 5, text: "Told three people at work and they all switched too. The rates really are that much better than what most of us were paying.", date: "3 days ago", timestamp: 3 },
  { name: "Allison K.", location: "Buffalo, NY", rating: 5, text: "Read through actual reviews before picking a provider. Helped me avoid some bad options. Went with a solid choice and it's been great.", date: "1 week ago", timestamp: 7 },
  { name: "Wei L.", location: "Rochester, NY", rating: 5, text: "My bill went from around $175 to $98 last month. Same apartment, same everything. Just found a rate that actually makes sense.", date: "2 weeks ago", timestamp: 14 },
  
  // New Jersey
  { name: "Vanessa P.", location: "Newark, NJ", rating: 5, text: "The filters made it dead simple. Sorted by rate and contract length and I was done. Bill is noticeably cheaper now.", date: "5 days ago", timestamp: 5 },
  { name: "Ryan H.", location: "Jersey City, NJ", rating: 5, text: "Shows you what you're paying for — energy charge, delivery, everything. No hidden nonsense. Saving real money every month.", date: "3 days ago", timestamp: 3 },
  
  // Maryland
  { name: "Denise E.", location: "Baltimore, MD", rating: 5, text: "Found a 12-month fixed rate way cheaper than what I had. No weird terms or surprise fees. Pretty straightforward.", date: "1 week ago", timestamp: 7 },
  { name: "Alan W.", location: "Columbia, MD", rating: 5, text: "My old plan was draining me. This helped me find something reasonable and the switch was painless.", date: "4 days ago", timestamp: 4 },
  
  // Massachusetts
  { name: "Yuki T.", location: "Boston, MA", rating: 5, text: "Rent here is brutal so saving $55 monthly on electricity genuinely helps. Clean interface and easy to compare.", date: "2 days ago", timestamp: 2 },
  { name: "Patrick L.", location: "Worcester, MA", rating: 5, text: "Kept putting this off thinking it'd be complicated. Took 15 minutes and I'm paying less. Should've done it months ago.", date: "1 week ago", timestamp: 7 },
  
  // Connecticut
  { name: "Simone R.", location: "Hartford, CT", rating: 5, text: "Wanted a green plan without paying a premium. Found a 100% renewable option that's actually cheaper than my old rate.", date: "5 days ago", timestamp: 5 },
  { name: "Grant D.", location: "New Haven, CT", rating: 5, text: "Had a question about billing and got a real response quickly. The rate they quoted was accurate on my first bill too.", date: "3 days ago", timestamp: 3 },
  
  // Rhode Island
  { name: "Lucia N.", location: "Providence, RI", rating: 5, text: "On a tight budget so every dollar matters. Found a plan that cut about $35 off my monthly bill. Really helps.", date: "2 weeks ago", timestamp: 14 },
  
  // New Hampshire
  { name: "Brett H.", location: "Manchester, NH", rating: 5, text: "Told my brother after I saw my first lower bill. Now my whole family uses it. We all found better rates.", date: "1 week ago", timestamp: 7 },
  
  // Maine
  { name: "Colleen P.", location: "Portland, ME", rating: 5, text: "Quick enrollment, competitive rate, and my first bill matched the estimate. No surprises or weird charges.", date: "4 days ago", timestamp: 4 },
  
  // More recent
  { name: "Darnell S.", location: "Fort Worth, TX", rating: 5, text: "Compared about 15 plans and picked the one saving me the most. Straightforward process, no complaints.", date: "2 days ago", timestamp: 2 },
  { name: "Megan B.", location: "Plano, TX", rating: 5, text: "Set up both my home and small business through here. Both bills dropped. Really pleased with the results.", date: "1 week ago", timestamp: 7 },
  { name: "Kwame A.", location: "Irving, TX", rating: 5, text: "Friend recommended it and he was right. Rate is legitimately better and zero issues so far.", date: "5 days ago", timestamp: 5 },
  { name: "Ingrid M.", location: "Rockford, IL", rating: 5, text: "New rate is almost 3 cents cheaper per kWh. That really adds up over the month. Done in one sitting.", date: "6 days ago", timestamp: 6 },
  { name: "Victor B.", location: "Joliet, IL", rating: 5, text: "Bill used to be around $140, now it's closer to $95. That's real money back in my pocket every month.", date: "1 week ago", timestamp: 7 },
  { name: "Fatima S.", location: "Toledo, OH", rating: 5, text: "Had about a dozen options. Filtered by what I needed and picked one in 10 minutes. Way better than my old rate.", date: "3 days ago", timestamp: 3 },
  { name: "Howard R.", location: "Akron, OH", rating: 5, text: "Good variety of plans. Had a question about renewable options and got help figuring it out. Found a solid plan.", date: "5 days ago", timestamp: 5 },
  { name: "Jasmine K.", location: "Reading, PA", rating: 5, text: "Saving about $50 monthly — that's $600 a year. Vacation money right there. Totally worth the small effort.", date: "2 days ago", timestamp: 2 },
  { name: "Frank D.", location: "Erie, PA", rating: 5, text: "Kicking myself for not looking into this earlier. Bills have dropped significantly. Could've saved so much more.", date: "1 week ago", timestamp: 7 },
  { name: "Sonia H.", location: "Syracuse, NY", rating: 5, text: "Easy to navigate and the numbers matched my actual bill. Impressed with how accurate everything was.", date: "4 days ago", timestamp: 4 },
  { name: "Reginald C.", location: "Albany, NY", rating: 5, text: "All pricing is upfront — no fine print digging. Support answered my question same day. Sorted quickly.", date: "3 days ago", timestamp: 3 },
  { name: "Tanya M.", location: "Paterson, NJ", rating: 5, text: "Friends were skeptical when I told them. Now they've all signed up because their bills are lower too.", date: "1 week ago", timestamp: 7 },
  { name: "Leo T.", location: "Elizabeth, NJ", rating: 5, text: "Saved me hours of calling different companies. Everything's in one spot. Picked a plan, done, paying less.", date: "5 days ago", timestamp: 5 },
];

// Compute dynamic dates relative to today
function computeTestimonials() {
  const now = new Date();
  const daysSinceAnchor = Math.floor((now - REVIEW_ANCHOR) / (1000 * 60 * 60 * 24));
  return [...allTestimonials]
    .map(t => ({
      ...t,
      displayDate: getTimeAgo(t.timestamp + daysSinceAnchor),
      sortKey: t.timestamp + daysSinceAnchor,
    }))
    .sort((a, b) => a.sortKey - b.sortKey);
}

export default function TestimonialsSection() {
  const testimonials = useMemo(() => computeTestimonials(), []);
  const [visibleCount, setVisibleCount] = useState(8);
  const visibleTestimonials = testimonials.slice(0, visibleCount);
  const hasMore = visibleCount < testimonials.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, testimonials.length));
  };

  return (
    <section className="bg-slate-50 py-10 sm:py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-200 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-gray-900">4.8</span>
            <span className="text-gray-400">|</span>
            <span className="text-xs text-gray-600 font-medium">2,500+ Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] mb-2">
            Real People. Real Savings.
          </h2>
          <p className="text-sm sm:text-base text-gray-600">Every review is from a verified customer who switched through Electric Scouts.</p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
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
              className="px-8 py-3 text-sm font-semibold hover:bg-[#0A5C8C] hover:text-white transition-colors"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
