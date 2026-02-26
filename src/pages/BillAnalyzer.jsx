import React, { useState, useRef, useEffect, useCallback } from "react";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
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
import { createPageUrl } from "@/utils";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import { getProvidersForZipCode, getStateFromZip } from "../components/compare/providerAvailability";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";

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
function SavingsScoreGauge({ score }) {
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
        <p className={`text-sm font-semibold ${colors.text}`}>{colors.label}</p>
        <p className="text-xs text-gray-500 mt-1 text-center">
          How competitive your current rate is compared to available plans
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
  const [isDragOver, setIsDragOver] = useState(false);
  const { getAffiliateUrl } = useAffiliateLinks();
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
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState(null);

  const handleLeadCapture = async (source) => {
    if (!leadEmail || leadSubmitting) return;
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const resp = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          zip: billData?.zip_code || manualForm.zip_code || null,
          source,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setLeadSubmitted(true);
      } else {
        setLeadError(data.error || 'Something went wrong');
      }
    } catch (e) {
      setLeadError('Network error. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    initialData: [],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    initialData: [],
  });

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

  // ─── Upload and analyze handler ────────────────────────────
  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const MAX_RETRIES = 2;

    try {
      // Step 1: Upload the file to Supabase storage
      let uploadResult;
      try {
        uploadResult = await UploadFile({ file });
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

      // Step 2: If PDF, convert to processable format
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        try {
          const convertResponse = await fetch('/api/convert-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_url: fileUrl }),
          });
          if (convertResponse.ok) {
            const convertResult = await convertResponse.json();
            if (convertResult.status === 'success' && convertResult.image_url) {
              fileUrl = convertResult.image_url;
            }
          }
        } catch (convertErr) {
          console.warn('PDF conversion failed, attempting direct extraction:', convertErr);
        }
      }

      // Step 3: Extract data with retry logic
      let extractResult = null;
      let lastError = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          extractResult = await ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: {
              type: "object",
              properties: {
                monthly_usage_kwh: { type: "number", description: "Monthly electricity usage in kWh" },
                monthly_cost: { type: "number", description: "Total monthly cost in dollars" },
                rate_per_kwh: { type: "number", description: "Rate per kWh in cents" },
                contract_term: { type: "number", description: "Contract term in months" },
                provider_name: { type: "string", description: "Current electricity provider name" },
                plan_name: { type: "string", description: "Current plan name" },
                zip_code: { type: "string", description: "Service ZIP code" }
              }
            }
          });

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

  // ─── Calculate savings score and overpayment ───────────────
  const calculateMetrics = useCallback((currentRate, allPlans) => {
    if (!currentRate || allPlans.length === 0) {
      return { savingsScore: 50, overpaymentPercent: 0 };
    }

    const rates = allPlans.map(p => {
      const pd = p.data || p;
      return pd.rate_per_kwh || p.rate_per_kwh || 0;
    }).filter(r => r > 0);

    if (rates.length === 0) {
      return { savingsScore: 50, overpaymentPercent: 0 };
    }

    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

    // Savings score: 100 = best rate, 0 = worst rate
    let savingsScore;
    if (maxRate === minRate) {
      savingsScore = currentRate <= minRate ? 100 : 0;
    } else {
      // Inverse: lower rate = higher score
      savingsScore = Math.round(Math.max(0, Math.min(100,
        ((maxRate - currentRate) / (maxRate - minRate)) * 100
      )));
    }

    // Overpayment: how much more you pay vs the best available rate
    const overpaymentPercent = minRate > 0
      ? Math.max(0, parseFloat((((currentRate - minRate) / minRate) * 100).toFixed(1)))
      : 0;

    return { savingsScore, overpaymentPercent };
  }, []);

  // ─── Calculate recommendations ─────────────────────────────
  const getRecommendations = useCallback(async () => {
    if (!billData || !billData.monthly_usage_kwh) return [];

    const currentMonthlyCost = billData.monthly_cost || 0;
    const zipCode = billData.zip_code;
    
    let availableProviders = [];
    if (zipCode && zipCode.length === 5) {
      availableProviders = await getProvidersForZipCode(zipCode);
    }
    
    const filteredPlans = plans.filter(plan => {
      const planData = plan.data || plan;
      const providerName = planData.provider_name || plan.provider_name;
      const planName = planData.plan_name || plan.plan_name;
      
      // Exclude business plans
      const customerType = (planData.customer_type || plan.customer_type || '').toLowerCase();
      if (customerType === 'business' || (planName && planName.toLowerCase().includes('business'))) {
        return false;
      }
      
      // If we have ZIP-based availability, filter by it
      if (zipCode && availableProviders.length > 0) {
        const provider = availableProviders.find(p => p.name === providerName);
        if (!provider) return false;
      }
      
      return true;
    });
    
    return filteredPlans
      .map(plan => {
        const planData = plan.data || plan;
        const ratePerKwh = planData.rate_per_kwh || plan.rate_per_kwh;
        const baseCharge = planData.monthly_base_charge || plan.monthly_base_charge || planData.base_charge || plan.base_charge || 0;
        
        const estimatedCost = (ratePerKwh / 100) * billData.monthly_usage_kwh + parseFloat(baseCharge || 0);
        const monthlySavings = currentMonthlyCost - estimatedCost;
        const annualSavings = monthlySavings * 12;
        
        return {
          ...plan,
          estimatedCost,
          monthlySavings,
          annualSavings
        };
      })
      .filter(plan => plan.monthlySavings > 0)
      .sort((a, b) => b.annualSavings - a.annualSavings)
      .slice(0, 6);
  }, [billData, plans]);

  const [recommendations, setRecommendations] = useState(sessionData?.recommendations || []);
  const [savingsScore, setSavingsScore] = useState(sessionData?.savingsScore ?? null);
  const [overpaymentPercent, setOverpaymentPercent] = useState(sessionData?.overpaymentPercent ?? null);
  
  useEffect(() => {
    if (showResults && billData && plans.length > 0) {
      getRecommendations().then(recs => {
        setRecommendations(recs);

        // Calculate metrics
        const currentRate = billData.rate_per_kwh || 
          (billData.monthly_cost && billData.monthly_usage_kwh 
            ? parseFloat(((billData.monthly_cost / billData.monthly_usage_kwh) * 100).toFixed(2))
            : 0);
        const metrics = calculateMetrics(currentRate, plans);
        setSavingsScore(metrics.savingsScore);
        setOverpaymentPercent(metrics.overpaymentPercent);

        // Persist to session
        saveToSession({
          billData,
          showResults: true,
          recommendations: recs,
          savingsScore: metrics.savingsScore,
          overpaymentPercent: metrics.overpaymentPercent,
        });
      });
    }
  }, [showResults, billData, plans, getRecommendations, calculateMetrics]);

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
    setRecommendations([]);
    setSavingsScore(null);
    setOverpaymentPercent(null);
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
    const totalPotentialSavings = recommendations.length > 0 ? recommendations[0].annualSavings : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-2">Your Bill Analysis Results</h1>
            <p className="text-sm text-blue-100">
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
            {savingsScore !== null && (
              <SavingsScoreGauge score={savingsScore} />
            )}

            {/* Overpayment Card */}
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="w-5 h-5 text-[#FF6B35]" />
                  <h2 className="text-lg font-bold text-gray-900">Overpayment</h2>
                </div>
                <div className={`text-4xl font-bold mb-2 ${
                  overpaymentPercent > 20 ? "text-red-600" : 
                  overpaymentPercent > 10 ? "text-amber-600" : 
                  overpaymentPercent > 0 ? "text-blue-600" : "text-green-600"
                }`}>
                  {overpaymentPercent !== null ? `${overpaymentPercent}%` : "—"}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {overpaymentPercent > 0
                    ? "Above the best available rate in your area"
                    : "You have a competitive rate"}
                </p>
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
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Provider</p>
                    <p className="text-sm font-bold text-gray-900">{billData.provider_name || 'N/A'}</p>
                  </div>
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
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Monthly Cost</p>
                    <p className="text-sm font-bold text-gray-900">${billData.monthly_cost?.toFixed(2) || '0.00'}</p>
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
                {recommendations.map((plan, index) => (
                  <Card 
                    key={plan.id} 
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
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#0A5C8C]">
                            {(plan.provider_name || "").substring(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{plan.provider_name}</h3>
                          <p className="text-xs text-gray-600 truncate">{plan.plan_name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Rate</p>
                          <p className="text-base font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢/kWh</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Est. Monthly</p>
                          <p className="text-base font-bold text-gray-900">${plan.estimatedCost.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Term</p>
                          <p className="text-sm font-semibold text-gray-700">{plan.contract_length || 'Variable'} mo</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Annual Savings</p>
                          <p className="text-base font-bold text-green-600">${plan.annualSavings.toFixed(0)}</p>
                        </div>
                      </div>

                      {plan.renewable_percentage >= 50 && (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
                          <Leaf className="w-3 h-3" />
                          {plan.renewable_percentage}% Renewable
                        </div>
                      )}

                      <a 
                        href={(() => {
                          const planData = plan.data || plan;
                          const providerName = planData.provider_name || plan.provider_name;
                          const provider = providers.find(p => {
                            const pName = p.name || p.data?.name;
                            return pName === providerName;
                          });
                          if (!provider) {
                            // Fallback: use plan_details_url or "#"
                            return planData.plan_details_url || plan.plan_details_url || "#";
                          }
                          const pData = provider.data || provider;
                          const fallback = pData.affiliate_url || provider.affiliate_url || pData.website_url || provider.website_url || "#";
                          return getAffiliateUrl({ providerId: provider.id, offerId: plan.id, fallbackUrl: fallback });
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                          Switch to This Plan
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
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
                <Link to={createPageUrl("CompareRates")}>
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
                  <p className="font-medium">Check your inbox! We've sent your savings report.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">Get a copy of your analysis results and personalized rate alerts delivered to your inbox.</p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent"
                    />
                    <Button
                      onClick={() => handleLeadCapture('analyzer_results')}
                      disabled={leadSubmitting || !leadEmail}
                      className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-6"
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
            <Link to={createPageUrl("CompareRates")} className="flex-1">
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
        title="Free Electricity Bill Analyzer - Find Instant Savings | ElectricScouts"
        description="Upload your electricity bill and get instant AI-powered analysis. Discover better rates, calculate exact savings, find personalized plan recommendations. Free bill analysis for TX, PA, NY, OH, IL & more. Compare your current rate with 40+ providers. See how much you can save."
        keywords="electricity bill analyzer, analyze electricity bill, electricity savings calculator, bill comparison tool, find cheaper electricity, electricity rate analyzer, power bill analysis, energy bill savings"
        canonical="/bill-analyzer"
        structuredData={breadcrumbData}
      />
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Electricity Bill Analyzer</h1>
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
