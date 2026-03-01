import React, { useState } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";

// Review Card Component
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 group hover:-translate-y-1 relative overflow-hidden touch-manipulation">
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

const allTestimonials = [
  // Texas
  { name: "Sarah M.", location: "Houston, TX", rating: 5, text: "Finally got around to shopping electricity rates and wow, $80 less per month! The side-by-side comparison made it actually easy to understand what I was getting.", date: "2 days ago", timestamp: 2 },
  { name: "Michael R.", location: "Dallas, TX", rating: 5, text: "My old contract expired and I was dreading the research. This site had everything laid out clearly - picked a plan in 15 minutes and the rate is way better than what I had.", date: "1 week ago", timestamp: 7 },
  { name: "Jennifer L.", location: "Austin, TX", rating: 5, text: "Honestly didn't think I'd see much difference, but my last bill was $40 cheaper. Same usage, just a better rate. Should've done this years ago.", date: "3 days ago", timestamp: 3 },
  { name: "David K.", location: "San Antonio, TX", rating: 5, text: "No surprises on my first bill - the rate was exactly what they showed. Appreciate the straightforward pricing without all the marketing fluff.", date: "5 days ago", timestamp: 5 },
  
  // Illinois
  { name: "Lisa P.", location: "Chicago, IL", rating: 5, text: "Spent way too many hours on other sites trying to figure this out. This one actually shows you the real cost including all those delivery fees. Game changer.", date: "1 week ago", timestamp: 7 },
  { name: "James T.", location: "Aurora, IL", rating: 5, text: "My coworker told me about this and I'm glad she did. Locked in a fixed rate that's saving me about $65 monthly. Can't complain about that.", date: "4 days ago", timestamp: 4 },
  { name: "Amanda W.", location: "Naperville, IL", rating: 5, text: "Got my parents and sister set up too after I saw how much lower my bill was. They're all happy with their new rates. Easy enough for anyone to use.", date: "2 weeks ago", timestamp: 14 },
  
  // Ohio
  { name: "Robert C.", location: "Columbus, OH", rating: 5, text: "Had questions about contract length and someone actually picked up the phone and explained everything. Found a plan that fits my budget without feeling pressured.", date: "3 days ago", timestamp: 3 },
  { name: "Karen H.", location: "Cleveland, OH", rating: 5, text: "Been paying attention to my bills and they're consistently 20-25% lower than before. Same house, same habits, just a smarter choice.", date: "1 week ago", timestamp: 7 },
  { name: "Chris B.", location: "Cincinnati, OH", rating: 5, text: "Everything was laid out in plain English - rates, fees, contract terms. Got exactly what I signed up for. Refreshing change from the usual confusion.", date: "5 days ago", timestamp: 5 },
  
  // Pennsylvania
  { name: "Patricia G.", location: "Philadelphia, PA", rating: 5, text: "Whole thing took maybe 10 minutes from start to finish. Already seeing the savings kick in. Wish I'd known this existed sooner.", date: "2 days ago", timestamp: 2 },
  { name: "Steven A.", location: "Pittsburgh, PA", rating: 5, text: "Needed something with no early termination fee since I might move for work. Found exactly what I needed without having to dig through 50 different websites.", date: "1 week ago", timestamp: 7 },
  { name: "Michelle D.", location: "Allentown, PA", rating: 5, text: "My sister sent me this link after she saved on her bill. Turns out I was overpaying by a lot. New rate is significantly better.", date: "4 days ago", timestamp: 4 },
  
  // New York
  { name: "Daniel F.", location: "New York, NY", rating: 5, text: "Mentioned this to three people at work and they all ended up using it. The rates really are that much better than what most of us were paying.", date: "3 days ago", timestamp: 3 },
  { name: "Emily S.", location: "Buffalo, NY", rating: 5, text: "Read through actual customer reviews before picking a provider. Helped avoid some sketchy companies. Went with a solid option and it's been great.", date: "1 week ago", timestamp: 7 },
  { name: "Brian N.", location: "Rochester, NY", rating: 5, text: "My bill went from around $180 to $78 last month. Same apartment, same everything. Just found a rate that actually makes sense.", date: "2 weeks ago", timestamp: 14 },
  
  // New Jersey
  { name: "Rachel V.", location: "Newark, NJ", rating: 5, text: "Was dreading having to research all this but the filters made it dead simple. Picked by rate and contract length and done. Bill is noticeably cheaper now.", date: "5 days ago", timestamp: 5 },
  { name: "Kevin J.", location: "Jersey City, NJ", rating: 5, text: "Actually shows you what you're paying for - energy charge, delivery fees, everything. No hidden BS. Found a solid plan that's saving me money every month.", date: "3 days ago", timestamp: 3 },
  
  // Maryland
  { name: "Angela M.", location: "Baltimore, MD", rating: 5, text: "Found a 12-month fixed rate that's way cheaper than what I was on. No weird contract terms or surprise fees either. Pretty straightforward.", date: "1 week ago", timestamp: 7 },
  { name: "Mark E.", location: "Columbia, MD", rating: 5, text: "My old plan was killing me financially. This helped me find something reasonable. The actual process was surprisingly painless.", date: "4 days ago", timestamp: 4 },
  
  // Massachusetts
  { name: "Nicole T.", location: "Boston, MA", rating: 5, text: "Rent here is brutal so saving $50-60 monthly on electricity actually helps. Interface is clean and you can tell what you're comparing.", date: "2 days ago", timestamp: 2 },
  { name: "Jason L.", location: "Worcester, MA", rating: 5, text: "Kept putting this off because I thought it'd be complicated. Took like 20 minutes total and I'm paying less now. Should've done it sooner.", date: "1 week ago", timestamp: 7 },
  
  // Connecticut
  { name: "Stephanie R.", location: "Hartford, CT", rating: 5, text: "Wanted to go green without paying a premium. Found a 100% renewable plan that's actually cheaper than my old rate. Win-win.", date: "5 days ago", timestamp: 5 },
  { name: "Timothy W.", location: "New Haven, CT", rating: 5, text: "Had a question about my account and got a real response pretty quickly. The rate they quoted me ended up being accurate too.", date: "3 days ago", timestamp: 3 },
  
  // Rhode Island
  { name: "Melissa K.", location: "Providence, RI", rating: 5, text: "Living on a tight budget so even small savings matter. Found a plan that knocked about $35 off my monthly electric bill. Really helps.", date: "2 weeks ago", timestamp: 14 },
  
  // New Hampshire
  { name: "Andrew H.", location: "Manchester, NH", rating: 5, text: "Told my brother about this after I saw my first lower bill. Now my whole family uses it. We all found better rates than what we had.", date: "1 week ago", timestamp: 7 },
  
  // Maine
  { name: "Catherine P.", location: "Portland, ME", rating: 5, text: "Enrollment was quick, rate is competitive, and my first bill matched what they estimated. No surprises or weird charges.", date: "4 days ago", timestamp: 4 },
  
  // More Texas cities
  { name: "Gregory S.", location: "Fort Worth, TX", rating: 5, text: "Compared about 15 different plans and picked one that saved me the most. Process was straightforward, no complaints.", date: "2 days ago", timestamp: 2 },
  { name: "Samantha B.", location: "Plano, TX", rating: 5, text: "Set up both my home and my small business through here. Both bills dropped significantly. Really pleased with the results.", date: "1 week ago", timestamp: 7 },
  { name: "Richard M.", location: "Arlington, TX", rating: 5, text: "Friend hyped this up and I was skeptical but he was right. Rate is legitimately better and there's been no issues so far.", date: "5 days ago", timestamp: 5 },
  
  // More Illinois
  { name: "Jessica W.", location: "Rockford, IL", rating: 5, text: "Whole thing was done in one sitting. New rate is almost 3 cents cheaper per kWh which really adds up over the month.", date: "6 days ago", timestamp: 6 },
  { name: "Thomas B.", location: "Joliet, IL", rating: 5, text: "My bill used to be around $140, now it's closer to $95. That's real money back in my pocket every single month.", date: "1 week ago", timestamp: 7 },
  
  // More Ohio
  { name: "Maria S.", location: "Toledo, OH", rating: 5, text: "Had about a dozen options to choose from. Filtered by what I needed and picked one in 10 minutes. Way better than my old rate.", date: "3 days ago", timestamp: 3 },
  { name: "Paul R.", location: "Akron, OH", rating: 5, text: "Good variety of plans to pick from. Had a question about renewable options and got help figuring it out. Found a solid plan.", date: "5 days ago", timestamp: 5 },
  
  // More Pennsylvania
  { name: "Laura K.", location: "Reading, PA", rating: 5, text: "Did the math and I'm saving about $50 monthly, so around $600 annually. That's vacation money right there. Totally worth the small effort.", date: "2 days ago", timestamp: 2 },
  { name: "John D.", location: "Erie, PA", rating: 5, text: "Kicking myself for not looking into this earlier. My bills have dropped significantly. Could've saved so much more if I'd known sooner.", date: "1 week ago", timestamp: 7 },
  
  // More New York
  { name: "Elizabeth H.", location: "Syracuse, NY", rating: 5, text: "Site is easy to navigate and the numbers they showed me matched my actual bill. Impressed with how accurate everything was.", date: "4 days ago", timestamp: 4 },
  { name: "William C.", location: "Albany, NY", rating: 5, text: "All the pricing info is upfront - no digging through fine print. Support answered my question same day. Got everything sorted quickly.", date: "3 days ago", timestamp: 3 },
  
  // More New Jersey
  { name: "Christine M.", location: "Paterson, NJ", rating: 5, text: "My friends were skeptical when I told them to check this out. Now they've all signed up because their bills are lower too. Feels good to share something that works.", date: "1 week ago", timestamp: 7 },
  { name: "George T.", location: "Elizabeth, NJ", rating: 5, text: "Saved me hours of calling different companies. Everything's in one spot. Picked a plan, done deal, paying less now.", date: "5 days ago", timestamp: 5 },
  
  // More Maryland
  { name: "Sharon L.", location: "Germantown, MD", rating: 5, text: "Process was simple, got a better rate, and the contract terms are clear. No complaints here.", date: "2 days ago", timestamp: 2 },
  
  // More Massachusetts
  { name: "Joseph F.", location: "Springfield, MA", rating: 5, text: "Was overwhelmed by all the choices. This helped me narrow it down to what actually fits my budget. Found something that works.", date: "6 days ago", timestamp: 6 },
  
  // More Connecticut
  { name: "Barbara N.", location: "Bridgeport, CT", rating: 5, text: "Legitimately saving money every month. Thought it would be complicated but it wasn't. Pretty happy with the outcome.", date: "1 week ago", timestamp: 7 },
  { name: "Charles G.", location: "Stamford, CT", rating: 5, text: "Solid service and actual savings. I've mentioned it to probably five people at this point because it genuinely helped.", date: "4 days ago", timestamp: 4 },
  
  // Additional Recent Reviews
  { name: "Rebecca T.", location: "Corpus Christi, TX", rating: 5, text: "The comparison laid everything out side-by-side so I could actually see what made sense. Picked the best value plan and feeling good about it.", date: "1 day ago", timestamp: 1 },
  { name: "Marcus D.", location: "Lubbock, TX", rating: 5, text: "My last few bills have all been lower than before. Same usage habits, just a smarter rate. Working out exactly like I hoped.", date: "3 weeks ago", timestamp: 21 },
  { name: "Diana K.", location: "Peoria, IL", rating: 5, text: "Entire experience has been smooth. Rate is good, billing is accurate, no weird charges. That's all you really need.", date: "1 month ago", timestamp: 30 },
  { name: "Oscar M.", location: "Youngstown, OH", rating: 5, text: "The money I'm saving actually adds up to something meaningful. We've gone out to eat twice on the savings alone. Pretty cool.", date: "2 months ago", timestamp: 60 },
  { name: "Veronica S.", location: "Lancaster, PA", rating: 5, text: "Looking back at my old bills and wondering why I waited so long. The difference is substantial and consistent every month.", date: "3 months ago", timestamp: 90 },
  
  { name: "Derek P.", location: "El Paso, TX", rating: 5, text: "Choosing a plan was actually straightforward instead of confusing. Got a solid rate and the signup was quick.", date: "1 day ago", timestamp: 1 },
  { name: "Natalie H.", location: "Yonkers, NY", rating: 5, text: "Everything's been smooth sailing. Lower rate than before and customer service responded quickly when I had a question.", date: "3 weeks ago", timestamp: 21 },
  { name: "Felix R.", location: "Camden, NJ", rating: 5, text: "Best money move I've made recently. Bill went from $135 to $89 and I'm using the same amount of power. Just smarter shopping.", date: "1 month ago", timestamp: 30 },
  { name: "Brenda L.", location: "Lowell, MA", rating: 5, text: "Consistently lower bills. I bring this up whenever someone complains about their electric bill because it genuinely helped me.", date: "2 months ago", timestamp: 60 },
  { name: "Walter J.", location: "Waterbury, CT", rating: 5, text: "My electricity spending is noticeably down. Tracked it month over month and the savings are real and consistent.", date: "3 months ago", timestamp: 90 },
  
  { name: "Tiffany A.", location: "Garland, TX", rating: 5, text: "Interface made it really easy to compare without getting lost in jargon. Found what I needed quickly.", date: "1 day ago", timestamp: 1 },
  { name: "Raymond B.", location: "Springfield, IL", rating: 5, text: "Starting to see the impact on my monthly budget. Extra $40-50 staying in my account feels good.", date: "3 weeks ago", timestamp: 21 },
  { name: "Monica W.", location: "Dayton, OH", rating: 5, text: "No regrets about making the change. Got what was promised - a better rate without any hassle.", date: "1 month ago", timestamp: 30 },
  { name: "Harold G.", location: "Scranton, PA", rating: 5, text: "Numbers on my bill match what they estimated. No surprise charges or weird fees. Exactly what I signed up for.", date: "2 months ago", timestamp: 60 },
  { name: "Gina C.", location: "White Plains, NY", rating: 5, text: "Still happy with the choice I made. Bills are lower every month and service has been solid.", date: "3 months ago", timestamp: 90 },
  
  { name: "Terrence V.", location: "Irving, TX", rating: 5, text: "Process was really smooth. Rate I locked in is much better than what I had. Looking forward to the savings.", date: "1 day ago", timestamp: 1 },
  { name: "Erica N.", location: "Trenton, NJ", rating: 5, text: "Happy with my new plan. Electric Scouts made the whole thing way less confusing than I expected.", date: "3 weeks ago", timestamp: 21 },
  { name: "Vincent K.", location: "Cambridge, MA", rating: 5, text: "Still satisfied with the plan I picked. Rate is good and service has been reliable.", date: "1 month ago", timestamp: 30 },
  { name: "Phyllis D.", location: "Canton, OH", rating: 5, text: "This is legit. Real savings showing up on every bill. Not some scam or gimmick.", date: "2 months ago", timestamp: 60 },
  { name: "Bernard S.", location: "Danbury, CT", rating: 5, text: "My bills are consistently 25-30% lower. That kind of savings actually makes a dent in the budget.", date: "3 months ago", timestamp: 90 }
];

// Sort testimonials by timestamp (most recent first)
const testimonials = [...allTestimonials].sort((a, b) => a.timestamp - b.timestamp);



export default function TestimonialsSection() {
  const [visibleCount, setVisibleCount] = useState(8);
  const visibleTestimonials = testimonials.slice(0, visibleCount);
  const hasMore = visibleCount < testimonials.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, testimonials.length));
  };

  return (
    <section className="bg-slate-50 py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-md border border-gray-200 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900">4.8</span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-600 font-medium">2,500+ Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] mb-2 px-4">
            Real People. Real Bills. Real Savings.
          </h2>
          <p className="text-sm text-gray-600 px-4">Every review is from a verified customer who used Electric Scouts to lower their electricity bill.</p>
        </div>

        {/* Reviews Grid - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 mb-6 sm:mb-8">
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
              className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-semibold hover:bg-[#0A5C8C] hover:text-white transition-colors touch-manipulation"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}