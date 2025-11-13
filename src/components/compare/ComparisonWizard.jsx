import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Zap, Home, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { validateZipCode } from "./stateData";

export default function ComparisonWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    zipCode: "",
    state: "",
    stateName: "",
    usage: 1000,
    homeType: "house",
    currentRate: ""
  });
  const [zipError, setZipError] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Get ZIP from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zipFromUrl = urlParams.get('zip');
    if (zipFromUrl) {
      setFormData(prev => ({ ...prev, zipCode: zipFromUrl }));
      validateAndAdvance(zipFromUrl);
    }
  }, []);

  const validateAndAdvance = (zip) => {
    const validation = validateZipCode(zip);
    
    if (!validation.valid) {
      setZipError(validation.error);
      if (validation.waitlist) {
        setShowWaitlist(true);
      }
      return;
    }
    
    setZipError("");
    setFormData(prev => ({ 
      ...prev, 
      state: validation.state,
      stateName: validation.stateName,
      providerCount: validation.providerCount,
      avgSavings: validation.avgSavings
    }));
    setStep(2);
  };

  const handleStep1Submit = () => {
    validateAndAdvance(formData.zipCode);
  };

  const handleStep2Submit = () => {
    if (formData.usage >= 500) {
      setStep(3);
    }
  };

  const handleStep3Submit = () => {
    if (formData.homeType) {
      setStep(4);
    }
  };

  const handleFinalSubmit = () => {
    onComplete(formData);
  };

  const handleSkipToResults = () => {
    onComplete(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700">Step {step} of {totalSteps}</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0A5C8C] to-[#FF6B35]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: ZIP Code */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-2xl">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Where do you need electricity?
                  </h2>
                  <p className="text-lg text-gray-600">
                    Enter your ZIP code to see available plans in your state
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="relative mb-4">
                    <Input
                      type="text"
                      placeholder="Enter 5-digit ZIP code"
                      value={formData.zipCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData(prev => ({ ...prev, zipCode: value }));
                        setZipError("");
                        setShowWaitlist(false);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.zipCode.length === 5) {
                          handleStep1Submit();
                        }
                      }}
                      className={`h-16 text-xl text-center font-semibold tracking-wider ${
                        zipError ? 'border-red-500 border-2' : 'border-2'
                      }`}
                      maxLength={5}
                    />
                  </div>

                  {zipError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-800 font-semibold">{zipError}</p>
                          {showWaitlist && (
                            <p className="text-red-600 text-sm mt-1">
                              Join our waitlist to be notified when we expand to your area.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleStep1Submit}
                    disabled={formData.zipCode.length !== 5}
                    className="w-full h-16 text-lg font-bold bg-[#FF6B35] hover:bg-[#e55a2b] disabled:opacity-50"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>100% Free</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>No Sign-Up Required</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Monthly Usage */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-2xl">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#e55a2b] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    How much electricity do you use?
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    Serving: <span className="font-semibold text-[#0A5C8C]">{formData.stateName} - ZIP {formData.zipCode}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Average household: 1,000 kWh/month
                  </p>
                </div>

                <div className="max-w-lg mx-auto">
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 mb-8">
                    <div className="text-center mb-6">
                      <div className="text-6xl font-bold text-[#0A5C8C] mb-2">
                        {formData.usage.toLocaleString()}
                      </div>
                      <div className="text-xl text-gray-700 font-semibold">kWh per month</div>
                    </div>
                    
                    <Slider
                      value={[formData.usage]}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, usage: value[0] }))}
                      min={500}
                      max={3000}
                      step={100}
                      className="mb-4"
                    />
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>500 kWh</span>
                      <span>3,000 kWh</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { value: 750, label: "Small" },
                      { value: 1000, label: "Average" },
                      { value: 2000, label: "Large" }
                    ].map((preset) => (
                      <Button
                        key={preset.value}
                        onClick={() => setFormData(prev => ({ ...prev, usage: preset.value }))}
                        variant={formData.usage === preset.value ? "default" : "outline"}
                        className={formData.usage === preset.value ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 h-14 text-base"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleStep2Submit}
                      className="flex-1 h-14 text-base bg-[#FF6B35] hover:bg-[#e55a2b]"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Home Type */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-2xl">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Home className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    What type of property?
                  </h2>
                  <p className="text-lg text-gray-600">
                    This helps us show the most relevant plans
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {[
                      { value: "house", label: "House", icon: "🏠" },
                      { value: "apartment", label: "Apartment", icon: "🏢" },
                      { value: "business", label: "Business", icon: "🏭" }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFormData(prev => ({ ...prev, homeType: type.value }))}
                        className={`p-8 rounded-xl border-3 transition-all ${
                          formData.homeType === type.value
                            ? 'border-[#FF6B35] bg-orange-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="text-5xl mb-3">{type.icon}</div>
                        <div className="text-lg font-bold text-gray-900">{type.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex-1 h-14 text-base"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleStep3Submit}
                      disabled={!formData.homeType}
                      className="flex-1 h-14 text-base bg-[#FF6B35] hover:bg-[#e55a2b]"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Current Rate (Optional) */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-2xl">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">💰</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    What's your current rate?
                  </h2>
                  <p className="text-lg text-gray-600">
                    Optional - helps us show your potential savings
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="relative mb-6">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 10.5"
                      value={formData.currentRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentRate: e.target.value }))}
                      className="h-16 text-xl text-center font-semibold pl-12"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500">¢/kWh</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900">
                      <strong>Tip:</strong> Check your current electricity bill for your rate per kWh (usually under "Energy Charge"). Average in {formData.stateName}: {formData.state === 'TX' ? '10.5¢' : formData.state === 'PA' ? '9.8¢' : formData.state === 'NY' ? '11.2¢' : '10.0¢'}/kWh
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(3)}
                      variant="outline"
                      className="flex-1 h-14 text-base"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSkipToResults}
                      variant="outline"
                      className="flex-1 h-14 text-base"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleFinalSubmit}
                      className="flex-1 h-14 text-base bg-[#FF6B35] hover:bg-[#e55a2b]"
                    >
                      Show My Plans!
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}