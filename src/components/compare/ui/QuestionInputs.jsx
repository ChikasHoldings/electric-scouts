import { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Factory,
  Home,
  Hotel,
  Leaf,
  MapPin,
  Stethoscope,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAccent } from "./ComparisonShell";

/**
 * The input types a question can render.
 *
 * Everything here is a real button, radio or labelled input — never a clickable
 * div — so keyboard and screen-reader users get the same flow as everyone else.
 * Colour comes from the branch accent, so the selected option on the renewable
 * path is green and on the commercial path navy, without any question in the
 * registry having to know that.
 */

const ICONS = {
  home: Home,
  building: Building2,
  leaf: Leaf,
  briefcase: Briefcase,
  store: Store,
  restaurant: UtensilsCrossed,
  industrial: Factory,
  healthcare: Stethoscope,
  multifamily: Hotel,
};

/**
 * Selection cards.
 *
 * Rendered as a radiogroup: arrow keys move between options and Space/Enter
 * selects, which is what a native radio group gives you and a list of buttons
 * does not.
 */
export function ChoiceGroup({ options, value, onSelect, name }) {
  const containerRef = useRef(null);
  const accent = useAccent();

  // Options that are a bare, short label — "House", "Apartment", "$500–$1,499"
  // — pair up into two columns from sm upwards: four short labels stacked full
  // width read as a long form, the same four in a grid read as a choice.
  // Longer labels ("Multifamily / property management") stay full width, where
  // they have room to sit on one line instead of wrapping into a stack.
  const hasDescriptions = options.some((option) => option.description);
  const isCompact =
    !hasDescriptions &&
    options.length >= 4 &&
    options.every((option) => option.label.length <= 16);

  const handleKeyDown = (event, index) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + options.length) % options.length;
    const nodes = containerRef.current?.querySelectorAll('[role="radio"]');
    nodes?.[nextIndex]?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={name}
      className={isCompact ? "grid sm:grid-cols-2 auto-rows-fr gap-2.5" : "space-y-2.5"}
    >
      {options.map((option, index) => {
        const Icon = option.icon ? ICONS[option.icon] : null;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            // Only the selected option (or the first, when nothing is selected)
            // is in the tab order, so Tab moves past the group rather than
            // through every option.
            tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
            onClick={() => onSelect(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`group w-full text-left flex items-center gap-3.5 rounded-2xl border px-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${accent.focus} ${
              // A label on its own does not need the height a label plus a
              // description does, or the row reads as mostly empty space.
              option.description ? "py-4" : "py-3"
            } ${
              isSelected
                ? `${accent.border} ${accent.softBg} ring-1 ${accent.ring} shadow-[0_6px_18px_-12px_rgba(2,20,32,0.5)]`
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70 hover:shadow-[0_6px_18px_-14px_rgba(2,20,32,0.45)]"
            }`}
          >
            {Icon && (
              <span
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                  isSelected
                    ? `${accent.solidBg} text-white`
                    : `${accent.tintBg} ${accent.text} group-hover:scale-[1.04] transition-transform`
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
            )}

            <span className="flex-1 min-w-0">
              <span className="block text-[15.5px] font-medium text-gray-900">
                {option.label}
              </span>
              {option.description && (
                <span className="block mt-0.5 text-[13px] text-gray-500 leading-snug">
                  {option.description}
                </span>
              )}
            </span>

            <span
              aria-hidden="true"
              className={`flex-shrink-0 flex items-center justify-center w-[22px] h-[22px] rounded-full border transition-all ${
                isSelected
                  ? `${accent.border} ${accent.solidBg}`
                  : "border-gray-300 bg-white group-hover:border-gray-400"
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Single text-ish input with a real label and inline validation.
 *
 * Errors are announced via role="alert" and tied to the input with
 * aria-describedby, so a screen reader hears why the field was rejected rather
 * than just that it was.
 */
export function TextQuestion({
  id,
  label,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  value,
  onChange,
  onSubmit,
  error,
  maxLength,
  hint,
  submitLabel = "Continue",
  disabled,
  icon: Icon,
  focusSignal,
}) {
  const inputRef = useRef(null);
  const accent = useAccent();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const LeadingIcon = Icon || (id === "zip" ? MapPin : null);

  useEffect(() => {
    // Focusing the field on mount keeps the flow keyboard-first: the visitor
    // can type and press Enter without reaching for the mouse.
    inputRef.current?.focus();
  }, [id]);

  // Return focus to the field after a rejected submit — the click that failed
  // left focus on the Continue button, so without this a keyboard or screen
  // reader user lands nowhere near the input they need to correct.
  //
  // Keyed on a caller-incremented signal rather than on `error`, because
  // submitting the same bad value twice produces an identical message and an
  // effect watching the string alone would not re-run.
  useEffect(() => {
    if (focusSignal) inputRef.current?.focus();
  }, [focusSignal]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`flex items-center gap-3 h-14 px-4 rounded-2xl border bg-white transition-all focus-within:ring-4 ${
          error
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
            : `border-gray-300 ${accent.focusBorder} focus-within:ring-gray-900/[0.06]`
        }`}
      >
        {LeadingIcon && (
          <LeadingIcon className={`w-[18px] h-[18px] flex-shrink-0 ${accent.text}`} aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className="w-full min-w-0 h-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2.5 flex items-start gap-1.5 text-[13px] text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2.5 text-[13px] text-gray-500">
          {hint}
        </p>
      ) : null}

      <div className="mt-6">
        <PrimaryAction type="submit" disabled={disabled}>
          {submitLabel}
        </PrimaryAction>
      </div>
    </form>
  );
}

/**
 * Secondary action styled to sit below a primary button without competing.
 *
 * Pass `to` when the action is navigation and it renders a link instead of a
 * button. The results view previously wrapped this button in a `<Link>` and
 * passed `onClick={() => {}}` to satisfy the signature — a button inside an
 * anchor is invalid HTML and gives assistive technology two nested interactive
 * elements where there is one action. One element, chosen by what it does.
 */
export function SecondaryAction({ onClick, to, children }) {
  const accent = useAccent();
  const className = `w-full h-[52px] rounded-2xl border border-gray-300 bg-white text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${accent.focus}`;

  if (to) {
    return (
      <Link to={to} className={`${className} flex items-center justify-center`}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

/**
 * Primary action.
 *
 * The brand's orange, on every branch. Context is coloured by the accent; the
 * thing you press to move forward stays the one colour it is everywhere else on
 * the site, so it never has to be hunted for.
 */
export function PrimaryAction({ onClick, children, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group w-full h-[52px] rounded-2xl bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none text-white text-[15.5px] font-semibold shadow-[0_10px_24px_-12px_rgba(255,107,53,0.9)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2"
    >
      <span className="flex items-center justify-center gap-2">
        {children}
        <ArrowRight
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:hidden"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

/** Controlled state helper so each question owns its own draft value. */
export function useDraft(initial) {
  const [draft, setDraft] = useState(initial ?? "");
  const [error, setError] = useState("");
  return { draft, setDraft, error, setError };
}
