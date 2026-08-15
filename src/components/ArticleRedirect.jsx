import { Navigate, useSearchParams } from "react-router-dom";
import { getArticleUrl } from "@/utils/cityUrls";

/**
 * Redirects old query-param article URLs to new clean URLs.
 * /article-detail?id=6 → /learn/6
 *
 * `slug` is read as well as `id`. The clean URL takes either, and links to the
 * slug form exist in the wild — sending those to the Learning Center index
 * threw away a deep link that would have resolved perfectly well.
 */
export default function ArticleRedirect() {
  const [searchParams] = useSearchParams();
  const identifier = searchParams.get("slug") || searchParams.get("id");

  if (identifier) {
    return <Navigate to={getArticleUrl(identifier)} replace />;
  }

  return <Navigate to="/learning-center" replace />;
}
