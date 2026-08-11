import { Navigate } from "react-router-dom";
import { getArticleUrl } from "@/utils/cityUrls";

/**
 * Redirects old query-param article URLs to new clean URLs.
 * /article-detail?id=6 → /learn/6
 */
export default function ArticleRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (id) {
    return <Navigate to={getArticleUrl(id)} replace />;
  }

  // If no valid params, redirect to learning center
  return <Navigate to="/learning-center" replace />;
}
