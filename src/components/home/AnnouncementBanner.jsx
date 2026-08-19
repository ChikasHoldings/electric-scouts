import { useState, useEffect } from "react";
import { TrendingUp, Users, Award, Clock } from "lucide-react";

const announcements = [
  {
    icon: TrendingUp,
    text: "Over 10,000 Texans saved an average of $475 this month",
    bgColor: "from-green-50 to-emerald-50",
    textColor: "text-green-700",
    iconColor: "text-green-600"
  },
  {
    icon: Clock,
    text: "Switch in minutes - No service interruption guaranteed",
    bgColor: "from-blue-50 to-cyan-50",
    textColor: "text-blue-700",
    iconColor: "text-blue-600"
  },
  {
    icon: Award,
    text: "Independent comparison - we are not owned by a supplier",
    bgColor: "from-yellow-50 to-orange-50",
    textColor: "text-orange-700",
    iconColor: "text-orange-600"
  },
  {
    icon: Users,
    text: "Switching is free and your power never goes out",
    bgColor: "from-purple-50 to-pink-50",
    textColor: "text-purple-700",
    iconColor: "text-purple-600"
  }
];

export default function AnnouncementBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = announcements[currentIndex];
  const Icon = current.icon;

  return (
    <>
      {/* Announcement Bar - Moved from header */}
      <div className="bg-[#6FEDD6] text-[#003049] py-2.5 md:py-3 px-4 overflow-hidden relative">
        <div className="animate-scroll whitespace-nowrap inline-block">
          <span className="text-xs md:text-[15px] font-semibold">
            Compare electricity, internet & mobile plans in your area — enter your ZIP below! 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
            Save hundreds per year with the best utility deals 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
            100% free comparison — no spam, no obligations 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
            Get instant results in deregulated states 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
            Compare electricity, internet & mobile plans in your area — enter your ZIP below! 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
            Save hundreds per year with the best utility deals 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
            100% free comparison — no spam, no obligations 
            &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </>
  );
}