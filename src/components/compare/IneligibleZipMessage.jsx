import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, BookOpen, RefreshCw, MapPin } from "lucide-react";

/**
 * IneligibleZipMessage Component
 * Displayed when user enters a ZIP code outside deregulated electricity markets
 */
export default function IneligibleZipMessage({ zipCode, onTryAgain }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card className="border-2 border-orange-200 bg-orange-50/50">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-orange-600" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Service Not Available in Your Area
          </h2>

          {/* Message */}
          <div className="bg-white rounded-lg p-6 mb-6 border border-orange-200">
            <div className="flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-700 leading-relaxed mb-3">
                  <strong>Electric Scouts is not available in ZIP code {zipCode} yet.</strong> 
                  Electricity choice is currently not deregulated in this area.
                </p>
                <p className="text-gray-600 text-sm">
                  We currently serve 12 deregulated states where residents can choose their 
                  electricity provider: Texas, Illinois, Ohio, Pennsylvania, New York, New Jersey, 
                  Maryland, Massachusetts, Connecticut, Maine, New Hampshire, and Rhode Island.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onTryAgain}
              className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white font-semibold px-6"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Another ZIP Code
            </Button>
            
            <Link to={createPageUrl("LearningCenter")} className="inline-flex items-center justify-center border-2 border-[#0A5C8C] text-[#0A5C8C] hover:bg-blue-50 font-semibold px-6 h-9 rounded-md w-full sm:w-auto">
              <BookOpen className="w-4 h-4 mr-2" />
              Explore Energy Guides
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-orange-200">
            <p className="text-sm text-gray-600 mb-3">
              Want to know when Electric Scouts expands to your area?
            </p>
            <Link to={createPageUrl("AboutUs")} className="text-[#0A5C8C] font-semibold hover:underline">
              Contact Us for Updates
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Service Area Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Currently serving these deregulated electricity markets:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Texas', 'Illinois', 'Ohio', 'Pennsylvania', 'New York', 'New Jersey', 
            'Maryland', 'Massachusetts', 'Connecticut', 'Maine', 'New Hampshire', 'Rhode Island'].map((state) => (
            <span key={state} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              {state}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}