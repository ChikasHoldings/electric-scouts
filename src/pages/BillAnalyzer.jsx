import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, FileText, Zap, TrendingDown, Clock, Leaf, 
  CheckCircle, AlertCircle, DollarSign, ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BillAnalyzer() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billData, setBillData] = useState(null);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
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
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Upload the file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      setIsUploading(false);
      setIsProcessing(true);

      // Extract data from the uploaded bill
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
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

      setIsProcessing(false);

      if (extractResult.status === 'success' && extractResult.output) {
        setBillData(extractResult.output);
        setShowResults(true);
      } else {
        setError('Unable to extract data from the bill. Please make sure the image is clear and try again.');
      }
    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      setError('Failed to process the bill. Please try again.');
      console.error(err);
    }
  };

  // Calculate savings for each plan
  const getRecommendations = () => {
    if (!billData || !billData.monthly_usage_kwh) return [];

    const currentMonthlyCost = billData.monthly_cost || 0;
    
    return plans
      .map(plan => {
        const estimatedCost = (plan.rate_per_kwh / 100) * billData.monthly_usage_kwh + (plan.monthly_base_charge || 0);
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
  };

  const recommendations = showResults ? getRecommendations() : [];

  // Loading States
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

  // Results Page
  if (showResults && billData) {
    const totalPotentialSavings = recommendations.length > 0 ? recommendations[0].annualSavings : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-2">Your Bill Analysis Results</h1>
            <p className="text-sm text-blue-100">
              We found {recommendations.length} better plan{recommendations.length !== 1 ? 's' : ''} for you
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Current Bill Summary */}
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#0A5C8C]" />
                <h2 className="text-lg font-bold text-gray-900">Your Current Plan</h2>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Provider</p>
                  <p className="text-sm font-bold text-gray-900">{billData.provider_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Monthly Usage</p>
                  <p className="text-sm font-bold text-gray-900">{billData.monthly_usage_kwh || 0} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Current Rate</p>
                  <p className="text-sm font-bold text-gray-900">{billData.rate_per_kwh || 0}¢/kWh</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Monthly Cost</p>
                  <p className="text-sm font-bold text-gray-900">${billData.monthly_cost?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                            {plan.provider_name.substring(0, 3).toUpperCase()}
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

                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                        Switch to This Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
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

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <Button 
              onClick={() => {
                setShowResults(false);
                setBillData(null);
                setFile(null);
              }}
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

  // Upload Page
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="bill-upload"
                  className="cursor-pointer inline-block"
                >
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-[#0A5C8C] hover:bg-blue-50 transition-all">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {file ? file.name : 'Upload Your Electricity Bill'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, PNG, JPG • Max 10MB
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {file && (
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