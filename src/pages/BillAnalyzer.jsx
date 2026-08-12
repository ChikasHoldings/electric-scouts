import { useState, useRef, useEffect, useMemo } from "react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/supabaseIntegrations";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, FileText, Zap, TrendingDown, Clock, Leaf, 
  CheckCircle, AlertCircle, DollarSign, ArrowRight, Edit3,
  BarChart3, Percent, Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead, { getBreadcrumbSchema, getFAQSchema } from "../components/SEOHead";
import { COMPARE_PATH, ENTRY_CONTEXTS } from "../components/compare/engine/entryContext";
import { benchmarkBill, readBillRate } from "../components/compare/engine/billBenchmark";
import { describeResultPrice, pricingCaveatText } from "../components/compare/engine/resultsContract";
import { validateServiceAddress, ADDRESS_SOURCE } from "@/lib/serviceAddress";
import ProviderLogo from "../components/compare/ui/ProviderLogo";

/**
 * Carry the analysis into the comparison engine.
 *
 * The usage and provider read off the bill are exactly what /compare-rates
 * would otherwise ask for, so they travel with the visitor and those questions
 * disappear. `entry` records where the session came from, which is what lets the
 * funnel separate analyzer traffic from the landing pages.
 */
function compareUrlFromBill(billData) {
  const params = new URLSearchParams();

  const zip = String(billData?.zip_code || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length === 5) params.set("zip", zip);

  const usage = Number(billData?.monthly_usage_kwh);
  if (Number.isFinite(usage) && usage > 0) params.set("usage", String(Math.round(usage)));

  const provider = String(billData?.provider_name || "").trim();
  if (provider) params.set("provider", provider.slice(0, 120));

  params.set("entry", ENTRY_CONTEXTS.BILL_ANALYZER);
  return `${COMPARE_PATH}?${params.toString()}`;
}

// ─── Session Storage Helpers ──────────────────────────────────
const SESSION_KEY = "electricscouts_bill_analyzer";

function saveToSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save to sessionStorage:", e);
  }
}

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignore
  }
}

// ─── Savings Score Gauge Component ────────────────────────────
function SavingsScoreGauge({ score, label }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 75) return { stroke: "#16a34a", bg: "from-green-50 to-white", text: "text-green-600", label: "Great Rate" };
    if (s >= 50) return { stroke: "#2563eb", bg: "from-blue-50 to-white", text: "text-blue-600", label: "Good Rate" };
    if (s >= 25) return { stroke: "#f59e0b", bg: "from-amber-50 to-white", text: "text-amber-600", label: "Fair Rate" };
    return { stroke: "#ef4444", bg: "from-red-50 to-white", text: "text-red-600", label: "Overpaying" };
  };

  const colors = getColor(score);

  return (
    <Card className={`border-2 border-gray-200 bg-gradient-to-br ${colors.bg}`}>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#0A5C8C]" />
          <h2 className="text-lg font-bold text-gray-900">Savings Score</h2>
        </div>
        <div className="relative w-36 h-36 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke="#e5e7eb" strokeWidth="10"
            />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>
        {/* The band comes from the benchmark, which knows the sample it was
            measured against; the colour thresholds here are presentation. */}
        <p className={`text-sm font-semibold ${colors.text}`}>{label || colors.label}</p>
        <p className="text-xs text-gray-500 mt-1 text-center">
          How your rate compares against the plans available where you live
        </p>
      </CardContent>
    </Card>
  );
}

export default function BillAnalyzer() {
  // Restore from session on mount
  const sessionData = loadFromSession();

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billData, setBillData] = useState(sessionData?.billData || null);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(sessionData?.showResults || false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Scroll to top when results are shown
  useEffect(() => {
    if (showResults) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [showResults]);
  const [isDragOver, setIsDragOver] = useState(false);

  // One id for the whole visit, so the analysis, the lead it produces and any
  // outbound click are the same session in the funnel rather than three
  // unconnected events.
  const [sessionId] = useState(
    () => sessionData?.sessionId || `ba_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  );
  const [manualForm, setManualForm] = useState({
    provider_name: '',
    monthly_usage_kwh: '',
    monthly_cost: '',
    rate_per_kwh: '',
    zip_code: '',
    plan_name: '',
    contract_term: '',
  });

  const fileInputRef = useRef(null);

  // Lead capture state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState(null);

  // Service address: read off the bill, confirmed by the customer.
  //
  // The extraction has always found this and the page has always printed it;
  // it just never went anywhere. It is the field a retailer needs before they
  // can price or enrol anyone, so a lead without one is worth materially less.
  // It is shown for confirmation rather than submitted silently, because an
  // OCR read of a scanned bill is a guess until a person says otherwise.
  const [serviceAddress, setServiceAddress] = useState('');
  const [addressTouched, setAddressTouched] = useState(false);

  useEffect(() => {
    if (billData?.service_address && !addressTouched) {
      setServiceAddress(String(billData.service_address));
    }
  }, [billData?.service_address, addressTouched]);

  const addressCheck = useMemo(
    () => (serviceAddress.trim() ? validateServiceAddress(serviceAddress) : null),
    [serviceAddress]
  );

  const handleLeadCapture = async () => {
    if (!leadName.trim()) {
      setLeadError('Please enter your first name');
      return;
    }
    if (!leadEmail || leadSubmitting) return;

    if (addressCheck && !addressCheck.valid) {
      setLeadError(addressCheck.error);
      return;
    }

    setLeadSubmitting(true);
    setLeadError(null);

    try {
      // ── The lead ──
      //
      // This page used to email a report and create no lead at all, so every
      // analyzer visitor was invisible to the pipeline that routes and sells
      // leads. The same endpoint the comparison engine uses, so an analyzer
      // visitor who later finishes a comparison enriches one row rather than
      // producing a second.
      await fetch('/api/leads?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          first_name: leadName.trim(),
          zip: billData?.zip_code || null,
          source: 'bill_analyzer',
          source_page: 'bill_analyzer',
          comparison: {
            session_id: sessionId,
            entry_context: ENTRY_CONTEXTS.BILL_ANALYZER,
            customer_type: 'residential',
            monthly_usage_kwh: Number(billData?.monthly_usage_kwh) || null,
            monthly_cost: Number(billData?.monthly_cost) || null,
            current_provider: billData?.provider_name || null,
            current_plan: billData?.plan_name || null,
            bill_uploaded: billData?.entry_source !== 'manual',
            bill_analysis_status: 'complete',
            bill_analyzed_at: new Date().toISOString(),
            service_address: addressCheck?.valid ? serviceAddress.trim() : null,
            // Confirmed only when the customer actually edited or accepted it
            // in the form; otherwise it stays a machine reading.
            service_address_source: addressTouched
              ? ADDRESS_SOURCE.CUSTOMER_CONFIRMED
              : ADDRESS_SOURCE.BILL_ANALYZER,
          },
        }),
      }).catch(() => {
        // A lead-write failure must not cost the customer their report.
      });

      // ── The report ──
      //
      // Carries a reference to the comparison, never its numbers. The endpoint
      // recomputes prices, savings and outbound links server-side, so what
      // lands in the inbox is what the page showed — and a crafted request
      // can no longer put its own URL behind a "Switch to this plan" button in
      // an email we sign.
      const resp = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          name: leadName.trim(),
          zip: billData?.zip_code,
          monthlyUsageKwh: Number(billData?.monthly_usage_kwh) || null,
          monthlyCost: Number(billData?.monthly_cost) || null,
          currentProvider: billData?.provider_name || null,
          billAnalysisStatus: 'complete',
          billConfidence: comparisonInput?.billConfidence,
          sessionId,
          entryContext: ENTRY_CONTEXTS.BILL_ANALYZER,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.success) {
        setLeadSubmitted(true);
      } else {
        setLeadError(data.error || 'Something went wrong sending the report');
      }
    } catch (e) {
      setLeadError('Network error. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  // ── The comparison, from the service that owns it ──
  //
  // This page used to fetch every plan row and price them in the browser:
  // rate x usage + base charge, which is the calculation the pricing engine
  // was built to replace. It ignored utility delivery charges, bill credits
  // and their thresholds entirely, so the analyzer quoted a monthly figure
  // that /compare-rates would not have quoted for the same plan on the same
  // day. It also had no way to produce a tracked outbound link, so every
  // "Switch to This Plan" click on this page earned nothing.
  //
  // Same endpoint the results board calls. The economics arrive decided.
  const comparisonInput = useMemo(() => {
    if (!billData) return null;
    const zip = String(billData.zip_code || '').replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) return null;

    return {
      zip,
      customerType: 'residential',
      monthlyUsageKwh: Number(billData.monthly_usage_kwh) || null,
      monthlyCost: Number(billData.monthly_cost) || null,
      shoppingIntent: 'better_rate',
      // The bill is the evidence, and how much of it we trust decides whether
      // the server is willing to publish a savings figure at all.
      billAnalysisStatus: 'complete',
      billConfidence: billData.entry_source === 'manual' ? 'high' : 'low',
      entryContext: ENTRY_CONTEXTS.BILL_ANALYZER,
      sessionId,
    };
  }, [billData, sessionId]);

  const { data: comparison, isLoading: comparisonLoading, isError: comparisonError } = useQuery({
    queryKey: ['bill-analyzer-comparison', comparisonInput],
    enabled: Boolean(comparisonInput),
    queryFn: async () => {
      const response = await fetch('/api/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comparisonInput),
      });
      if (!response.ok) throw new Error('catalog_unavailable');
      return response.json();
    },
  });

  const results = useMemo(() => comparison?.results || [], [comparison]);

  // The plans worth showing someone who already has service: the ones that
  // beat what they pay now. `potentialSavings` is populated by the server only
  // when the difference is genuinely in the customer's favour and both sides
  // of the comparison are complete, so this cannot print an invented saving.
  const recommendations = useMemo(
    () => results.filter((r) => r.potentialSavings > 0).slice(0, 6),
    [results]
  );

  // Where their current rate sits in the market they can actually buy in.
  const benchmark = useMemo(() => {
    const current = readBillRate(billData || {});
    if (!current) return { comparable: false, reason: 'no_current_rate' };
    return benchmarkBill({ rate: current.rate, basis: current.basis, results });
  }, [billData, results]);

  // ─── File validation helper ────────────────────────────────
  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const fileType = selectedFile.type;
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    
    if (!validTypes.includes(fileType)) {
      setError('Please upload a PDF or image file (PNG, JPG, JPEG)');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setShowManualInput(false);
  };

  // ─── File select handler ───────────────────────────────────
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  // ─── Drag and drop handlers ────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  // ─── Client-side PDF to Image conversion ──────────────────
  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) return resolve(window.pdfjsLib);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
      script.type = 'module';
      // Use a classic script approach instead for broader compatibility
      const classicScript = document.createElement('script');
      classicScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      classicScript.onload = () => {
        const lib = window.pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(lib);
        } else {
          reject(new Error('pdf.js failed to load'));
        }
      };
      classicScript.onerror = () => reject(new Error('Failed to load pdf.js from CDN'));
      document.head.appendChild(classicScript);
    });
  };

  const convertPdfToImage = async (pdfFile) => {
    const pdfjsLib = await loadPdfJs();

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Render first page (and optionally second page for multi-page bills)
    const pagesToRender = Math.min(pdf.numPages, 2);
    const images = [];
    
    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const scale = 2.0; // High resolution for OCR accuracy
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL('image/png', 0.95));
    }
    
    // If multiple pages, stitch them vertically into one image
    if (images.length > 1) {
      const stitchCanvas = document.createElement('canvas');
      const tempImages = await Promise.all(images.map(src => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });
      }));
      
      stitchCanvas.width = Math.max(...tempImages.map(img => img.width));
      stitchCanvas.height = tempImages.reduce((sum, img) => sum + img.height, 0);
      const stitchCtx = stitchCanvas.getContext('2d');
      
      let yOffset = 0;
      for (const img of tempImages) {
        stitchCtx.drawImage(img, 0, yOffset);
        yOffset += img.height;
      }
      
      return stitchCanvas.toDataURL('image/png', 0.92);
    }
    
    return images[0];
  };

  // ─── Upload and analyze handler ────────────────────────────
  // Helper: wrap a promise with a timeout
  const withTimeout = (promise, ms, label = 'Operation') => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s. Please try again or enter details manually.`)), ms))
    ]);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const MAX_RETRIES = 2;

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      let fileToUpload = file;

      // Step 1: If PDF, convert to PNG image on client side first
      if (isPdf) {
        try {
          const imageDataUrl = await convertPdfToImage(file);
          // Convert data URL to File object
          const response = await fetch(imageDataUrl);
          const blob = await response.blob();
          fileToUpload = new File([blob], file.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' });
        } catch (convertErr) {
          console.warn('Client-side PDF conversion failed:', convertErr);
          // Fall through - will try to upload the original PDF
        }
      }

      // Step 2: Upload the file to Supabase storage
      let uploadResult;
      try {
        uploadResult = await withTimeout(UploadFile({ file: fileToUpload }), 30000, 'File upload');
      } catch (uploadErr) {
        console.error('File upload failed:', uploadErr);
        setIsUploading(false);
        setShowManualInput(true);
        setError('File upload failed. This may be a storage configuration issue. Please enter your bill details manually below.');
        return;
      }

      let fileUrl = uploadResult.file_url;
      if (!fileUrl) {
        setIsUploading(false);
        setShowManualInput(true);
        setError('File upload succeeded but no URL was returned. Please enter your bill details manually.');
        return;
      }

      setIsUploading(false);
      setIsProcessing(true);

      // Step 3: Extract data with retry logic
      let extractResult = null;
      let lastError = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          extractResult = await withTimeout(ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer/account holder name on the bill" },
                service_address: { type: "string", description: "Full service address where electricity is delivered" },
                monthly_usage_kwh: { type: "number", description: "Monthly electricity usage in kWh" },
                monthly_cost: { type: "number", description: "Total monthly cost in dollars" },
                rate_per_kwh: { type: "number", description: "Rate per kWh in cents" },
                contract_term: { type: "number", description: "Contract term in months" },
                provider_name: { type: "string", description: "Current electricity provider/company name" },
                plan_name: { type: "string", description: "Current plan/product name" },
                zip_code: { type: "string", description: "Service address ZIP code" },
                account_number: { type: "string", description: "Account or customer number" },
                billing_period: { type: "string", description: "Billing period dates" }
              }
            }
          }), 45000, 'Bill analysis');

          // Validate the extracted data has meaningful values
          if (extractResult?.status === 'success' && extractResult?.output) {
            const output = extractResult.output;
            const hasUsage = output.monthly_usage_kwh && output.monthly_usage_kwh > 0;
            const hasCost = output.monthly_cost && output.monthly_cost > 0;
            if (hasUsage || hasCost) {
              break; // Valid result, exit retry loop
            } else {
              lastError = 'Extraction returned empty values';
              extractResult = null; // Reset to trigger retry
            }
          } else {
            lastError = 'Extraction returned unsuccessful status';
            extractResult = null;
          }
        } catch (err) {
          lastError = err.message;
          extractResult = null;
          console.warn(`Extraction attempt ${attempt + 1} failed:`, err.message);
        }

        // Wait before retry
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      setIsProcessing(false);

      if (extractResult?.status === 'success' && extractResult?.output) {
        const output = extractResult.output;
        // Auto-calculate rate if missing but we have cost and usage
        if ((!output.rate_per_kwh || output.rate_per_kwh === 0) && output.monthly_cost > 0 && output.monthly_usage_kwh > 0) {
          output.rate_per_kwh = parseFloat(((output.monthly_cost / output.monthly_usage_kwh) * 100).toFixed(2));
        }
        setBillData(output);
        setShowResults(true);
      } else {
        setShowManualInput(true);
        setError(`We couldn't automatically extract your bill data${lastError ? ` (${lastError})` : ''}. Please enter the details manually below.`);
      }
    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      setShowManualInput(true);
      setError(`Automatic extraction failed: ${err.message || 'Unknown error'}. Please enter your bill details manually below.`);
      console.error('BillAnalyzer error:', err);
    }
  };

  // ─── Manual form handler ───────────────────────────────────
  const handleManualFormChange = (field, value) => {
    setManualForm(prev => ({ ...prev, [field]: value }));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();

    const usage = parseFloat(manualForm.monthly_usage_kwh);
    const cost = parseFloat(manualForm.monthly_cost);
    const zip = manualForm.zip_code?.trim();

    if (!usage || usage <= 0) {
      setError('Please enter a valid monthly usage in kWh.');
      return;
    }
    if (!cost || cost <= 0) {
      setError('Please enter a valid monthly cost.');
      return;
    }
    if (!zip || zip.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    const data = {
      provider_name: manualForm.provider_name || null,
      monthly_usage_kwh: usage,
      monthly_cost: cost,
      rate_per_kwh: manualForm.rate_per_kwh ? parseFloat(manualForm.rate_per_kwh) : parseFloat(((cost / usage) * 100).toFixed(2)),
      zip_code: zip,
      plan_name: manualForm.plan_name || null,
      contract_term: manualForm.contract_term ? parseInt(manualForm.contract_term) : null,
    };

    setError(null);
    setBillData(data);
    setShowResults(true);
    setShowManualInput(false);
  };

  // Persist so a refresh, or a return trip from a provider site, lands back on
  // the finished analysis rather than an empty upload box. Only the bill and
  // the session id are stored: the results are re-fetched from the service, so
  // a cached copy can never outlive the catalog it was priced against.
  useEffect(() => {
    if (showResults && billData) {
      saveToSession({ billData, showResults: true, sessionId });
    }
  }, [showResults, billData, sessionId]);

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Bill Analyzer", url: "/bill-analyzer" }
  ]);

  // ─── Reset handler ─────────────────────────────────────────
  const handleReset = () => {
    setShowResults(false);
    setBillData(null);
    setFile(null);
    setShowManualInput(false);
    setServiceAddress('');
    setAddressTouched(false);
    clearSession();
  };

  // ─── Loading States ────────────────────────────────────────
  if (isUploading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Uploading Your Bill</h2>
          <p className="text-sm text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#FF6B35] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Bill</h2>
          <p className="text-sm text-gray-600">Extracting usage data and finding savings...</p>
        </div>
      </div>
    );
  }

  // ─── Results Page ──────────────────────────────────────────
  if (showResults && billData) {
    // The best annual saving the server is willing to stand behind. Nothing
    // here derives it — `annualDifference` is signed and already decided, and
    // is only populated when both sides of the comparison are complete.
    const totalPotentialSavings = recommendations.length > 0
      ? Math.abs(recommendations[0].annualDifference || 0)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-2">
              {billData.customer_name ? `${billData.customer_name}'s Bill Analysis` : 'Your Bill Analysis Results'}
            </h1>
            <p className="text-sm text-blue-100">
              {billData.service_address && <span className="block mb-1">{billData.service_address}</span>}
              {recommendations.length > 0
                ? `We found ${recommendations.length} better plan${recommendations.length !== 1 ? 's' : ''} for you`
                : "Your rate analysis is ready"}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Score + Overpayment + Bill Summary Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Savings Score Gauge */}
            {benchmark.comparable ? (
              <SavingsScoreGauge score={benchmark.score} label={benchmark.band?.label} />
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                  <BarChart3 className="w-8 h-8 text-gray-300 mb-3" />
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Rate Score</h2>
                  {/* Saying why beats printing a placeholder score. A score
                      computed from two plans is a number with nothing behind
                      it, and this page is read as advice. */}
                  <p className="text-xs text-gray-500">
                    {benchmark.reason === 'insufficient_complete_pricing'
                      ? "Not enough plans in your area publish full delivery pricing to score your rate fairly."
                      : benchmark.reason === 'no_current_rate'
                        ? "We could not read a rate off this bill."
                        : "Not enough plans available in your area to score your rate yet."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Overpayment Card */}
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="w-5 h-5 text-[#FF6B35]" />
                  <h2 className="text-lg font-bold text-gray-900">Overpayment</h2>
                </div>
                <div className={`text-4xl font-bold mb-2 ${
                  !benchmark.comparable ? "text-gray-400" :
                  benchmark.overpaymentPercent > 20 ? "text-red-600" :
                  benchmark.overpaymentPercent > 10 ? "text-amber-600" :
                  benchmark.overpaymentPercent > 0 ? "text-blue-600" : "text-green-600"
                }`}>
                  {benchmark.comparable ? `${benchmark.overpaymentPercent}%` : "—"}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {!benchmark.comparable
                    ? "Not enough comparable plans to measure this"
                    : benchmark.overpaymentPercent > 0
                      ? `Above the cheapest of ${benchmark.sampleSize} plans available to you`
                      : `You are at or below the cheapest of ${benchmark.sampleSize} plans available to you`}
                </p>
                {/* What the score was measured against. A rate derived from the
                    bill total includes delivery and taxes, so it is compared
                    against full modelled costs, not advertised supply rates —
                    and the customer is told which. */}
                {benchmark.comparable && (
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    {benchmark.basis === 'effective'
                      ? "Measured on your all-in cost per kWh"
                      : "Measured on your energy charge per kWh"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Current Bill Summary */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#0A5C8C]" />
                  <h2 className="text-lg font-bold text-gray-900">Your Current Plan</h2>
                </div>
                <div className="space-y-3">
                  {billData.customer_name && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Account Holder</p>
                      <p className="text-sm font-bold text-gray-900">{billData.customer_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Provider</p>
                    <p className="text-sm font-bold text-gray-900">{billData.provider_name || 'N/A'}</p>
                  </div>
                  {billData.plan_name && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Plan</p>
                      <p className="text-sm font-bold text-gray-900">{billData.plan_name}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Monthly Usage</p>
                      <p className="text-sm font-bold text-gray-900">{billData.monthly_usage_kwh || 0} kWh</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Current Rate</p>
                      <p className="text-sm font-bold text-gray-900">{billData.rate_per_kwh || 0}¢/kWh</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Monthly Cost</p>
                      <p className="text-sm font-bold text-gray-900">${billData.monthly_cost?.toFixed(2) || '0.00'}</p>
                    </div>
                    {billData.billing_period && (
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">Billing Period</p>
                        <p className="text-sm font-bold text-gray-900">{billData.billing_period}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Potential */}
          {totalPotentialSavings > 0 && (
            <Card className="mb-8 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                      <h2 className="text-lg font-bold text-gray-900">Potential Annual Savings</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      By switching to the best available plan
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      ${totalPotentialSavings.toFixed(0)}
                    </div>
                    <p className="text-xs text-gray-600">per year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Plans */}
          {recommendations.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#FF6B35]" />
                <h2 className="text-lg font-bold text-gray-900">Recommended Plans</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {recommendations.map((result, index) => {
                  // Which figure to show and what to call it is the shared
                  // contract's decision, so a plan cannot read "$105/mo" here
                  // and "$105/mo supply" on the results board.
                  const price = describeResultPrice(result);
                  const caveat = pricingCaveatText(result);

                  return (
                    <Card
                      key={result.planId}
                      className={`border-2 hover:shadow-lg transition-all ${
                        index === 0 ? 'border-[#FF6B35] bg-gradient-to-br from-orange-50 to-white' : 'border-gray-200'
                      }`}
                    >
                      <CardContent className="p-4">
                        {index === 0 && (
                          <div className="mb-3">
                            <span className="bg-[#FF6B35] text-white text-xs font-bold px-2 py-1 rounded">
                              BEST SAVINGS
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-3 mb-4">
                          <ProviderLogo
                            provider={{ name: result.providerName, logo_url: result.providerLogoUrl }}
                            className="w-12 h-12 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm mb-1">{result.providerName}</h3>
                            <p className="text-xs text-gray-600 truncate">{result.planName}</p>
                          </div>
                          {result.matchScore !== null && (
                            <span className="text-xs font-semibold text-[#0A5C8C] whitespace-nowrap">
                              {result.matchScore}% match
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Rate</p>
                            <p className="text-base font-bold text-[#0A5C8C]">{result.ratePerKwh}¢/kWh</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">{price ? price.label : 'Est. Monthly'}</p>
                            <p className="text-base font-bold text-gray-900">
                              {price ? `$${Math.round(price.amount)}` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Term</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {result.termMonths ? `${result.termMonths} mo` : 'Month to month'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Annual Savings</p>
                            <p className="text-base font-bold text-green-600">
                              ${Math.round(Math.abs(result.annualDifference || 0))}
                            </p>
                          </div>
                        </div>

                        {caveat && <p className="text-[11.5px] text-amber-700 mb-3">{caveat}</p>}

                        {result.isRenewable && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
                            <Leaf className="w-3 h-3" />
                            {result.renewablePercentage ? `${result.renewablePercentage}% Renewable` : 'Renewable'}
                          </div>
                        )}

                        {/* The route is built server-side and points at /api/go,
                            which resolves the destination at click time. The
                            browser never receives a provider URL, so nothing
                            here can redirect the revenue — and a plan with no
                            configured destination gets the concierge rather
                            than a button that goes nowhere. */}
                        {result.trackedOutboundRoute ? (
                          <a href={result.trackedOutboundRoute} target="_blank" rel="noopener noreferrer" className="block">
                            <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                              Switch to This Plan
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </a>
                        ) : (
                          <Link
                            to={`/home-concierge?plan=${encodeURIComponent(result.planName || '')}&provider=${encodeURIComponent(result.providerName || '')}${billData.zip_code ? `&zip=${billData.zip_code}` : ''}`}
                            className="block"
                          >
                            <Button variant="outline" className="w-full text-sm">
                              Request This Plan
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Better Plans Found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You already have a competitive rate! We'll keep monitoring for better options.
                </p>
                <Link to={compareUrlFromBill(billData)}>
                  <Button variant="outline">
                    Browse All Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Email My Savings Report CTA */}
          <Card className="mt-8 border-2 border-[#0A5C8C] bg-gradient-to-r from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-[#0A5C8C]" />
                <h3 className="text-lg font-bold text-gray-900">Email Me My Savings Report</h3>
              </div>
              {leadSubmitted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-medium">Check your inbox! We've sent your full savings report with personalized plan recommendations and direct sign-up links.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">Get a copy of your analysis results and personalized rate alerts delivered to your inbox.</p>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={leadName}
                        onChange={(e) => { setLeadName(e.target.value); setLeadError(null); }}
                        placeholder="Your first name"
                        className="sm:w-2/5 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent"
                      />
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => { setLeadEmail(e.target.value); setLeadError(null); }}
                        placeholder="Enter your email address"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent"
                      />
                    </div>
                    <Button
                      onClick={() => handleLeadCapture('analyzer_results')}
                      disabled={leadSubmitting || !leadEmail || !leadName.trim()}
                      className="w-full sm:w-auto bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-6"
                    >
                      {leadSubmitting ? 'Sending...' : 'Send Report'}
                    </Button>
                  </div>
                  {leadError && <p className="text-sm text-red-500 mt-2">{leadError}</p>}
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <Button 
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              Analyze Another Bill
            </Button>
            <Link to={compareUrlFromBill(billData)} className="flex-1">
              <Button className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
                Compare All Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Upload Page ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Electricity Bill Analyzer | Electric Scouts"
        description="Upload an electricity bill and see the rate you are actually paying once base charges and usage credits are counted, then compare it against current plans."
        keywords="electricity bill analyzer, analyze electricity bill, electricity savings calculator, bill comparison tool, find cheaper electricity, electricity rate analyzer, power bill analysis, energy bill savings"
        canonical="/bill-analyzer"
        structuredData={[
          breadcrumbData,
          getFAQSchema([
            { question: "How does the electricity bill analyzer work?", answer: "Upload a photo or PDF of your electricity bill, and our AI-powered analyzer extracts your current rate, usage, and charges. We then compare your rate against the plans available in your area." },
            { question: "Is the bill analyzer free to use?", answer: "Yes, the Electric Scouts bill analyzer is completely free. Upload your bill, get instant analysis, and see personalized savings recommendations with no cost or obligation." },
            { question: "What information does the bill analyzer need?", answer: "The analyzer works best with a recent electricity bill showing your monthly kWh usage, current rate per kWh, and total charges. You can also enter your details manually if you prefer not to upload a bill." },
            { question: "How accurate are the savings estimates?", answer: "Our savings estimates are based on your actual usage data and current market rates from providers in your area. Estimates are typically within 5-10% of actual savings, though your final rate may vary based on the specific plan terms." }
          ])
        ]}
      />
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Analyze Your Electricity Bill</h1>
          <p className="text-base text-blue-100 max-w-2xl mx-auto">
            Upload your current electricity bill and we'll analyze your usage, rate, and cost to find you better plans with guaranteed savings.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-6">
                <input
                  type="file"
                  id="bill-upload"
                  ref={fileInputRef}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-12 transition-all ${
                    isDragOver
                      ? 'border-[#FF6B35] bg-orange-50 scale-[1.02]'
                      : file
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-[#0A5C8C] hover:bg-blue-50'
                  }`}
                >
                  {file ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{file.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        Click or drop another file to replace
                      </p>
                    </>
                  ) : isDragOver ? (
                    <>
                      <Upload className="w-12 h-12 text-[#FF6B35] mx-auto mb-4 animate-bounce" />
                      <h3 className="text-lg font-bold text-[#FF6B35] mb-2">
                        Drop Your Bill Here
                      </h3>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Upload Your Electricity Bill
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Drag and drop or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports PDF, PNG, JPG &bull; Max 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {file && !showManualInput && (
                <Button
                  onClick={handleUploadAndAnalyze}
                  className="w-full md:w-auto bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-base font-semibold"
                >
                  Analyze Bill & Find Savings
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Input Fallback */}
        {showManualInput && (
          <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Enter Your Bill Details Manually</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Don't worry — you can still get personalized savings recommendations by entering a few details from your bill.
              </p>

              <form onSubmit={handleManualSubmit}>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Provider <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={manualForm.provider_name}
                      onChange={(e) => handleManualFormChange('provider_name', e.target.value)}
                      placeholder="e.g., TXU Energy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Plan Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={manualForm.plan_name}
                      onChange={(e) => handleManualFormChange('plan_name', e.target.value)}
                      placeholder="e.g., Fixed Rate 12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Usage (kWh) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={manualForm.monthly_usage_kwh}
                      onChange={(e) => handleManualFormChange('monthly_usage_kwh', e.target.value)}
                      placeholder="e.g., 1200"
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Cost ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualForm.monthly_cost}
                      onChange={(e) => handleManualFormChange('monthly_cost', e.target.value)}
                      placeholder="e.g., 150.00"
                      required
                      min="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate per kWh (cents) <span className="text-gray-400">(auto-calculated if blank)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualForm.rate_per_kwh}
                      onChange={(e) => handleManualFormChange('rate_per_kwh', e.target.value)}
                      placeholder="e.g., 12.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualForm.zip_code}
                      onChange={(e) => handleManualFormChange('zip_code', e.target.value)}
                      placeholder="e.g., 75001"
                      required
                      maxLength={5}
                      pattern="[0-9]{5}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-3 text-sm font-semibold"
                  >
                    Find Savings
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowManualInput(false);
                      setError(null);
                    }}
                    className="px-6 py-3 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Skip to Manual Entry link (always visible) */}
        {!showManualInput && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowManualInput(true)}
              className="text-sm text-[#0A5C8C] hover:text-[#084a6f] underline font-medium"
            >
              Don't have a bill? Enter details manually instead
            </button>
          </div>
        )}

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">1. Upload Bill</h3>
                <p className="text-sm text-gray-600">
                  Upload a PDF or photo of your current electricity bill
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">2. AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Our AI extracts your usage, rate, and cost automatically
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">3. Get Savings</h3>
                <p className="text-sm text-gray-600">
                  See personalized recommendations and potential savings
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-0">
          <CardContent className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              Why Analyze Your Bill?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: CheckCircle, text: 'Instant personalized recommendations' },
                { icon: DollarSign, text: 'Calculate exact savings potential' },
                { icon: Clock, text: 'Save time comparing plans manually' },
                { icon: Zap, text: 'Find plans matching your usage patterns' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 text-[#0A5C8C]" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
