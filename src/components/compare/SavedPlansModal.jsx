import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Heart, Clock, Leaf, ExternalLink, Trash2 } from "lucide-react";

export default function SavedPlansModal({ isOpen, onClose, savedPlans, usage, onToggleSave, isPlanSaved }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Saved Plans</h2>
              <p className="text-sm text-blue-100">{savedPlans.length} plan{savedPlans.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {savedPlans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved plans yet</h3>
              <p className="text-gray-600 mb-6">
                Start comparing plans and click the heart icon to save your favorites
              </p>
              <Button onClick={onClose} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
                Browse Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPlans.map((plan) => {
                const estimatedCost = (plan.rate_per_kwh * usage / 100 + (plan.monthly_base_charge || 0)).toFixed(2);
                
                return (
                  <Card key={plan.id} className="border-2 hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-4 gap-6 items-center">
                        {/* Provider & Plan Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-teal-600">
                                {plan.provider_name.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {plan.plan_name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">{plan.provider_name}</p>
                              <div className="flex flex-wrap gap-2">
                                {plan.plan_type && (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                    {plan.plan_type}
                                  </Badge>
                                )}
                                {plan.renewable_percentage >= 50 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <Leaf className="w-3 h-3 mr-1" />
                                    {plan.renewable_percentage}% Renewable
                                  </Badge>
                                )}
                                {plan.early_termination_fee === 0 && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    No ETF
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rate Info */}
                        <div className="text-center md:text-left">
                          <div className="mb-2">
                            <div className="text-3xl font-bold text-teal-600">
                              {plan.rate_per_kwh.toFixed(1)}¢
                            </div>
                            <div className="text-sm text-gray-600">per kWh</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {plan.contract_length} months
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="text-center md:text-right space-y-3">
                          <div className="mb-3">
                            <div className="text-2xl font-bold text-gray-900">
                              ${estimatedCost}
                            </div>
                            <div className="text-sm text-gray-600">est. monthly</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                              View Details
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => onToggleSave(plan)}
                              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {savedPlans.length > 0 && (
          <div className="border-t bg-gray-50 p-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Comparing {savedPlans.length} saved plan{savedPlans.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={onClose} variant="outline">
              Continue Browsing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}