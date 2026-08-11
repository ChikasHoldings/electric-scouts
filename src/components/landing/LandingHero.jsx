import PageBreadcrumbs from "@/components/PageBreadcrumbs";

/**
 * The hero every service landing page opens with.
 *
 * One structure, three colourways. A landing page has about a second to say
 * what it is and offer the one action that matters, so the shape is fixed: the
 * claim on the left, the ZIP form on a white card to the right where it cannot
 * be missed, and the figures that back the claim on a hairline beneath.
 *
 * The card is what makes the dark ground work. White on a deep field reads as
 * the primary action without needing a badge, a glow or a second CTA, and it
 * keeps the input on the light surface people expect to type into.
 *
 * Each page differs by colour, eyebrow, headline and the facts it can support —
 * never by layout, because three different hero layouts would read as three
 * different websites.
 */

const TONES = {
  /** Residential — the brand blue, lightened toward the top corner. */
  residential: {
    background:
      "radial-gradient(120% 110% at 12% -10%, #14719F 0%, #0A5C8C 42%, #073F5D 100%)",
    eyebrow: "text-sky-200",
    glow: "rgba(56,189,248,0.16)",
  },
  /** Commercial — a deeper, cooler navy: the same brand, dressed for work. */
  commercial: {
    background:
      "radial-gradient(120% 110% at 88% -10%, #12557C 0%, #0B3F5F 45%, #052A3F 100%)",
    eyebrow: "text-slate-300",
    glow: "rgba(125,211,252,0.12)",
  },
  /** Renewable — deep green, the one page that steps away from blue. */
  renewable: {
    background:
      "radial-gradient(120% 110% at 12% -10%, #167A55 0%, #0B4A34 45%, #06301F 100%)",
    eyebrow: "text-emerald-200",
    glow: "rgba(52,211,153,0.16)",
  },
};

export default function LandingHero({
  tone = "residential",
  breadcrumbs,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  intro,
  facts = [],
  factsNote,
  formTitle,
  formSubtitle,
  formNote,
  children,
}) {
  const palette = TONES[tone] || TONES.residential;

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ backgroundImage: palette.background, backgroundColor: "#083A56" }}
    >
      {/* A single soft highlight rather than a stack of gradients — it gives the
          panel depth at large sizes and costs nothing on a phone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: palette.glow }}
      />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-7 pb-14 sm:pb-16 lg:pb-20">
        {breadcrumbs && (
          <PageBreadcrumbs items={breadcrumbs} variant="light" className="mb-8 sm:mb-10" />
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-10 lg:gap-16 items-start">
          <div className="min-w-0 max-w-2xl">
            {eyebrow && (
              <p
                className={`inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] ${palette.eyebrow}`}
              >
                {EyebrowIcon && <EyebrowIcon className="w-4 h-4" aria-hidden="true" />}
                {eyebrow}
              </p>
            )}

            <h1 className="mt-4 text-[34px] sm:text-[44px] lg:text-[48px] leading-[1.08] font-semibold tracking-[-0.025em] text-balance">
              {title}
            </h1>

            {intro && (
              <p className="mt-5 text-[17px] sm:text-[18px] leading-relaxed text-white/75">
                {intro}
              </p>
            )}

            {facts.length > 0 && (
              <>
                <dl className="mt-9 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 max-w-xl border-t border-white/15 pt-6">
                  {facts.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                        {label}
                      </dt>
                      <dd className="mt-1.5 text-[22px] font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                {factsNote && (
                  <p className="mt-4 text-[12px] leading-relaxed text-white/55 max-w-xl">
                    {factsNote}
                  </p>
                )}
              </>
            )}
          </div>

          {/* The conversion card. Ring plus a long soft shadow so it sits above
              the dark ground rather than on it. */}
          <div className="rounded-2xl bg-white p-6 sm:p-7 ring-1 ring-black/5 shadow-[0_28px_70px_-28px_rgba(2,20,32,0.85)]">
            <h2 className="text-[18px] font-semibold text-gray-900 tracking-[-0.01em]">
              {formTitle}
            </h2>
            {formSubtitle && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-gray-600">{formSubtitle}</p>
            )}

            <div className="mt-5">{children}</div>

            {formNote && (
              <p className="mt-5 pt-4 border-t border-gray-100 text-[12px] leading-relaxed text-gray-500">
                {formNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
