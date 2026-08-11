import { useState, useRef } from "react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/supabaseIntegrations";
import { Upload, FileText, Loader2, AlertCircle, Check } from "lucide-react";
import { promptFor, mapExtractionToState } from "../engine/billAnalysis";
import { PrimaryAction, SecondaryAction } from "./QuestionInputs";

/**
 * Bill Analyzer inside the comparison flow.
 *
 * Uses the same upload + extraction backend as the standalone /bill-analyzer
 * page — there is one analyzer, not two. What differs is the presentation and
 * the fact that results here feed the question-skipping engine.
 */

const ACCEPTED = ".pdf,.png,.jpg,.jpeg";
const MAX_BYTES = 12 * 1024 * 1024;
const ANALYSIS_TIMEOUT_MS = 45000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    ),
  ]);
}

/** The offer screen: upload, or carry on without one. Never forced. */
export function BillOffer({ onUpload, onSkip }) {
  return (
    <div className="space-y-3">
      <PrimaryAction onClick={onUpload}>Upload my bill</PrimaryAction>
      <SecondaryAction onClick={onSkip}>Continue without a bill</SecondaryAction>
      <p className="pt-1 text-xs text-gray-500 leading-relaxed">
        Uploading is optional. We use the bill to read your usage so you answer
        fewer questions — we don&rsquo;t keep your account number.
      </p>
    </div>
  );
}

/** Drop area, analysis progress, and failure recovery. */
export function BillUpload({ customerType, onComplete, onFailure, onSkip, onAnalysisStart }) {
  const [phase, setPhase] = useState("idle"); // idle | uploading | analyzing | failed
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const reset = () => {
    setPhase("idle");
    setFileName("");
    setErrorMessage("");
  };

  const handleFile = async (file) => {
    if (!file) return;

    const isAccepted = /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!isAccepted) {
      setPhase("failed");
      setErrorMessage("That file type isn't supported. Use a PDF, PNG or JPG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase("failed");
      setErrorMessage("That file is larger than 12 MB. Try a smaller copy.");
      return;
    }

    setFileName(file.name);
    setErrorMessage("");
    setPhase("uploading");
    onAnalysisStart?.();

    try {
      const uploaded = await withTimeout(UploadFile({ file }), 30000, "Upload");
      const fileUrl = uploaded?.file_url;
      if (!fileUrl) throw new Error("No file URL returned");

      setPhase("analyzing");

      const result = await withTimeout(
        ExtractDataFromUploadedFile({
          file_url: fileUrl,
          extraction_prompt: promptFor(customerType),
        }),
        ANALYSIS_TIMEOUT_MS,
        "Analysis"
      );

      if (result?.status !== "success" || !result?.output) {
        throw new Error("Extraction unsuccessful");
      }

      const mapped = mapExtractionToState(result.output, customerType);

      // An extraction that yielded nothing usable is a failure from the
      // visitor's point of view, even though the request itself succeeded.
      if (Object.keys(mapped.fields).length === 0) {
        throw new Error("Nothing usable extracted");
      }

      onComplete(mapped);
    } catch {
      setPhase("failed");
      setErrorMessage("");
      onFailure?.();
    }
  };

  if (phase === "uploading" || phase === "analyzing") {
    return <BillAnalyzing fileName={fileName} />;
  }

  if (phase === "failed") {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-medium text-gray-900">
              Couldn&rsquo;t read that bill
            </p>
            <p className="mt-1 text-[13px] text-gray-600 leading-relaxed">
              {errorMessage ||
                "Try another copy or continue by entering your usage manually."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <PrimaryAction onClick={reset}>Try another bill</PrimaryAction>
          <SecondaryAction onClick={onSkip}>Continue manually</SecondaryAction>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="bill-file"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
          isDragging
            ? "border-[#0A5C8C] bg-[#0A5C8C]/[0.04]"
            : "border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[#0A5C8C]/10">
          <Upload className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
        </span>
        <span className="text-center">
          <span className="block text-[15px] font-medium text-gray-900">
            Choose a file or drag it here
          </span>
          <span className="block mt-1 text-[13px] text-gray-500">
            PDF, PNG or JPG · up to 12 MB
          </span>
        </span>
      </label>

      <input
        ref={inputRef}
        id="bill-file"
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <SecondaryAction onClick={onSkip}>Continue without a bill</SecondaryAction>
    </div>
  );
}

/**
 * Analysis progress.
 *
 * Deliberately says nothing about OCR, parsers or extraction schemas — the
 * visitor is told what is happening to their bill, not how.
 */
export function BillAnalyzing({ fileName }) {
  return (
    <div className="py-6 text-center" role="status" aria-live="polite">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0A5C8C]/10 mb-4">
        <Loader2 className="w-5 h-5 text-[#0A5C8C] animate-spin" aria-hidden="true" />
      </span>
      <p className="text-[17px] font-semibold text-gray-900">
        Analyzing your electricity bill
      </p>
      <p className="mt-1.5 text-[14px] text-gray-600">
        We&rsquo;re reviewing your usage and current electricity information.
      </p>
      {fileName && (
        <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-gray-500">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="truncate max-w-[220px]">{fileName}</span>
        </p>
      )}
    </div>
  );
}

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const NUMBER = new Intl.NumberFormat("en-US");

/**
 * Confirmation summary.
 *
 * Shows only the figures a customer would recognise from their own bill —
 * every extracted field is deliberately not dumped here.
 */
export function BillSummary({ state, onConfirm, onEdit }) {
  const rows = [
    state.currentProvider && { label: "Current provider", value: state.currentProvider },
    state.monthlyUsageKwh > 0 && {
      label: "Monthly usage",
      value: `${NUMBER.format(Math.round(state.monthlyUsageKwh))} kWh`,
    },
    state.monthlyCost > 0 && {
      label: "Recent bill",
      value: CURRENCY.format(state.monthlyCost),
    },
    state.peakDemandKw > 0 && {
      label: "Peak demand",
      value: `${NUMBER.format(Math.round(state.peakDemandKw))} kW`,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 text-[#0A7C52]">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0A7C52]/10">
          <Check className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <p className="text-[15px] font-medium">
          {state.customerType === "commercial"
            ? "We found your business energy usage"
            : "We found your electricity usage"}
        </p>
      </div>

      <dl className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-[13px] text-gray-500">{row.label}</dt>
            <dd className="text-[15px] font-medium text-gray-900 text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3">
        <PrimaryAction onClick={onConfirm}>Looks right</PrimaryAction>
        <SecondaryAction onClick={onEdit}>Edit details</SecondaryAction>
      </div>
    </div>
  );
}
