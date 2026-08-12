import { useState } from "react";
import { getProviderLogoUrl } from "@/utils/providerSlug";
import { providerInitials, tintIndexFor } from "../engine/providerBranding";

/**
 * Provider branding on a result card.
 *
 * Three states, and none of them is a broken image:
 *   - a configured logo renders inside a fixed box
 *   - a provider with no configured logo gets a designed initials mark
 *   - a logo that 404s at runtime falls back to the same initials mark
 *
 * The container is a fixed size in every state, so the card never reflows when
 * an image loads, fails, or is lazy-loaded into view.
 *
 * Only logos Electric Scouts actually holds are used — nothing is fetched from
 * a third party at runtime, and nothing is invented.
 */

/** Deterministic tint for a fallback mark, so a provider always looks the same. */
const FALLBACK_TINTS = [
  "bg-[#0A5C8C]/[0.08] text-[#0A5C8C]",
  "bg-[#0B3F5F]/[0.08] text-[#0B3F5F]",
  "bg-[#0A7C52]/[0.08] text-[#0A7C52]",
  "bg-[#B45309]/[0.08] text-[#B45309]",
  "bg-[#6D28D9]/[0.08] text-[#6D28D9]",
];

function tintFor(name) {
  return FALLBACK_TINTS[tintIndexFor(name, FALLBACK_TINTS.length)];
}

/**
 * @param {object} props
 * @param {object} props.provider  provider record, may be undefined
 * @param {string} props.name      provider name, always available on the plan
 * @param {boolean} [props.eager]  true for the Top 3, which are above the fold
 * @param {string} [props.size]
 */
export default function ProviderLogo({ provider, name, eager = false, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : getProviderLogoUrl(provider || { name });

  const box = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const text = size === "sm" ? "text-[12px]" : "text-[13.5px]";

  if (!src) {
    return (
      <span
        className={`${box} flex-shrink-0 inline-flex items-center justify-center rounded-xl font-semibold ${text} ring-1 ring-inset ring-black/[0.06] ${tintFor(String(name || ""))}`}
        // The mark is decorative: the provider name is always rendered beside
        // it, so announcing initials as well would just repeat the name.
        aria-hidden="true"
      >
        {providerInitials(name)}
      </span>
    );
  }

  return (
    <span
      className={`${box} flex-shrink-0 inline-flex items-center justify-center rounded-xl bg-white ring-1 ring-inset ring-black/[0.06] overflow-hidden p-1.5`}
    >
      <img
        src={src}
        alt={`${name} logo`}
        // object-contain with a fixed box handles the aspect ratios providers
        // ship — wordmarks are wide, badges are square — without distortion.
        className="max-w-full max-h-full object-contain"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        width={48}
        height={48}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
