import { useState, useRef, useEffect } from "react";
import { Home, Building2, Leaf, Check } from "lucide-react";

/**
 * The input types a question can render.
 *
 * Everything here is a real button, radio or labelled input — never a clickable
 * div — so keyboard and screen-reader users get the same flow as everyone else.
 */

const ICONS = { home: Home, building: Building2, leaf: Leaf };

/**
 * Selection cards.
 *
 * Rendered as a radiogroup: arrow keys move between options and Space/Enter
 * selects, which is what a native radio group gives you and a list of buttons
 * does not.
 */
export function ChoiceGroup({ options, value, onSelect, name }) {
  const containerRef = useRef(null);

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
    <div ref={containerRef} role="radiogroup" aria-label={name} className="space-y-2.5">
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
            className={`w-full text-left flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2 ${
              isSelected
                ? "border-[#0A5C8C] bg-[#0A5C8C]/[0.04] shadow-[0_0_0_1px_#0A5C8C]"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
            }`}
          >
            {Icon && (
              <span
                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  isSelected ? "bg-[#0A5C8C]/10 text-[#0A5C8C]" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              </span>
            )}

            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium text-gray-900">
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
              className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-all ${
                isSelected ? "border-[#0A5C8C] bg-[#0A5C8C]" : "border-gray-300 bg-white"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
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
}) {
  const inputRef = useRef(null);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  useEffect(() => {
    // Focusing the field on mount keeps the flow keyboard-first: the visitor
    // can type and press Enter without reaching for the mouse.
    inputRef.current?.focus();
  }, [id]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

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
        className={`w-full h-12 px-4 rounded-xl border bg-white text-[16px] text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:border-[#0A5C8C] focus:ring-[#0A5C8C]/20"
        }`}
      />

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-[13px] text-gray-500">
          {hint}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 w-full h-12 rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-200 disabled:text-gray-400 text-white text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}

/** Secondary action styled to sit below a primary button without competing. */
export function SecondaryAction({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-12 rounded-xl border border-gray-300 bg-white text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2"
    >
      {children}
    </button>
  );
}

/** Primary action button, matched to the submit button in TextQuestion. */
export function PrimaryAction({ onClick, children, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-200 disabled:text-gray-400 text-white text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2"
    >
      {children}
    </button>
  );
}

/** Controlled state helper so each question owns its own draft value. */
export function useDraft(initial) {
  const [draft, setDraft] = useState(initial ?? "");
  const [error, setError] = useState("");
  return { draft, setDraft, error, setError };
}
