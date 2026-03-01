import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Home, Zap, Wifi, Droplet, Phone, CheckCircle, 
  Clock, Shield, Users, Star, ChevronDown, Mail, ArrowRight,
  MapPin, Calendar, User, Building, Lock, Tv, Wrench,
  FileText, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon
} from "lucide-react";
import SEOHead, { getOrganizationSchema } from "@/components/SEOHead";

export default function HomeConcierge() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState(null);
  const [step, setStep] = useState(0); // 0 = landing, 1-4 = form steps, 5 = confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    new_address: "",
    city: "",
    state: "",
    zip_code: "",
    move_in_date: "",
    property_type: "house",
    services_requested: ["electricity"],
    electricity_preference: "no_preference",
    internet_speed: "standard",
    monthly_budget: "",
    wants_home_security: false,
    wants_home_insurance: false,
    wants_moving_service: false,
    wants_home_warranty: false,
    special_instructions: "",
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service) => {
    setFormData(prev => {
      const current = prev.services_requested;
      if (current.includes(service)) {
        return { ...prev, services_requested: current.filter(s => s !== service) };
      }
      return { ...prev, services_requested: [...current, service] };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Use supabase client directly with just .insert() — no .select().single()
      // The entity .create() method chains .select().single() after insert, which
      // triggers a SELECT query that can fail for anonymous users due to RLS policies.
      const { error } = await supabase
        .from('concierge_requests')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          new_address: formData.new_address,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code,
          move_in_date: formData.move_in_date || null,
          property_type: formData.property_type,
          services_requested: formData.services_requested,
          electricity_preference: formData.electricity_preference,
          internet_speed: formData.internet_speed,
          monthly_budget: formData.monthly_budget || null,
          wants_home_security: formData.wants_home_security,
          wants_home_insurance: formData.wants_home_insurance,
          wants_moving_service: formData.wants_moving_service,
          wants_home_warranty: formData.wants_home_warranty,
          special_instructions: formData.special_instructions || null,
          status: 'new',
          source: 'website',
        });
      if (error) throw error;
      setStep(5);
      toast({ title: "Request submitted!", description: "We'll be in touch within 24 hours." });
    } catch (err) {
      console.error('Concierge submit error:', err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { key: "electricity", icon: Zap, name: "Electricity", color: "from-yellow-500 to-orange-500", description: "Compare 40+ providers for the best rates" },
    { key: "internet", icon: Wifi, name: "Internet", color: "from-blue-500 to-cyan-500", description: "Fiber, cable, and wireless options" },
    { key: "water_gas", icon: Droplet, name: "Water & Gas", color: "from-cyan-500 to-teal-500", description: "Local utility setup and coordination" },
    { key: "phone_tv", icon: Tv, name: "Phone & TV", color: "from-purple-500 to-pink-500", description: "Streaming, cable, and phone bundles" },
  ];

  const partnerServices = [
    { key: "wants_home_security", icon: Lock, name: "Home Security", description: "ADT, SimpliSafe, Ring — we'll find the best system for your home", benefit: "Get up to $200 in free equipment" },
    { key: "wants_home_insurance", icon: Shield, name: "Home Insurance", description: "Compare quotes from top insurers to protect your new home", benefit: "Save an average of $400/year" },
    { key: "wants_moving_service", icon: Building, name: "Moving Help", description: "Vetted local movers with guaranteed pricing", benefit: "10% off with our partner discount" },
    { key: "wants_home_warranty", icon: Wrench, name: "Home Warranty", description: "Protect appliances and systems from unexpected repairs", benefit: "First month free with our referral" },
  ];

  const benefits = [
    { icon: Clock, title: "Save Hours of Time", description: "One request handles all your utility needs. No more calling multiple companies or comparing confusing plans." },
    { icon: Shield, title: "Expert Guidance", description: "Our specialists know providers, rates, and service quality in your area. We recommend only the best options." },
    { icon: Users, title: "Personalized Plans", description: "We match your household size, usage habits, and budget to plans perfectly suited to your lifestyle." },
    { icon: Star, title: "Seamless Setup", description: "We coordinate all scheduling to ensure every utility is active and ready when you move in." },
  ];

  const howItWorks = [
    { step: "1", title: "Tell Us About Your Move", description: "Fill out our quick form with your new address, move-in date, and service preferences" },
    { step: "2", title: "We Research & Compare", description: "Our team compares all available providers and plans to find the best rates in your area" },
    { step: "3", title: "Review Your Options", description: "We send you a personalized report with our top recommendations — you choose what works best" },
    { step: "4", title: "We Handle Everything", description: "We complete enrollment, coordinate activation dates, and ensure everything is ready when you arrive" },
  ];

  const faqs = [
    { id: 1, question: "What utilities does the concierge service cover?", answer: "We help set up electricity, internet, water, gas, phone, and TV. For electricity in deregulated markets, we compare rates from 40+ providers. We also connect you with trusted partners for home security, insurance, moving, and home warranty services." },
    { id: 2, question: "How much does the concierge service cost?", answer: "Our Home Concierge service is completely free! We're compensated by service providers when you choose their plans, so you pay nothing extra. In fact, we often help you save money by finding better rates." },
    { id: 3, question: "How far in advance should I contact you?", answer: "We recommend 2-3 weeks before your move-in date. This gives us time to research providers, compare rates, and schedule services. We can also handle last-minute requests when possible." },
    { id: 4, question: "What if I only need help with one utility?", answer: "That's perfectly fine! Many customers use us specifically for electricity since deregulated markets have dozens of confusing options. Whatever level of help you need, we're here to assist at no cost." },
    { id: 5, question: "Which states do you serve?", answer: "We serve all deregulated electricity markets including Texas, Illinois, Ohio, Pennsylvania, New York, New Jersey, Maryland, Massachusetts, Maine, New Hampshire, Rhode Island, and Connecticut. For other utilities, we can assist nationwide." },
  ];

  // ─── Form Steps ───────────────────────────────────────────
  const renderFormStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-[#0A5C8C]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Contact Information</h2>
              <p className="text-gray-600 mt-2">So we can send you personalized recommendations</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <Input placeholder="John Smith" value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                <Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <Input type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-12" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property Type</label>
                <Select value={formData.property_type} onValueChange={(v) => updateField("property_type", v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your New Home</h2>
              <p className="text-gray-600 mt-2">Where are you moving to?</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address *</label>
                <Input placeholder="123 Main Street, Apt 4B" value={formData.new_address} onChange={(e) => updateField("new_address", e.target.value)} className="h-12" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                  <Input placeholder="Houston" value={formData.city} onChange={(e) => updateField("city", e.target.value)} className="h-12" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                  <Select value={formData.state} onValueChange={(v) => updateField("state", v)}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["TX","IL","OH","PA","NY","NJ","MD","MA","ME","NH","RI","CT","CA","FL","GA","NC","VA","WA","CO","AZ","OR","MI","MN","WI","MO","TN","IN","AL","SC","LA","KY","OK","IA","AR","MS","KS","NE","NV","NM","WV","ID","HI","MT","DE","SD","ND","AK","VT","WY","DC","UT"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ZIP Code *</label>
                  <Input placeholder="77001" value={formData.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} className="h-12" maxLength={5} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Move-in Date</label>
                <Input type="date" value={formData.move_in_date} onChange={(e) => updateField("move_in_date", e.target.value)} className="h-12" />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#FF6B35]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Select Your Services</h2>
              <p className="text-gray-600 mt-2">Which utilities do you need help setting up?</p>
            </div>

            {/* Core Services */}
            <div className="grid sm:grid-cols-2 gap-3">
              {services.map((svc) => {
                const Icon = svc.icon;
                const selected = formData.services_requested.includes(svc.key);
                return (
                  <div
                    key={svc.key}
                    onClick={() => toggleService(svc.key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? "border-[#0A5C8C] bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${svc.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{svc.name}</p>
                        <p className="text-xs text-gray-500">{svc.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selected ? "bg-[#0A5C8C] border-[#0A5C8C]" : "border-gray-300"
                      }`}>
                        {selected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Electricity Preferences */}
            {formData.services_requested.includes("electricity") && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" /> Electricity Preferences
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { value: "lowest_rate", label: "Lowest Rate", desc: "Get the cheapest plan available" },
                    { value: "fixed_rate", label: "Fixed Rate", desc: "Lock in a stable rate" },
                    { value: "renewable", label: "100% Renewable", desc: "Green energy only" },
                    { value: "no_preference", label: "No Preference", desc: "Show me all options" },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => updateField("electricity_preference", opt.value)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.electricity_preference === opt.value ? "border-yellow-500 bg-yellow-100" : "border-yellow-200 hover:border-yellow-300 bg-white"
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly Utility Budget (optional)</label>
              <Select value={formData.monthly_budget} onValueChange={(v) => updateField("monthly_budget", v)}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Select your budget range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_100">Under $100/month</SelectItem>
                  <SelectItem value="100_200">$100 - $200/month</SelectItem>
                  <SelectItem value="200_300">$200 - $300/month</SelectItem>
                  <SelectItem value="over_300">Over $300/month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Bonus Savings</h2>
              <p className="text-gray-600 mt-2">Our trusted partners offer exclusive deals for new movers</p>
            </div>

            <div className="space-y-3">
              {partnerServices.map((partner) => {
                const Icon = partner.icon;
                const selected = formData[partner.key];
                return (
                  <div
                    key={partner.key}
                    onClick={() => updateField(partner.key, !selected)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? "border-purple-500 bg-purple-50 shadow-md" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900">{partner.name}</h3>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selected ? "bg-purple-600 border-purple-600" : "border-gray-300"
                          }`}>
                            {selected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{partner.description}</p>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {partner.benefit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Special Instructions (optional)</label>
              <Textarea 
                placeholder="Any specific requirements, timing preferences, or questions..."
                value={formData.special_instructions}
                onChange={(e) => updateField("special_instructions", e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            <Card className="bg-gray-50 border-2">
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900 mb-3">Request Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{formData.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-semibold">{formData.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-semibold truncate ml-4">{formData.new_address}, {formData.zip_code}</span></div>
                  {formData.move_in_date && <div className="flex justify-between"><span className="text-gray-500">Move-in</span><span className="font-semibold">{formData.move_in_date}</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Services</span><span className="font-semibold">{formData.services_requested.length} selected</span></div>
                  {(formData.wants_home_security || formData.wants_home_insurance || formData.wants_moving_service || formData.wants_home_warranty) && (
                    <div className="flex justify-between"><span className="text-gray-500">Bonus Services</span><span className="font-semibold text-purple-600">
                      {[formData.wants_home_security && "Security", formData.wants_home_insurance && "Insurance", formData.wants_moving_service && "Moving", formData.wants_home_warranty && "Warranty"].filter(Boolean).join(", ")}
                    </span></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.full_name.trim() && formData.email.trim() && formData.email.includes("@");
      case 2: return formData.new_address.trim() && formData.zip_code.trim().length === 5;
      case 3: return formData.services_requested.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  // ─── Confirmation Page ────────────────────────────────────
  if (step === 5) {
    return (
      <>
        <SEOHead title="Request Submitted | Home Concierge | Electric Scouts" canonical="/home-concierge" />
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">You're All Set!</h1>
            <p className="text-lg text-gray-600 mb-8">
              We've received your concierge request. Our team will review your preferences and reach out within <strong>24 hours</strong> with personalized recommendations.
            </p>
            <Card className="bg-white border-2 mb-8">
              <CardContent className="p-6 text-left">
                <h3 className="font-bold text-gray-900 mb-3">What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <p className="text-sm text-gray-600">We research all available providers and plans for your ZIP code</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <p className="text-sm text-gray-600">You'll receive a personalized report via email with our top picks</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <p className="text-sm text-gray-600">Once you approve, we handle all the enrollment and scheduling</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl("CompareRates")}>
                <Button variant="outline" className="px-6">Compare Rates Now</Button>
              </Link>
              <Link to={createPageUrl("Home")}>
                <Button className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-6">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Form Flow ────────────────────────────────────────────
  if (step >= 1) {
    return (
      <>
        <SEOHead title="Home Concierge | Set Up All Utilities | Electric Scouts" canonical="/home-concierge" />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          {/* Progress Bar */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => step === 1 ? setStep(0) : setStep(step - 1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <span className="text-sm font-semibold text-gray-500">Step {step} of 4</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#0A5C8C] h-2 rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-8">
            {renderFormStep()}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => step === 1 ? setStep(0) : setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  disabled={!canProceed()}
                  className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-8"
                >
                  Continue <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <>Submit Request <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Landing Page (step 0) ────────────────────────────────
  return (
    <>
    <SEOHead
      title="Home Concierge | Set Up All Utilities in One Place | Electric Scouts"
      description="Let Electric Scouts handle your electricity, internet, water, and phone setup. Free one-stop home concierge service for new movers."
      canonical="/home-concierge"
      keywords="home concierge, utility setup, new home utilities, electricity setup service"
      structuredData={getOrganizationSchema()}
    />
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Home className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">Home Concierge Service</h1>
            <p className="text-xl text-blue-100 mb-2">Moving? We'll handle all your utility setup so you can focus on settling in.</p>
            <p className="text-base text-blue-200 mb-8">Electricity &bull; Internet &bull; Water &bull; Gas &bull; Phone &bull; TV &mdash; All Coordinated for You</p>
            <Button onClick={() => setStep(1)} className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-10 py-6 text-lg font-bold rounded-xl shadow-lg">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm mt-6">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /><span>100% Free</span></div>
              <span className="text-blue-300">&bull;</span>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /><span>No Hidden Fees</span></div>
              <span className="text-blue-300">&bull;</span>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /><span>24-Hour Response</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Services */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">We Handle Everything</h2>
            <p className="text-xl text-gray-600">From electricity to internet, we coordinate all your essential home services</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <Card key={i} className="border-2 hover:border-[#0A5C8C] hover:shadow-xl transition-all">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${svc.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{svc.name}</h3>
                    <p className="text-gray-600">{svc.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Use Our Concierge Service?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <Card key={i} className="border-2 hover:shadow-lg transition-all">
                  <CardContent className="p-8 flex gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-[#0A5C8C]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{b.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{b.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
              <div className="grid md:grid-cols-4 gap-8">
                {howItWorks.map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">{item.step}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Partner Services Preview */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bonus Services for New Movers</h2>
            <p className="text-xl text-gray-600">Exclusive deals from our trusted partners</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerServices.map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={i} className="border-2 hover:border-purple-400 hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{p.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{p.benefit}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white border-2">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-700 italic mb-4">"Moving to Texas was stressful enough. Having Electric Scouts handle all my utility setup was a lifesaver. They got me great electricity rates and had everything ready when I moved in!"</p>
                <p className="font-semibold text-gray-900">- Sarah M., Houston</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-2">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-700 italic mb-4">"I didn't know where to start with setting up utilities in a new state. The concierge service walked me through everything and saved me hours of research and phone calls."</p>
                <p className="font-semibold text-gray-900">- Mike T., Dallas</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <Card key={faq.id} className="border-2 hover:border-[#0A5C8C] transition-all cursor-pointer overflow-hidden" onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold text-gray-900 pr-4">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`transition-all duration-300 ease-in-out ${openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white border-0">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Move?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">Focus on settling into your new home while we handle all the utility coordination and setup</p>
              <Button onClick={() => setStep(1)} className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-10 py-6 text-lg font-bold rounded-xl shadow-lg">
                Start Your Free Request <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
    </>
  );
}
