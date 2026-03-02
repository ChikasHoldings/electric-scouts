import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Lock, UserCheck, Cookie, Bell, Mail, FileText } from "lucide-react";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";

export default function PrivacyPolicy() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Privacy Policy", url: "/privacy-policy" }
  ]);

  const sections = [
    {
      icon: Eye,
      color: "blue",
      title: "1. Information We Collect",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Electric Scouts collects only the information necessary to provide you with accurate electricity rate comparisons and a personalized experience. We are committed to minimizing data collection to what is essential for our service.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Information You Provide</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>ZIP code for rate comparison</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Estimated monthly electricity usage (kWh)</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Email address (only if you choose to receive results)</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Property type (residential, business)</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Electricity bill details (only if you use our Bill Analyzer)</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Automatically Collected</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>Browser type and version</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>Device type and operating system</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>IP address (anonymized for analytics)</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>Pages visited and time spent on site</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>Referral source (how you found us)</li>
              </ul>
            </div>
          </div>
        </>
      )
    },
    {
      icon: FileText,
      color: "green",
      title: "2. How We Use Your Information",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Your information is used solely to deliver and improve our electricity comparison service. We never use your data for purposes unrelated to helping you find better electricity rates.
          </p>
          <div className="space-y-3">
            {[
              { purpose: "Rate Comparison", desc: "To provide accurate electricity rate comparisons tailored to your location and usage patterns." },
              { purpose: "Plan Matching", desc: "To match you with electricity plans that best fit your needs, preferences, and budget." },
              { purpose: "Email Communications", desc: "To send you comparison results, rate alerts, and savings opportunities — only if you opt in." },
              { purpose: "Service Improvement", desc: "To analyze usage patterns and improve our comparison algorithms, user experience, and content." },
              { purpose: "Customer Support", desc: "To respond to your inquiries, feedback, and requests for assistance." },
              { purpose: "Fraud Prevention", desc: "To detect and prevent fraudulent activity, abuse, or unauthorized access to our platform." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-semibold text-gray-900">{item.purpose}:</span>
                  <span className="text-gray-600 ml-1">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )
    },
    {
      icon: Shield,
      color: "purple",
      title: "3. Information Sharing & Disclosure",
      content: (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-900 font-semibold text-lg mb-1">We do not sell your personal information.</p>
            <p className="text-purple-700 text-sm">Electric Scouts will never sell, rent, or trade your personal data to third parties for their marketing purposes.</p>
          </div>
          <p className="text-gray-600 mb-3">We may share limited information in the following circumstances:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">Electricity Providers:</span> When you click "Get This Plan" or request plan details, we share your ZIP code and usage information with the selected provider to facilitate enrollment.</li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">Service Partners:</span> We work with trusted partners for email delivery, analytics, and hosting. These partners are contractually bound to protect your data.</li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">Legal Requirements:</span> We may disclose information when required by law, court order, or government regulation, or to protect the rights and safety of Electric Scouts and its users.</li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">Business Transfers:</span> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</li>
          </ul>
        </>
      )
    },
    {
      icon: Lock,
      color: "orange",
      title: "4. Data Security",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            We take the security of your information seriously and implement multiple layers of protection to safeguard your data.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: "Encryption", desc: "All data transmitted between your browser and our servers is encrypted using TLS/SSL (HTTPS) protocols." },
              { title: "Secure Storage", desc: "Personal data is stored in encrypted databases with strict access controls and regular security audits." },
              { title: "Access Controls", desc: "Only authorized personnel with a legitimate business need can access personal information, under strict confidentiality obligations." }
            ].map((item, i) => (
              <div key={i} className="bg-orange-50 rounded-lg p-4 text-center">
                <Lock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )
    },
    {
      icon: UserCheck,
      color: "teal",
      title: "5. Your Rights & Choices",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            You have full control over your personal information. Electric Scouts respects your privacy rights and makes it easy to exercise them.
          </p>
          <div className="space-y-3">
            {[
              { right: "Access", desc: "Request a copy of the personal information we hold about you." },
              { right: "Correction", desc: "Request correction of any inaccurate or incomplete personal data." },
              { right: "Deletion", desc: "Request deletion of your personal information from our systems." },
              { right: "Opt-Out", desc: "Unsubscribe from marketing emails at any time using the link in every email." },
              { right: "Data Portability", desc: "Request your data in a commonly used, machine-readable format." },
              { right: "Restrict Processing", desc: "Request that we limit how we use your personal information." }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{item.right}:</span>
                  <span className="text-gray-600 ml-1 text-sm">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            To exercise any of these rights, please contact us at <a href="mailto:privacy@electricscouts.com" className="text-[#0A5C8C] hover:underline">privacy@electricscouts.com</a>. We will respond within 30 days.
          </p>
        </>
      )
    },
    {
      icon: Cookie,
      color: "yellow",
      title: "6. Cookies & Tracking Technologies",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            We use cookies and similar technologies to enhance your browsing experience and analyze site performance.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Cookie Type</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Purpose</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Duration</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b"><td className="p-3 font-medium">Essential</td><td className="p-3">Required for site functionality (e.g., session management)</td><td className="p-3">Session</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Analytics</td><td className="p-3">Help us understand how visitors use our site</td><td className="p-3">Up to 2 years</td></tr>
                <tr className="border-b"><td className="p-3 font-medium">Preferences</td><td className="p-3">Remember your settings (e.g., ZIP code, usage preferences)</td><td className="p-3">1 year</td></tr>
                <tr><td className="p-3 font-medium">Marketing</td><td className="p-3">Used to deliver relevant content and measure campaign effectiveness</td><td className="p-3">Up to 1 year</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            You can manage cookie preferences through your browser settings. Disabling certain cookies may affect site functionality.
          </p>
        </>
      )
    },
    {
      icon: Bell,
      color: "red",
      title: "7. Changes to This Policy",
      content: (
        <p className="text-gray-600">
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will notify you by posting the updated policy on this page with a revised "Last Updated" date. We encourage you to review this policy periodically. Your continued use of Electric Scouts after any changes constitutes your acceptance of the updated Privacy Policy.
        </p>
      )
    },
    {
      icon: Mail,
      color: "blue",
      title: "8. Contact Us",
      content: (
        <div className="bg-blue-50 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please do not hesitate to reach out.
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold text-gray-900">Email:</span> <a href="mailto:privacy@electricscouts.com" className="text-[#0A5C8C] hover:underline">privacy@electricscouts.com</a></p>
            <p><span className="font-semibold text-gray-900">Company:</span> Electric Scouts (operated by Chikas Holdings LLC)</p>
            <p><span className="font-semibold text-gray-900">Response Time:</span> We aim to respond to all privacy-related inquiries within 30 business days.</p>
          </div>
        </div>
      )
    }
  ];

  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    teal: "bg-teal-100 text-teal-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Privacy Policy - Electric Scouts | How We Protect Your Data"
        description="Electric Scouts privacy policy. Learn how we protect your personal information and data when you compare electricity rates. We do not sell your information."
        keywords="privacy policy, data protection, electricity comparison privacy, personal information security"
        canonical="/privacy-policy"
        structuredData={breadcrumbData}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Privacy Policy" }
            ]}
            variant="light"
            className="mb-3"
          />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
            </div>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Your privacy matters to us. This policy explains how Electric Scouts collects, uses, and protects your personal information.
          </p>
          <p className="text-blue-200 text-sm mt-3">Last updated: February 26, 2026</p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <h2 className="font-bold text-green-900 text-lg mb-2">Privacy at a Glance</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-green-800"><strong>We never sell</strong> your personal information to third parties.</span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-green-800"><strong>Your data is encrypted</strong> in transit and at rest using industry-standard protocols.</span>
              </div>
              <div className="flex items-start gap-2">
                <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-green-800"><strong>You have full control</strong> over your data — access, correct, or delete it anytime.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {sections.map((section, i) => (
          <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[section.color]}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
              {section.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
