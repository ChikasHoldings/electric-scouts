import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { getCityUrl, getStatePageUrl, STATE_DISPLAY_NAMES } from "@/utils/cityUrls";

/**
 * RelatedCities - Shows related cities in the same state for internal linking.
 * Used on CityRates pages to improve internal linking and SEO.
 * 
 * @param {string} currentCity - Current city name (e.g., "Houston")
 * @param {string} stateCode - State code (e.g., "TX")
 * @param {Array} allCityKeys - Array of all city keys from cityData (e.g., ["Houston-TX", "Dallas-TX", ...])
 */
export default function RelatedCities({ currentCity, stateCode, allCityKeys = [] }) {
  // Filter cities in the same state, excluding the current city
  const samStateCities = allCityKeys
    .filter(key => key.endsWith(`-${stateCode}`) && !key.startsWith(`${currentCity}-`))
    .map(key => key.split('-').slice(0, -1).join('-')) // Extract city name (handles multi-word cities)
    .slice(0, 8); // Limit to 8 related cities

  const stateName = STATE_DISPLAY_NAMES[stateCode] || stateCode;
  const stateUrl = getStatePageUrl(stateCode);

  if (samStateCities.length === 0) return null;

  return (
    <section className="mt-10 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          More {stateName} Cities
        </h2>
        <Link
          to={stateUrl}
          className="text-sm font-medium text-[#0A5C8C] hover:text-[#084a6f] flex items-center gap-1 transition-colors"
        >
          View all {stateName} rates
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {samStateCities.map((city, index) => (
          <Link
            key={index}
            to={getCityUrl(city, stateCode)}
            className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group"
          >
            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#0A5C8C] flex-shrink-0 transition-colors" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-[#0A5C8C] transition-colors truncate">
              {city}, {stateCode}
            </span>
          </Link>
        ))}
      </div>
      {/* Additional internal links */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          to="/all-states"
          className="text-gray-500 hover:text-[#0A5C8C] transition-colors"
        >
          All States →
        </Link>
        <Link
          to="/all-cities"
          className="text-gray-500 hover:text-[#0A5C8C] transition-colors"
        >
          All Cities →
        </Link>
        <Link
          to="/compare-rates"
          className="text-gray-500 hover:text-[#0A5C8C] transition-colors"
        >
          Compare Rates →
        </Link>
        <Link
          to="/learning-center"
          className="text-gray-500 hover:text-[#0A5C8C] transition-colors"
        >
          Learning Center →
        </Link>
      </div>
    </section>
  );
}
