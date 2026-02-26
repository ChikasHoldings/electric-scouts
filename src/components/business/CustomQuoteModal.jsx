import React, { useState } from "react";
import { CustomBusinessQuote } from "@/api/supabaseEntities";
import { UploadFile } from "@/api/supabaseIntegrations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, FileText, CheckCircle, Loader2, DollarSign, Leaf, Clock, Zap, Calendar } from "lucide-react";

export default function CustomQuoteModal({ onClose, initialData = {} }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    zip_code: initialData.zipCode || "",
    business_type: initialData.businessType || "",
    industry_type: initialData.industryType || "",
    monthly_usage: initialData.monthlyUsage || "",
    peak_demand: "",
    peak_demand_hours: "",
    number_of_locations: "1",
    current_supplier: "",
    contract_end_date: "",
    current_rate: "",
    energy_goals: [],
    bill_file_url: "",
    status: "pending"
  });

  const queryClient = useQueryClient();

  const createQuoteMutation = useMutation({
    mutationFn: (data) => CustomBusinessQuote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessQuotes']);
      setStep(3);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const result = await UploadFile({ file });
      setFormData(prev => ({ ...prev, bill_file_url: result.file_url }));
    } catch (error) {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.business_name || !formData.contact_name || !formData.email || !formData.monthly_usage) {
      alert("Please fill in all required fields");
      return;
    }
    createQuoteMutation.mutate(formData);
  };

  const toggleEnergyGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      energy_goals: prev.energy_goals.includes(goal)
        ? prev.energy_goals.filter(g => g !== goal)
        : [...prev.energy_goals, goal]
    }));
  };

  const energyGoalOptions = [
    { value: "cost", label: "Reduce Costs", icon: DollarSign },
    { value: "sustainability", label: "Green Energy", icon: Leaf },
    { value: "predictability", label: "Budget Stability", icon: Clock },
    { value: "demand", label: "Peak Demand", icon: Zap }
  ];

  const businessTypes = [
    { value: "small", label: "Small Business (< 10,000 kWh/mo)" },
    { value: "medium", label: "Medium Business (10,000-50,000 kWh/mo)" },
    { value: "large", label: "Large Commercial (50,000-200,000 kWh/mo)" },
    { value: "industrial", label: "Industrial (> 200,000 kWh/mo)" }
  ];

  const industryTypes = [
    "Retail", "Restaurant/Food Service", "Office/Professional Services", "Healthcare/Medical",
    "Manufacturing", "Warehouse/Distribution", "Hospitality/Hotel", "Education",
    "Technology/Data Center", "Real Estate/Property Management", "Agriculture", "Other"
  ];

  // Success Screen
  if (step === 3) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-2 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Quote Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Our energy consultants will review your information and contact you within 24-48 hours with a custom quote.
            </p>
            <Button onClick={onClose} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full my-8 border-2 shadow-2xl">
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Request Custom Quote</h2>
            <p className="text-sm text-blue-100">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/10 rounded-full p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Business Name *</label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your Business Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Contact Name *</label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">ZIP Code *</label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value.replace(/\D/g, '') }))}
                    placeholder="12345"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Business Type *</label>
                  <Select value={formData.business_type} onValueChange={(val) => setFormData(prev => ({ ...prev, business_type: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Industry Type</label>
                  <Select value={formData.industry_type} onValueChange={(val) => setFormData(prev => ({ ...prev, industry_type: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryTypes.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Monthly Usage (kWh) *</label>
                  <Input
                    value={formData.monthly_usage}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_usage: e.target.value.replace(/\D/g, '') }))}
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Peak Demand (kW)</label>
                  <Input
                    value={formData.peak_demand}
                    onChange={(e) => setFormData(prev => ({ ...prev, peak_demand: e.target.value.replace(/\D/g, '') }))}
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Peak Hours</label>
                  <Input
                    value={formData.peak_demand_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, peak_demand_hours: e.target.value }))}
                    placeholder="e.g., 9am-5pm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Current Supplier</label>
                  <Input
                    value={formData.current_supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_supplier: e.target.value }))}
                    placeholder="e.g., TXU Energy"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Contract End Date</label>
                  <Input
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Current Rate (¢/kWh)</label>
                <Input
                  value={formData.current_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_rate: e.target.value }))}
                  placeholder="e.g., 12.5"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Upload Current Bill (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0A5C8C] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bill-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="bill-upload" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-[#0A5C8C] mx-auto mb-2 animate-spin" />
                    ) : formData.bill_file_url ? (
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {uploading ? "Uploading..." : formData.bill_file_url ? "Bill Uploaded" : "Click to upload bill"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-3 block">Energy Goals</label>
                <div className="grid grid-cols-2 gap-3">
                  {energyGoalOptions.map((goal) => (
                    <div
                      key={goal.value}
                      onClick={() => toggleEnergyGoal(goal.value)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.energy_goals.includes(goal.value)
                          ? 'border-[#0A5C8C] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <goal.icon className="w-4 h-4 text-[#0A5C8C]" />
                        <span className="text-sm font-semibold text-gray-900">{goal.label}</span>
                        {formData.energy_goals.includes(goal.value) && (
                          <CheckCircle className="w-4 h-4 text-[#0A5C8C] ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createQuoteMutation.isLoading}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
                >
                  {createQuoteMutation.isLoading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}