import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "../components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Privacy Policy - Power Scouts"
        description="Power Scouts privacy policy. Learn how we protect your data when you compare electricity rates."
        canonical="/privacy-policy"
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-blue-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              When you use Power Scouts to compare electricity rates, we collect:
            </p>
            <ul>
              <li>ZIP code for rate comparison</li>
              <li>Estimated electricity usage (kWh)</li>
              <li>Contact information if you choose to provide it</li>
              <li>Browser and device information for analytics</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide accurate electricity rate comparisons</li>
              <li>Match you with suitable electricity plans</li>
              <li>Improve our comparison service</li>
              <li>Communicate about your rate comparison</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul>
              <li>Electricity providers when you request plan information</li>
              <li>Service providers who assist our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or misuse.
            </p>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>
              We use cookies to enhance your experience, remember your preferences, and analyze site traffic. You can control cookie settings in your browser.
            </p>

            <h2>7. Changes to Privacy Policy</h2>
            <p>
              We may update this privacy policy periodically. Changes will be posted on this page with an updated revision date.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              For privacy questions or concerns, contact us at: <a href="mailto:privacy@powerscouts.com" className="text-[#0A5C8C]">privacy@powerscouts.com</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}