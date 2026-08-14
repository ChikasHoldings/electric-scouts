import { Link, useParams } from "react-router-dom";
import { ArrowRight, Cable, Check, Info, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema, getFAQSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import NotFound from "@/pages/NotFound";
import { getUtilityBySlug } from "@/seo/utilities";
import { buildUtilitySections } from "@/seo/content";
import { getUtilityRoutes } from "@/seo/routes";
import { MARKET_GENERATED_AT } from "@/seo/market";

/**
 * /utilities/:slug — one delivery territory.
 *
 * Every heading, table and answer is read from the same content model the
 * prerenderer serializes, so the page a reader sees after hydration is the page
 * Googlebot read before it. The alternative — writing the copy twice — is how
 * the prerendered HTML on this site once ended up citing 35 suppliers while the
 * rendered footer still claimed "40+".
 *
 * An unknown slug renders the real 404 rather than an empty shell, so a utility
 * that drops below the coverage bar cannot linger as a soft 404.
 */
export default function UtilityDetail() {
  const { slug } = useParams();
  const utility = getUtilityBySlug(slug);

  if (!utility) return <NotFound />;

  const route = getUtilityRoutes().find((entry) => entry.path === utility.path);
  const { intro, sections } = buildUtilitySections({ utility });

  const faqSection = sections.find((section) => section.faqs?.length);
  const tableSections = sections.filter((section) => section.table);
  const explainer = sections.find((section) => section.bullets && !section.table);

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Utilities", url: "/utilities" },
    { name: utility.name, url: utility.path },
  ]);
  const structuredData = faqSection
    ? [breadcrumbData, getFAQSchema(faqSection.faqs)]
    : breadcrumbData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={route?.title}
        description={route?.description}
        canonical={utility.path}
        structuredData={structuredData}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "Utilities", url: "/utilities" },
                { name: utility.name },
              ]}
              variant="light"
              className="mb-3"
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              {utility.name} Electricity Rates
            </h1>
            {intro.map((paragraph, index) => (
              <p key={index} className="text-base sm:text-lg text-blue-100 mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* The correction the page exists to make. */}
        {explainer && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{explainer.heading}</h2>
            {explainer.paragraphs?.map((paragraph, index) => (
              <p key={index} className="text-gray-600 mb-3 max-w-4xl">
                {paragraph}
              </p>
            ))}
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              {explainer.bullets.map((bullet, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-5 flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#0A5C8C] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{bullet}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {tableSections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.heading}</h2>
            {section.paragraphs?.map((paragraph, index) => (
              <p key={index} className="text-gray-600 mb-4 max-w-4xl">
                {paragraph}
              </p>
            ))}
            <div className="overflow-x-auto rounded-xl border-2 border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {section.table.columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="text-left font-semibold text-gray-700 px-4 py-3 whitespace-nowrap"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-gray-100">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 text-gray-700">
                          {cell && typeof cell === "object" ? (
                            cell.path ? (
                              <Link
                                to={cell.path}
                                className="text-[#0A5C8C] hover:text-[#FF6B35] font-medium transition-colors"
                              >
                                {cell.text}
                              </Link>
                            ) : (
                              cell.text
                            )
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {section.links?.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {section.links.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A5C8C] hover:text-[#FF6B35] transition-colors"
                  >
                    {label} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}

        {faqSection && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">{faqSection.heading}</h2>
            <div className="space-y-4 max-w-4xl">
              {faqSection.faqs.map((faq) => (
                <Card key={faq.question} className="border-2">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-2">
                      <Info className="w-5 h-5 text-[#0A5C8C] flex-shrink-0 mt-0.5" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-2xl p-6 sm:p-8 text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Delivery is fixed. Supply is not.
          </h2>
          <p className="text-blue-100 mb-5 max-w-3xl">
            {utility.name} charges the same to deliver your power whoever supplies it. Enter your
            ZIP code to see what the supply half costs from every retailer selling at your address
            (as of {MARKET_GENERATED_AT}).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/compare-rates"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Compare supply rates <ArrowRight className="w-4 h-4" />
            </Link>
            {utility.states.map((state) => (
              <Link
                key={state.code}
                to={state.path}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {state.name} rates
              </Link>
            ))}
            <Link
              to="/utilities"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Cable className="w-4 h-4" />
              Other territories
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
