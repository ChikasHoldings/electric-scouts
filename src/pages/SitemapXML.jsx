import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileCode, ExternalLink, AlertCircle } from "lucide-react";

/**
 * A readable view of the sitemap the build actually publishes.
 *
 * It used to generate a second sitemap in the browser, and that copy was both
 * wrong and dangerous. Wrong, because it read the route registry without the
 * provider or article lists and so published a few dozen URLs where the real
 * file has hundreds. Dangerous, because two sitemaps that disagree is a signal
 * Google acts on. It also threw a TypeError on every single load — it assigned
 * to `document.contentType`, which is read-only, so opening this page put an
 * uncaught error in the console of anyone who happened to land here.
 *
 * Now it fetches /sitemap.xml, the file the prerender step writes. There is
 * only one sitemap, and this page can only ever show what is in it.
 */
export default function SitemapXML() {
  const [state, setState] = useState({ status: "loading", xml: "", count: 0 });

  useEffect(() => {
    let active = true;
    fetch("/sitemap.xml", { headers: { Accept: "application/xml" } })
      .then((response) => {
        if (!response.ok) throw new Error(`sitemap.xml returned ${response.status}`);
        return response.text();
      })
      .then((xml) => {
        if (!active) return;
        setState({ status: "ready", xml, count: (xml.match(/<url>/g) || []).length });
      })
      .catch((error) => {
        if (!active) return;
        setState({ status: "error", xml: String(error.message), count: 0 });
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#0A5C8C]/10 flex items-center justify-center flex-shrink-0">
            <FileCode className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sitemap source</h1>
            <p className="text-gray-600">
              The XML submitted to search engines, exactly as published.{" "}
              {state.status === "ready" && (
                <span className="font-medium text-gray-900">{state.count} URLs.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <a
            href="/sitemap.xml"
            className="inline-flex items-center gap-1.5 text-[#0A5C8C] hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Open /sitemap.xml
          </a>
          <Link to="/sitemap" className="inline-flex items-center gap-1.5 text-[#0A5C8C] hover:underline font-medium">
            Browse the site index instead
          </Link>
        </div>

        {state.status === "error" ? (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-gray-900">Could not read the sitemap</p>
              <p className="text-sm text-gray-600">{state.xml}</p>
            </div>
          </div>
        ) : (
          <pre className="bg-white border border-gray-200 rounded-lg p-5 text-xs leading-relaxed text-gray-800 overflow-x-auto whitespace-pre-wrap">
            {state.status === "loading" ? "Loading sitemap.xml…" : state.xml}
          </pre>
        )}
      </div>
    </div>
  );
}
