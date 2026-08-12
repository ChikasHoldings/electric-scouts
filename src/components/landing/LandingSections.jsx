import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

/**
 * Shared building blocks for the three service landing pages.
 *
 * The pages say different things to different audiences, but they are the same
 * site: one vertical rhythm, one text measure, one card treatment, one FAQ
 * pattern. Keeping that here means the differences between Residential,
 * Commercial and Renewable are differences of content and accent — not three
 * people's ideas of what a section looks like.
 */

/** Page-level section with consistent spacing and a single content measure. */
export function Section({ id, children, className = "", tone = "default" }) {
  const tones = {
    default: "",
    muted: "bg-gray-50/70 border-y border-gray-100",
  };

  return (
    <section id={id} className={`py-14 sm:py-16 ${tones[tone] || ""} ${className}`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/**
 * Section heading.
 *
 * Body copy is capped at ~68 characters per line: past that a reader loses
 * their place on the return sweep, which is the most common reason a long
 * landing page feels like work.
 */
export function SectionHeading({ title, description, align = "left", as: Tag = "h2" }) {
  const alignment = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={`mb-8 sm:mb-10 max-w-2xl ${alignment}`}>
      <Tag className="text-[26px] sm:text-[30px] leading-tight font-semibold text-gray-900 tracking-[-0.015em]">
        {title}
      </Tag>
      {description && (
        <p className="mt-3 text-[16px] leading-relaxed text-gray-600">{description}</p>
      )}
    </div>
  );
}

/** Content card: one border, one shadow, no gradient. */
export function InfoCard({ icon: Icon, iconClass = "text-[#0A5C8C] bg-[#0A5C8C]/[0.08]", title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {Icon && (
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${iconClass}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-[17px] font-semibold text-gray-900">{title}</h3>
      <div className="mt-2 text-[15px] leading-relaxed text-gray-600 space-y-2">{children}</div>
    </div>
  );
}

/** Numbered steps. Ordered list, because the order is the point. */
export function StepList({ steps }) {
  return (
    <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li key={step.title} className="relative rounded-2xl border border-gray-200 bg-white p-6">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white text-[13px] font-semibold">
            {index + 1}
          </span>
          <h3 className="mt-4 text-[16px] font-semibold text-gray-900">{step.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Facts rendered as a table.
 *
 * Every figure on these pages comes from the market snapshot, so the table
 * carries a plain-language note about what the numbers are and when they were
 * taken rather than presenting them as a live quote.
 */
export function DataTable({ caption, columns, rows, footnote }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 text-[15px] whitespace-nowrap ${
                      cellIndex === 0 ? "font-medium text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {cell && typeof cell === "object" && cell.path ? (
                      <Link to={cell.path} className="text-[#0A5C8C] hover:underline">
                        {cell.text}
                      </Link>
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
      {footnote && <p className="mt-3 text-[13px] text-gray-500">{footnote}</p>}
    </div>
  );
}

/**
 * FAQ list.
 *
 * A real disclosure pattern: each question is a button that owns its answer via
 * aria-controls, so a screen reader announces the state rather than the reader
 * having to guess why nothing happened. Answers stay in the DOM.
 */
export function FaqList({ items, accent = "text-[#0A5C8C]" }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full flex items-start justify-between gap-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2 rounded"
              >
                <span className="text-[16px] font-medium text-gray-900">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-transform ${accent} ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              <p className="pb-5 pr-8 text-[15px] leading-relaxed text-gray-600">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Closing conversion band. One per page — the CTA does not repeat every screen. */
export function FinalCta({ title, description, children, tone = "default" }) {
  const tones = {
    default: "bg-[#0A5C8C]",
    renewable: "bg-green-800",
  };

  return (
    <section className="px-5 sm:px-6 lg:px-8 pb-16 sm:pb-20">
      <div className={`max-w-6xl mx-auto rounded-3xl ${tones[tone] || tones.default} px-6 sm:px-10 py-12`}>
        <div className="max-w-xl">
          <h2 className="text-[26px] sm:text-[30px] leading-tight font-semibold text-white tracking-[-0.015em]">
            {title}
          </h2>
          {description && <p className="mt-3 text-[16px] leading-relaxed text-white/80">{description}</p>}
          <div className="mt-7 rounded-2xl bg-white p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Contextual links out of a page, styled as a quiet list rather than buttons. */
export function RelatedLinks({ title = "Keep reading", links }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([path, label]) => (
          <li key={path}>
            <Link to={path} className="text-[15px] text-[#0A5C8C] hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
