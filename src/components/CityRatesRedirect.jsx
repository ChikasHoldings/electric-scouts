import { Navigate, useSearchParams } from "react-router-dom";
import { getCityUrl } from "@/utils/cityUrls";

/**
 * Redirects old query-param city URLs to new clean URLs.
 * /city-rates?city=Houston&state=TX → /electricity-rates/texas/houston
 */
export default function CityRatesRedirect() {
  const [searchParams] = useSearchParams();
  const city = searchParams.get('city');
  const state = searchParams.get('state');

  if (city && state) {
    const cleanUrl = getCityUrl(city, state);
    return <Navigate to={cleanUrl} replace />;
  }

  // If no valid params, redirect to all-cities
  return <Navigate to="/all-cities" replace />;
}
