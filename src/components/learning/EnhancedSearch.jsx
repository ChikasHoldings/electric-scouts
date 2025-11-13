import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp, Clock, Tag, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// Fuzzy matching implementation - calculates similarity between strings
const fuzzyMatch = (str, pattern) => {
  if (!pattern) return { score: 1, matches: true };
  
  str = str.toLowerCase();
  pattern = pattern.toLowerCase();
  
  // Exact match gets highest score
  if (str.includes(pattern)) {
    return { score: 1, matches: true };
  }
  
  // Calculate Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(str, pattern);
  const maxLength = Math.max(str.length, pattern.length);
  const similarity = 1 - (distance / maxLength);
  
  // Consider it a match if similarity is above threshold
  return {
    score: similarity,
    matches: similarity > 0.6 // 60% similarity threshold
  };
};

// Levenshtein distance algorithm for fuzzy string matching
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Advanced search algorithm with fuzzy matching and keyword scoring
const advancedSearch = (articles, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return articles.map(article => ({ article, score: 0, matchedFields: [] }));
  }
  
  const terms = searchTerm.toLowerCase().trim().split(/\s+/);
  
  return articles.map(article => {
    let totalScore = 0;
    const matchedFields = [];
    
    terms.forEach(term => {
      // Search in title (highest weight)
      const titleMatch = fuzzyMatch(article.title, term);
      if (titleMatch.matches) {
        totalScore += titleMatch.score * 10;
        if (!matchedFields.includes('title')) matchedFields.push('title');
      }
      
      // Search in description (high weight)
      const descMatch = fuzzyMatch(article.description, term);
      if (descMatch.matches) {
        totalScore += descMatch.score * 7;
        if (!matchedFields.includes('description')) matchedFields.push('description');
      }
      
      // Search in excerpt (medium weight)
      const excerptMatch = fuzzyMatch(article.excerpt, term);
      if (excerptMatch.matches) {
        totalScore += excerptMatch.score * 5;
        if (!matchedFields.includes('excerpt')) matchedFields.push('excerpt');
      }
      
      // Search in keywords (high weight for exact matches)
      if (article.keywords) {
        article.keywords.forEach(keyword => {
          const keywordMatch = fuzzyMatch(keyword, term);
          if (keywordMatch.matches) {
            totalScore += keywordMatch.score * 8;
            if (!matchedFields.includes('keywords')) matchedFields.push('keywords');
          }
        });
      }
      
      // Search in category (medium weight)
      const categoryMatch = fuzzyMatch(article.category, term);
      if (categoryMatch.matches) {
        totalScore += categoryMatch.score * 6;
        if (!matchedFields.includes('category')) matchedFields.push('category');
      }
    });
    
    return {
      article,
      score: totalScore,
      matchedFields,
      matches: totalScore > 0
    };
  })
  .filter(result => result.matches)
  .sort((a, b) => b.score - a.score);
};

// Extract popular search terms from articles
const getPopularSearchTerms = (articles) => {
  const termFrequency = {};
  
  articles.forEach(article => {
    if (article.keywords) {
      article.keywords.forEach(keyword => {
        const term = keyword.toLowerCase();
        termFrequency[term] = (termFrequency[term] || 0) + 1;
      });
    }
  });
  
  return Object.entries(termFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term]) => term);
};

// Get recent searches from localStorage
const getRecentSearches = () => {
  try {
    const searches = localStorage.getItem('recentSearches');
    return searches ? JSON.parse(searches) : [];
  } catch {
    return [];
  }
};

// Save search to recent searches
const saveRecentSearch = (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) return;
  
  try {
    let searches = getRecentSearches();
    searches = searches.filter(s => s.toLowerCase() !== searchTerm.toLowerCase());
    searches.unshift(searchTerm.trim());
    searches = searches.slice(0, 5); // Keep only last 5
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  } catch (e) {
    console.error('Failed to save recent search:', e);
  }
};

export default function EnhancedSearch({ 
  articles, 
  onSearch, 
  placeholder = "Search articles, topics, cities, or states..." 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularTerms, setPopularTerms] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setPopularTerms(getPopularSearchTerms(articles));
  }, [articles]);
  
  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        const results = advancedSearch(articles, searchTerm);
        onSearch(results.map(r => r.article));
        
        // Generate suggestions based on search results
        generateSuggestions(searchTerm, results);
      } else {
        onSearch(articles);
        setSuggestions([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, articles]);
  
  const generateSuggestions = (term, results) => {
    const suggestionSet = new Set();
    
    // Add top matching articles as suggestions
    results.slice(0, 3).forEach(result => {
      suggestionSet.add({
        type: 'article',
        text: result.article.title,
        article: result.article,
        matchedFields: result.matchedFields
      });
    });
    
    // Add matching keywords as suggestions
    articles.forEach(article => {
      if (article.keywords) {
        article.keywords.forEach(keyword => {
          const match = fuzzyMatch(keyword, term);
          if (match.matches && keyword.toLowerCase() !== term.toLowerCase()) {
            suggestionSet.add({
              type: 'keyword',
              text: keyword,
              score: match.score
            });
          }
        });
      }
    });
    
    // Add matching categories
    const categories = [...new Set(articles.map(a => a.category))];
    categories.forEach(category => {
      const match = fuzzyMatch(category, term);
      if (match.matches && category.toLowerCase() !== term.toLowerCase()) {
        suggestionSet.add({
          type: 'category',
          text: category,
          score: match.score
        });
      }
    });
    
    // Convert to array and sort by relevance
    const suggestionsArray = Array.from(suggestionSet)
      .sort((a, b) => {
        if (a.type === 'article' && b.type !== 'article') return -1;
        if (a.type !== 'article' && b.type === 'article') return 1;
        return (b.score || 0) - (a.score || 0);
      })
      .slice(0, 6);
    
    setSuggestions(suggestionsArray);
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };
  
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'article') {
      setSearchTerm(suggestion.text);
      saveRecentSearch(suggestion.text);
    } else {
      setSearchTerm(suggestion.text);
      saveRecentSearch(suggestion.text);
    }
    setShowSuggestions(false);
  };
  
  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    setShowSuggestions(false);
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    onSearch(articles);
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    const totalSuggestions = suggestions.length + 
      (searchTerm.length === 0 ? recentSearches.length : 0);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < totalSuggestions - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev > 0 ? prev - 1 : totalSuggestions - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      if (searchTerm.length === 0 && highlightedIndex < recentSearches.length) {
        handleRecentSearchClick(recentSearches[highlightedIndex]);
      } else {
        const suggestionIndex = searchTerm.length === 0 
          ? highlightedIndex - recentSearches.length 
          : highlightedIndex;
        if (suggestions[suggestionIndex]) {
          handleSuggestionClick(suggestions[suggestionIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'article': return <Search className="w-4 h-4" />;
      case 'keyword': return <Tag className="w-4 h-4" />;
      case 'category': return <TrendingUp className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="relative max-w-2xl mx-auto" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-12 h-14 text-base border-2 shadow-lg rounded-xl focus:ring-2 focus:ring-[#0A5C8C] focus:border-[#0A5C8C]"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Search Results Count */}
      {searchTerm && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Smart search with fuzzy matching enabled</span>
          </p>
        </div>
      )}
      
      {/* Suggestions Dropdown */}
      {showSuggestions && (searchTerm.length > 0 || recentSearches.length > 0 || popularTerms.length > 0) && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {searchTerm.length === 0 && recentSearches.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Recent Searches
              </div>
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(term)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors rounded-lg flex items-center gap-3 ${
                    highlightedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{term}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const actualIndex = searchTerm.length === 0 
                  ? index + recentSearches.length 
                  : index;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(actualIndex)}
                    className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors rounded-lg flex items-center gap-3 ${
                      highlightedIndex === actualIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-gray-400 flex-shrink-0">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.type === 'article' && suggestion.matchedFields && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Matched in: {suggestion.matchedFields.join(', ')}
                        </div>
                      )}
                    </div>
                    {suggestion.type !== 'article' && (
                      <div className="text-xs text-gray-400 flex-shrink-0 capitalize">
                        {suggestion.type}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Popular Terms (when no search term) */}
          {searchTerm.length === 0 && popularTerms.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" />
                Popular Topics
              </div>
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {popularTerms.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(term)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-xs font-medium transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* No results message */}
          {searchTerm.length > 0 && suggestions.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                No suggestions found. Try different keywords or check for typos.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Fuzzy search is active - we'll find close matches!
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Export the advanced search function for use elsewhere
export { advancedSearch, fuzzyMatch };