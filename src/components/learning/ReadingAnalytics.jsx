import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Eye, Award } from "lucide-react";
import { getReadingHistory } from "./ArticleRecommendations";
import { readStoredJson, writeStoredJson } from "@/lib/browser";

export default function ReadingAnalytics({ allArticles }) {
  const [stats, setStats] = useState({
    articlesRead: 0,
    totalReadTime: 0,
    favoriteCategory: '',
    readingStreak: 0
  });

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    try {
      const history = getReadingHistory();
      const views = readStoredJson('articleViews', {});
      
      // Articles read
      const articlesRead = Object.keys(views).length;
      
      // Total read time estimation
      const totalReadTime = history
        .map(id => {
          const article = allArticles.find(a => a.id === id);
          return article ? parseInt(article.readTime) || 0 : 0;
        })
        .reduce((sum, time) => sum + time, 0);
      
      // Favorite category
      const categoryCount = {};
      history.forEach(id => {
        const article = allArticles.find(a => a.id === id);
        if (article && article.category) {
          categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
        }
      });
      const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, ''
      );
      
      // Reading streak (days with activity)
      const readingDates = readStoredJson('readingDates', []);
      const readingStreak = calculateStreak(readingDates);
      
      setStats({
        articlesRead,
        totalReadTime,
        favoriteCategory,
        readingStreak
      });
    } catch (e) {
      console.error('Failed to calculate stats:', e);
    }
  };

  const calculateStreak = (dates) => {
    if (dates.length === 0) return 0;
    
    const today = new Date().toDateString();
    let streak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]).toDateString();
      if (i === 0 && date === today) {
        streak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  if (stats.articlesRead === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          Your Reading Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mx-auto mb-2">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.articlesRead}</div>
            <div className="text-xs text-gray-600">Articles Read</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mx-auto mb-2">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReadTime}</div>
            <div className="text-xs text-gray-600">Minutes Read</div>
          </div>
          {stats.favoriteCategory && (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-sm font-bold text-gray-900 truncate px-2">{stats.favoriteCategory}</div>
              <div className="text-xs text-gray-600">Favorite Topic</div>
            </div>
          )}
          {stats.readingStreak > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mx-auto mb-2">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.readingStreak}</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to track daily reading
export const trackDailyReading = () => {
  try {
    const dates = readStoredJson('readingDates', []);
    const today = new Date().toISOString().split('T')[0];
    
    if (!dates.includes(today)) {
      dates.unshift(today);
      writeStoredJson('readingDates', dates.slice(0, 30)); // Keep last 30 days
    }
  } catch (e) {
    console.error('Failed to track daily reading:', e);
  }
};