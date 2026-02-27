import React, { useState } from "react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/supabaseIntegrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

export default function BillUploadStep({ onSkip, onAnalysisComplete, onBack, accentColor = "#0A5C8C" }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

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
      const uploadResult = await UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      setIsUploading(false);
      setIsProcessing(true);

      // Use the full extraction prompt (same as standalone BillAnalyzer)
      // instead of the simplified json_schema approach
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        extraction_prompt: `You are analyzing an electricity bill document. Extract the following and return as a JSON object with these exact field names:
{
  "customer_name": (string, the customer/account holder name on the bill),
  "service_address": (string, the full service address where electricity is delivered),
  "monthly_usage_kwh": (number, monthly electricity usage in kWh),
  "monthly_cost": (number, total monthly cost in dollars),
  "rate_per_kwh": (number, rate per kWh in cents),
  "contract_term": (number, contract term in months, or null if unknown),
  "provider_name": (string, current electricity provider/company name, usually at the top of the bill),
  "plan_name": (string, current plan/product name, or null if unknown),
  "zip_code": (string, service address ZIP code),
  "account_number": (string, the account or customer number),
  "billing_period": (string, the billing period dates, e.g. "Dec 5 - Jan 6, 2026")
}
IMPORTANT:
- For monthly_usage_kwh: Look for "kWh Used", "Total Usage", "Energy Used", or similar.
- For monthly_cost: Look for "Total Amount Due", "Total Charges", "Amount Due", or the final bill total.
- For rate_per_kwh: Look for "Price per kWh", "Energy Charge Rate", or calculate from total cost / usage. Express in CENTS (e.g., 12.5 for 12.5¢/kWh).
- For customer_name: Look for "Name", "Customer", "Account Holder" on the bill.
- For service_address: Look for "Service Address", "Delivery Address", or the address where electricity is delivered.
- If a field cannot be determined, use null for strings and 0 for numbers.
- Return JSON only, no explanation or markdown.`
      });

      setIsProcessing(false);

      if (extractResult && extractResult.status === 'success' && extractResult.output) {
        const output = extractResult.output;
        // Validate we got at least some meaningful data
        if (output.monthly_usage_kwh > 0 || output.monthly_cost > 0 || output.provider_name) {
          onAnalysisComplete(output);
        } else {
          setError('We could not extract enough data from this bill. Please ensure the image is clear and try again, or skip this step.');
        }
      } else {
        setError('Unable to extract data from the bill. Please make sure the image is clear and try again, or skip this step.');
      }
    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      console.error('Bill upload/analysis error:', err);
      
      // Provide more specific error messages
      const errMsg = err?.message || '';
      if (errMsg.includes('authentication') || errMsg.includes('API key')) {
        setError('Our analysis service is temporarily unavailable. Please skip this step and continue.');
      } else if (errMsg.includes('rate limit')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (errMsg.includes('file') || errMsg.includes('format')) {
        setError('This file format could not be processed. Please try a PNG or JPG image of your bill.');
      } else {
        setError('Failed to process the bill. Please try again or skip this step.');
      }
    }
  };

  if (isUploading || isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div 
            className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin"
            style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
          ></div>
          <FileText className="absolute inset-0 m-auto w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isUploading ? 'Uploading Your Bill' : 'Analyzing Your Bill'}
        </h2>
        <p className="text-sm text-gray-600">
          {isUploading ? 'Securely uploading your file...' : 'Extracting usage data and finding savings...'}
        </p>
        <p className="text-xs text-gray-400 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Upload Your Bill (Optional)
        </h1>
        <p className="text-gray-600">
          Get personalized recommendations based on your actual usage
        </p>
      </div>

      <Card className="border-2" style={{ borderColor: `${accentColor}33` }}>
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <div className="mb-6">
              <input
                type="file"
                id="bill-upload-flow"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="bill-upload-flow" className="cursor-pointer inline-block w-full">
                <div className="border-2 border-dashed rounded-xl p-6 sm:p-8 hover:bg-blue-50 transition-all" 
                     style={{ borderColor: file ? accentColor : '#d1d5db' }}>
                  {file ? (
                    <>
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: accentColor }} />
                      <h3 className="text-lg font-bold text-gray-900 mb-2 break-all px-2">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-xs font-medium" style={{ color: accentColor }}>
                        Click to choose a different file
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Click to Upload Bill
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        PDF, PNG, or JPG &bull; Max 10MB
                      </p>
                      <p className="text-xs text-gray-500">
                        We'll extract your usage and find the best plans
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-left">{error}</p>
                </div>
              </div>
            )}

            {file && (
              <Button
                onClick={handleUploadAndAnalyze}
                className="w-full text-white mb-3 h-12 text-base font-semibold"
                style={{ backgroundColor: accentColor }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Analyze Bill & Find Best Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <FileText className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
              <p className="font-semibold text-gray-900">Quick Analysis</p>
              <p className="text-gray-600">Results in seconds</p>
            </div>
            <div>
              <CheckCircle className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
              <p className="font-semibold text-gray-900">Accurate Data</p>
              <p className="text-gray-600">AI-powered extraction</p>
            </div>
            <div>
              <ArrowRight className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
              <p className="font-semibold text-gray-900">Better Match</p>
              <p className="text-gray-600">Plans for your usage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button onClick={onBack} variant="outline" className="h-11">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onSkip}
          variant="outline"
          className="h-11 px-8"
        >
          Skip This Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
