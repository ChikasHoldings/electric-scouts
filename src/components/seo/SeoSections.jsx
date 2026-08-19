/**
 * SeoSections.jsx
 *
 * Renders the page's editorial content — the tables, local context, supplier
 * breakdowns and FAQ answers that src/seo/content.js builds for each route.
 *
 * WHY THIS COMPONENT EXISTS
 *
 * Google indexes the DOM it gets *after* running the page's JavaScript, not the
 * HTML the server sent. This app mounts with `createRoot().render()`, and
 * main.jsx deletes the prerendered summary from #root just before that, so
 * every word the prerenderer wrote was gone from the page before Googlebot's
 * renderer took its snapshot. What Google actually indexed on a city, state or
 * provider URL was the React shell plus whatever its client-side plan queries
 * had resolved in time — frequently a loading state. A URL that renders as an
 * almost-empty document is the definition of a soft 404, and it is why pages
 * that look complete in "view source" were being dropped from the index.
 *
 * Hiding the payload more cleverly would not have fixed that, and serving
 * crawlers content that users never see is cloaking. The fix is for the app to
 * render the content: the same model, as real visible sections, so the served
 * HTML and the rendered DOM say the same thing. That parity is also the only
 * condition under which this page's FAQPage markup is honest — Google requires
 * the answers it describes to be present on the page.
 *
 * WHERE THE CONTENT COMES FROM
 *
 * Two sources, in order:
 *
 *  1. `<script type="application/json" id="seo-content">`, written into the
 *     document by the prerenderer (src/seo/render.js). On a direct page load —
 *     which is every load Googlebot performs — the model is already in the
 *     document, so this renders synchronously on the first paint with no extra
 *     bytes fetched and no chance of a Suspense fallback being what gets
 *     indexed.
 *  2. For an in-app navigation the island still describes the URL the visitor
 *     landed on, so it is ignored and the content model is rebuilt in the
 *     browser from the same builders the prerenderer uses. That import is
 *     deliberately lazy: it pulls the market snapshot and city tables, which no
 *     first paint should have to wait for.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/* ------------------------------------------------------------------ *
 * Reading the prerendered model
 * ------------------------------------------------------------------ */

/** Normalize a pathname the way src/seo/site.js canonicalPath does. */
function normalizePath(pathname) {
  if (!pathname) return '/';
  let path = String(pathname).split('#')[0].split('?')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/').toLowerCase();
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

/**
 * The content model the prerenderer left in the document, if it describes the
 * URL currently being viewed.
 *
 * Read fresh on each call rather than cached at module scope: the island is
 * parsed once per document, but this component can mount before or after a
 * route change and must never render one page's content under another's.
 */
function readIsland(pathname) {
  if (typeof document === 'undefined') return null;
  const tag = document.getElementById('seo-content');
  if (!tag) return null;
  try {
    const parsed = JSON.parse(tag.textContent || '{}');
    if (normalizePath(parsed.path) !== normalizePath(pathname)) return null;
    return parsed;
  } catch {
    // A malformed island is not worth breaking the page over — the client-side
    // builder below produces the same model.
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Presentation
 * ------------------------------------------------------------------ */

/** Internal links stay in the router; anything else is left to the browser. */
function ContentLink({ to, children }) {
  if (typeof to === 'string' && to.startsWith('/')) {
    return (
      <Link to={to} className="text-[#0A5C8C] underline underline-offset-2 hover:text-[#FF6B35]">
        {children}
      </Link>
    );
  }
  return (
    <a href={to} className="text-[#0A5C8C] underline underline-offset-2 hover:text-[#FF6B35]">
      {children}
    </a>
  );
}

/** A table cell is a plain string or {text, path} for a linked one. */
function Cell({ value }) {
  if (value && typeof value === 'object') {
    return value.path ? <ContentLink to={value.path}>{value.text}</ContentLink> : <>{value.text}</>;
  }
  return <>{value}</>;
}

function FactList({ facts }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {facts.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-2">
          <dt className="text-sm text-gray-600">{label}</dt>
          <dd className="text-sm font-semibold text-gray-900 text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataTable({ table }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {table.columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="text-left font-semibold text-gray-900 px-3 py-2 border-b border-gray-200 whitespace-nowrap"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="even:bg-gray-50/60">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className="text-left font-medium text-gray-900 px-3 py-2 border-b border-gray-100"
                  >
                    <Cell value={cell} />
                  </th>
                ) : (
                  <td key={cellIndex} className="text-gray-700 px-3 py-2 border-b border-gray-100">
                    <Cell value={cell} />
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * FAQs render as real headings and paragraphs rather than collapsed panels.
 * The FAQPage markup on this page describes exactly these answers, and Google
 * requires the answer text to be present in the rendered page.
 */
function Faqs({ faqs }) {
  return (
    <div className="space-y-5">
      {faqs.map((faq) => (
        <div key={faq.question}>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">{faq.question}</h3>
          <p className="text-[15px] text-gray-700 leading-relaxed">{faq.answer}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ section }) {
  const hasBody =
    (section.paragraphs && section.paragraphs.length) ||
    (section.facts && section.facts.length) ||
    (section.bullets && section.bullets.length) ||
    (section.table && section.table.rows && section.table.rows.length) ||
    (section.faqs && section.faqs.length) ||
    (section.providers && section.providers.length) ||
    (section.links && section.links.length);

  // A heading with nothing under it is a dead end for a reader and noise for a
  // crawler, so an empty section is dropped — matching the prerenderer.
  if (!hasBody) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{section.heading}</h2>

      {(section.paragraphs || []).map((text, index) => (
        <p key={index} className="text-[15px] text-gray-700 leading-relaxed">
          {text}
        </p>
      ))}

      {section.facts && section.facts.length > 0 && <FactList facts={section.facts} />}

      {section.bullets && section.bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-gray-700">
          {section.bullets.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}

      {section.table && section.table.rows && section.table.rows.length > 0 && (
        <DataTable table={section.table} />
      )}

      {section.faqs && section.faqs.length > 0 && <Faqs faqs={section.faqs} />}

      {section.providers && section.providers.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[15px]">
          {section.providers.map((provider) => (
            <li key={provider.name}>
              {provider.path ? (
                <ContentLink to={provider.path}>{provider.name}</ContentLink>
              ) : (
                <span className="text-gray-700">{provider.name}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {section.links && section.links.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2 text-[15px]">
          {section.links.map(([path, label]) => (
            <li key={`${path}-${label}`}>
              <ContentLink to={path}>{label}</ContentLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

/**
 * Routes that must never render this block: the admin app, and the pages whose
 * whole purpose is to be a machine-readable mirror of something else.
 */
function isExcluded(path) {
  return (
    path.startsWith('/admin') ||
    path === '/sitemap' ||
    path === '/sitemap-xml' ||
    path === '/robots' ||
    path === '/not-found' ||
    path === '/business-quote-dashboard'
  );
}

export default function SeoSections() {
  const location = useLocation();
  const path = normalizePath(location.pathname);

  // Synchronous on a direct load: the model is already in the document, so the
  // content is in the first render — never behind a fallback a crawler might
  // snapshot instead.
  const island = useMemo(() => (isExcluded(path) ? null : readIsland(path)), [path]);
  const [built, setBuilt] = useState(null);

  useEffect(() => {
    // The island covers the landing URL. An in-app navigation needs the model
    // rebuilt, which means pulling the content builders and the data behind
    // them — worth a lazy chunk, not worth blocking a paint.
    if (island || isExcluded(path)) {
      setBuilt(null);
      return undefined;
    }
    let cancelled = false;
    import('@/seo/clientContent.js')
      .then(({ buildContentForPath }) => buildContentForPath(path))
      .then((model) => {
        if (!cancelled) setBuilt(model && model.path === path ? model : null);
      })
      .catch(() => {
        if (!cancelled) setBuilt(null);
      });
    return () => {
      cancelled = true;
    };
  }, [island, path]);

  const model = island || built;
  const sections = (model?.sections || []).filter(Boolean);
  // The article body is the page's own content and ArticleDetail already
  // renders it, so an article contributes its related-guide links and nothing
  // that would appear twice.
  const showIntro = model?.type !== 'article';
  const intro = showIntro ? model?.intro || [] : [];

  if (!sections.length && !intro.length) return null;

  return (
    <div className="bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {intro.map((text, index) => (
          <p key={index} className="text-[15px] text-gray-700 leading-relaxed">
            {text}
          </p>
        ))}
        {sections.map((section, index) => (
          <Section key={`${section.heading}-${index}`} section={section} />
        ))}
      </div>
    </div>
  );
}
