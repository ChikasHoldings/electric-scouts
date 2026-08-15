import { Navigate, useSearchParams } from "react-router-dom";
import { getCityUrl } from "@/utils/cityUrls";

/**
 * Redirects old query-param city URLs to new clean URLs.
 * /city-rates?city=Houston&state=TX → /electricity-rates/texas/houston
 *
 * The state is read in whatever form the old link used — code, slug or display
 * name — because these URLs were written by several call sites over the years
 * and they do not agree. `getCityUrl` handles all three and sends anything it
 * cannot place to the city index.
 */
export default function CityRatesRedirect() {
  const [searchParams] = useSearchParams();
  const city = searchParams.get("city");
  const state = searchParams.get("state");

  const target = city && state ? getCityUrl(city, state) : "/all-cities";

  // A target under /city-rates would be a redirect to this very component, and
  // the router would run that loop until the tab gave up on a blank page. That
  // is exactly what used to happen, so the guard stays even though getCityUrl
  // no longer returns such a URL.
  const safe = target.startsWith("/city-rates") ? "/all-cities" : target;

  return <Navigate to={safe} replace />;
}
