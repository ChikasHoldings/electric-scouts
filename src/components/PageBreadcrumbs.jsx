import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * PageBreadcrumbs - Reusable breadcrumb component with visual UI and JSON-LD schema markup.
 * 
 * @param {Array} items - Array of breadcrumb items: [{ name: "Home", url: "/" }, { name: "States", url: "/all-states" }, { name: "Texas" }]
 *   - Last item should NOT have a url (it's the current page)
 * @param {string} variant - "light" (for dark backgrounds) or "dark" (for light backgrounds)
 * @param {string} className - Additional CSS classes
 */
export default function PageBreadcrumbs({ items = [], variant = "light", className = "" }) {
  if (!items || items.length === 0) return null;

  const isLight = variant === "light";

  // JSON-LD BreadcrumbList schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url ? { "item": `https://www.electricscouts.com${item.url}` } : {})
    }))
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* Visual Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`text-sm ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isLight ? "text-blue-300" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span
                    className={`font-medium ${
                      isLight ? "text-white" : "text-gray-900"
                    }`}
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.url || "/"}
                    className={`inline-flex items-center gap-1 transition-colors ${
                      isLight
                        ? "text-blue-200 hover:text-white"
                        : "text-gray-500 hover:text-[#0A5C8C]"
                    }`}
                  >
                    {isFirst && (
                      <Home className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    )}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
