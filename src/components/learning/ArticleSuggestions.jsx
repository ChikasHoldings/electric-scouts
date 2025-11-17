import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

export default function ArticleSuggestions({ searchTerm, currentArticleId, currentCategory }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm && !currentArticleId && !currentCategory) return;
      
      setLoading(true);
      try {
        // Build context for AI
        let prompt = "You are an electricity rate comparison expert. ";
        
        if (searchTerm) {
          prompt += `A user searched for "${searchTerm}". Suggest 3 highly relevant article topics about electricity rates, providers, or energy savings that would help them. `;
        } else if (currentCategory) {
          prompt += `A user is reading articles in the "${currentCategory}" category. Suggest 3 related article topics they might find helpful. `;
        }
        
        prompt += `Return a JSON array of 3 objects with: title (concise, SEO-friendly), excerpt (1 sentence description), category (one of: City Guides, State Guides, Getting Started, Saving Money, Plan Types, Renewable Energy, Business Energy, Consumer Protection, Switching Providers, Understanding Bills, Seasonal Tips), read_time (e.g., "5 min read").`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    excerpt: { type: "string" },
                    category: { type: "string" },
                    read_time: { type: "string" }
                  }
                }
              }
            }
          }
        });

        setSuggestions(result.suggestions || []);
      } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [searchTerm, currentArticleId, currentCategory]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">
          {searchTerm ? 'Suggested for You' : 'You Might Also Like'}
        </h3>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="bg-white hover:shadow-md transition-all border hover:border-purple-300">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {suggestion.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suggestion.read_time}
                      </span>
                      <span className="text-purple-600 font-medium">{suggestion.category}</span>
                    </div>
                  </div>
                  <Link 
                    to={createPageUrl("LearningCenter") + `?search=${encodeURIComponent(suggestion.title)}`}
                    className="text-purple-600 hover:text-purple-700 flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <p className="text-xs text-purple-600 mt-3 text-center">
        ✨ AI-powered recommendations based on your interests
      </p>
    </div>
  );
}