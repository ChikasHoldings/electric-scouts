import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";

export default function TermsOfService() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Terms of Service", url: "/terms-of-service" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Terms of Service - Power Scouts | User Agreement & Guidelines"
        description="Power Scouts terms of service and user agreement. Understand your rights, responsibilities, and legal terms when using our free electricity rate comparison platform."
        keywords="terms of service, user agreement, electricity comparison terms, service guidelines, legal terms"
        canonical="/terms-of-service"
        structuredData={breadcrumbData}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-blue-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Power Scouts, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>

            <h2>2. Service Description</h2>
            <p>
              Power Scouts is a free electricity rate comparison platform that helps users compare electricity plans from multiple providers. We are not an electricity provider and do not supply electricity directly to consumers.
            </p>

            <h2>3. Accuracy of Information</h2>
            <p>
              While we strive to provide accurate and current information, electricity rates, plan details, and provider availability are subject to change without notice. All information is for comparison purposes only. Users should verify all details directly with electricity providers before enrollment.
            </p>

            <h2>4. No Guarantee of Savings</h2>
            <p>
              Savings estimates are based on average usage and market conditions. Actual savings vary by individual usage, location, credit score, and chosen plan. Power Scouts does not guarantee specific savings amounts.
            </p>

            <h2>5. User Responsibilities</h2>
            <p>Users agree to:</p>
            <ul>
              <li>Provide accurate information for comparisons</li>
              <li>Verify all plan details before enrolling</li>
              <li>Understand their current contract terms and potential fees</li>
              <li>Use the service for lawful purposes only</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>
              All content, logos, trademarks, and materials on Power Scouts are owned by Power Scouts or licensed to us. Unauthorized use is prohibited.
            </p>

            <h2>7. Third-Party Links</h2>
            <p>
              Our service contains links to third-party electricity provider websites. We are not responsible for the content, privacy practices, or terms of these external sites.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              Power Scouts shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our service, including but not limited to reliance on rate information or plan recommendations.
            </p>

            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Power Scouts from any claims arising from your use of the service or violation of these terms.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Continued use of the service constitutes acceptance of modified terms.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms of Service are governed by the laws of the United States and the State of Texas, without regard to conflict of law provisions.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              For questions about these Terms of Service, contact us at: <a href="mailto:legal@powerscouts.com" className="text-[#0A5C8C]">legal@powerscouts.com</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}