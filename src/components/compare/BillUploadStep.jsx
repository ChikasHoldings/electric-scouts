import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

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
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      setIsUploading(false);
      setIsProcessing(true);

      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            monthly_usage_kwh: { type: "number", description: "Monthly electricity usage in kWh" },
            monthly_cost: { type: "number", description: "Total monthly cost in dollars" },
            rate_per_kwh: { type: "number", description: "Rate per kWh in cents" },
            zip_code: { type: "string", description: "Service ZIP code" }
          }
        }
      });

      setIsProcessing(false);

      if (extractResult.status === 'success' && extractResult.output) {
        onAnalysisComplete(extractResult.output);
      } else {
        setError('Unable to extract data from the bill. Please make sure the image is clear.');
      }
    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      setError('Failed to process the bill. Please try again.');
      console.error(err);
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
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isUploading ? 'Uploading Your Bill' : 'Analyzing Your Bill'}
        </h2>
        <p className="text-sm text-gray-600">
          {isUploading ? 'Please wait...' : 'Extracting usage data...'}
        </p>
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
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mb-6">
              <input
                type="file"
                id="bill-upload-flow"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="bill-upload-flow" className="cursor-pointer inline-block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-blue-50 transition-all" 
                     style={{ borderColor: file ? accentColor : undefined }}>
                  {file ? (
                    <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: accentColor }} />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {file ? file.name : 'Click to Upload Bill'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    PDF, PNG, or JPG • Max 10MB
                  </p>
                  <p className="text-xs text-gray-500">
                    We'll extract your usage and find the best plans
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
                className="w-full text-white mb-3"
                style={{ backgroundColor: accentColor }}
              >
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