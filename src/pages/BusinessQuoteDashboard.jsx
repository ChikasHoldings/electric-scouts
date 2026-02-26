import React, { useState, useEffect } from "react";
import { CustomBusinessQuote } from "@/api/supabaseEntities";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, CheckCircle, FileText, TrendingDown, AlertCircle, Mail, Phone, MapPin, Calendar, Zap, DollarSign } from "lucide-react";

export default function BusinessQuoteDashboard() {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const loading = isLoadingAuth;

  const { data: quotes = [], isLoading, refetch } = useQuery({
    queryKey: ['businessQuotes', user?.email],
    queryFn: () => CustomBusinessQuote.filter({ email: user?.email }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      reviewing: "bg-blue-100 text-blue-800 border-blue-200",
      quoted: "bg-green-100 text-green-800 border-green-200",
      accepted: "bg-purple-100 text-purple-800 border-purple-200",
      declined: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      reviewing: <FileText className="w-4 h-4" />,
      quoted: <CheckCircle className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      declined: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0A5C8C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quotes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-2">
            <CardContent className="p-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h2>
              <p className="text-gray-600 mb-6">Please sign in to view your custom quote requests</p>
              <Button 
                onClick={() => navigateToLogin()}
                className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Custom Quote Requests</h1>
              <p className="text-blue-100">Track your business energy quote requests</p>
            </div>
            <Link to={createPageUrl("BusinessElectricity")}>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                New Quote Request
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {quotes.length === 0 ? (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Quote Requests Yet</h3>
              <p className="text-gray-600 mb-6">Start by requesting a custom quote for your business energy needs</p>
              <Link to={createPageUrl("BusinessElectricity")}>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                  Request Custom Quote
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {quotes.map((quote) => (
              <Card key={quote.id} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{quote.business_name}</h3>
                        <Badge className={`${getStatusColor(quote.status)} border flex items-center gap-1.5 px-2.5 py-1`}>
                          {getStatusIcon(quote.status)}
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">Submitted on {formatDate(quote.created_date)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-[#0A5C8C]" />
                        <span className="text-xs font-semibold text-gray-600">Business Type</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 capitalize">{quote.business_type}</div>
                      <div className="text-xs text-gray-600">{quote.industry_type}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-[#0A5C8C]" />
                        <span className="text-xs font-semibold text-gray-600">Monthly Usage</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{parseInt(quote.monthly_usage).toLocaleString()} kWh</div>
                      {quote.peak_demand && (
                        <div className="text-xs text-gray-600">Peak: {quote.peak_demand} kW</div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-[#0A5C8C]" />
                        <span className="text-xs font-semibold text-gray-600">Location</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">ZIP {quote.zip_code}</div>
                      <div className="text-xs text-gray-600">{quote.number_of_locations} location(s)</div>
                    </div>
                  </div>

                  {quote.current_supplier && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1">Current Supplier</div>
                          <div className="text-sm font-bold text-gray-900">{quote.current_supplier}</div>
                        </div>
                        {quote.contract_end_date && (
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Contract Ends</div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(quote.contract_end_date)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {quote.status === 'quoted' && quote.quoted_provider && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h4 className="font-bold text-gray-900">Quote Ready!</h4>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Recommended Provider</div>
                              <div className="text-sm font-bold text-gray-900">{quote.quoted_provider}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Quoted Rate</div>
                              <div className="text-lg font-bold text-[#0A5C8C]">{quote.quoted_rate}¢/kWh</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Estimated Annual Savings</div>
                              <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                                <TrendingDown className="w-4 h-4" />
                                ${quote.estimated_savings?.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {quote.email}
                    </div>
                    {quote.phone && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {quote.phone}
                        </div>
                      </>
                    )}
                    {quote.bill_file_url && (
                      <>
                        <span className="text-gray-300">•</span>
                        <a 
                          href={quote.bill_file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#0A5C8C] hover:text-[#084a6f]"
                        >
                          <FileText className="w-4 h-4" />
                          View Bill
                        </a>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="border-2 bg-gradient-to-r from-blue-50 to-green-50 mt-8">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our energy consultants typically respond within 24-48 hours
            </p>
            <a href="mailto:business@electricscouts.com">
              <Button variant="outline" className="border-2">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}