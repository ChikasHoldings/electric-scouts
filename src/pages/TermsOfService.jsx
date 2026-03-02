import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, FileText, AlertTriangle, Users, Globe, Shield, Gavel, Mail, BookOpen, RefreshCw } from "lucide-react";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";

export default function TermsOfService() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Terms of Service", url: "/terms-of-service" }
  ]);

  const sections = [
    {
      icon: BookOpen,
      color: "blue",
      title: "1. Acceptance of Terms",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            By accessing, browsing, or using the Electric Scouts website and services (collectively, the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and Electric Scouts, operated by Chikas Holdings LLC.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm font-medium">
              If you do not agree to these Terms, you must discontinue use of the Service immediately. Your continued use of Electric Scouts after any modifications to these Terms constitutes acceptance of the updated Terms.
            </p>
          </div>
        </>
      )
    },
    {
      icon: FileText,
      color: "green",
      title: "2. Service Description",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Electric Scouts is a free electricity rate comparison platform that enables users to compare electricity plans from multiple providers across deregulated energy markets in the United States.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">What We Provide</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>Electricity rate comparisons by ZIP code</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>Plan details including rates, terms, and features</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>Bill analysis and savings estimates</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>Educational content about electricity markets</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>Direct links to provider enrollment pages</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">What We Are Not</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>We are not an electricity provider or utility company</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>We do not supply electricity directly to consumers</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>We do not guarantee specific rates or savings</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>We are not a licensed energy broker or agent</li>
                <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>We do not process electricity payments</li>
              </ul>
            </div>
          </div>
        </>
      )
    },
    {
      icon: AlertTriangle,
      color: "orange",
      title: "3. Accuracy of Information & Disclaimer",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            While Electric Scouts strives to provide accurate, current, and comprehensive information, electricity rates, plan details, provider availability, and market conditions are subject to change without notice. All information displayed on our platform is for comparison and informational purposes only.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
            <p className="text-orange-900 text-sm font-medium mb-2">Important Disclaimers:</p>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Rates shown may not reflect real-time pricing and are subject to provider confirmation.</li>
              <li>• Savings estimates are based on average usage patterns and may vary significantly for individual users.</li>
              <li>• Plan availability depends on your location, credit history, and provider requirements.</li>
              <li>• Users should verify all plan details, terms, and conditions directly with the electricity provider before enrollment.</li>
            </ul>
          </div>
          <p className="text-gray-600 text-sm">
            Electric Scouts does not guarantee the accuracy, completeness, or timeliness of any information on the platform. We are not responsible for errors, omissions, or outdated information provided by third-party electricity providers.
          </p>
        </>
      )
    },
    {
      icon: Scale,
      color: "red",
      title: "4. No Guarantee of Savings",
      content: (
        <p className="text-gray-600">
          Savings estimates, rate comparisons, and cost projections displayed on Electric Scouts are illustrative and based on general assumptions about average electricity usage, current market rates, and standard plan terms. Actual savings will vary based on your individual electricity consumption, location, chosen plan, credit score, seasonal usage patterns, and other factors. Electric Scouts expressly disclaims any guarantee of specific savings amounts. Past savings reported by other users do not guarantee future results. You are solely responsible for evaluating whether a particular electricity plan meets your needs.
        </p>
      )
    },
    {
      icon: Users,
      color: "purple",
      title: "5. User Responsibilities",
      content: (
        <>
          <p className="text-gray-600 mb-4">By using Electric Scouts, you agree to the following responsibilities:</p>
          <div className="space-y-3">
            {[
              { title: "Accurate Information", desc: "Provide truthful and accurate information (ZIP code, usage data) for comparisons. Inaccurate information may lead to misleading results." },
              { title: "Independent Verification", desc: "Verify all plan details, rates, terms, early termination fees, and conditions directly with the electricity provider before enrolling." },
              { title: "Contract Awareness", desc: "Understand your current electricity contract terms, including any early termination fees or penalties, before switching providers." },
              { title: "Lawful Use", desc: "Use the Service only for lawful purposes. You may not use Electric Scouts to engage in fraudulent, deceptive, or harmful activities." },
              { title: "Account Security", desc: "If you create an account, you are responsible for maintaining the confidentiality of your login credentials and all activities under your account." },
              { title: "Respectful Conduct", desc: "Refrain from attempting to disrupt, overload, or interfere with the proper functioning of the Service." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{item.title}:</span>
                  <span className="text-gray-600 ml-1 text-sm">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )
    },
    {
      icon: Shield,
      color: "teal",
      title: "6. Intellectual Property",
      content: (
        <p className="text-gray-600">
          All content, materials, logos, trademarks, service marks, trade names, graphics, user interfaces, visual designs, software, and code on the Electric Scouts platform are the exclusive property of Electric Scouts (Chikas Holdings LLC) or its licensors and are protected by United States and international copyright, trademark, and intellectual property laws. You may not reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit any content from Electric Scouts without prior written permission. Limited, non-commercial use of our content is permitted for personal reference only, provided proper attribution is given.
        </p>
      )
    },
    {
      icon: Globe,
      color: "blue",
      title: "7. Third-Party Links & Affiliate Relationships",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            Electric Scouts contains links to third-party electricity provider websites and enrollment pages. When you click on a provider link or "Get This Plan" button, you will be redirected to the provider's website, which is governed by that provider's own terms and privacy policy.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm mb-2 font-medium">Affiliate Disclosure:</p>
            <p className="text-blue-800 text-sm">
              Electric Scouts may earn a commission or referral fee when you sign up for an electricity plan through our platform. This compensation does not affect the rates you pay — you receive the same rate as if you enrolled directly with the provider. Our comparison results are presented objectively and are not influenced by affiliate relationships.
            </p>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            We are not responsible for the content, accuracy, privacy practices, or terms of any third-party websites. Your interactions with electricity providers are solely between you and the provider.
          </p>
        </>
      )
    },
    {
      icon: AlertTriangle,
      color: "red",
      title: "8. Limitation of Liability",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            To the fullest extent permitted by applicable law, Electric Scouts (including its officers, directors, employees, agents, and affiliates) shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to:
          </p>
          <ul className="text-gray-600 space-y-2 mb-3">
            <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Your use of or inability to use the Service</li>
            <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Reliance on rate information, savings estimates, or plan recommendations</li>
            <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Actions or omissions of third-party electricity providers</li>
            <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Unauthorized access to or alteration of your data</li>
            <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Any errors, inaccuracies, or omissions in the content</li>
          </ul>
          <p className="text-gray-600 text-sm">
            In no event shall Electric Scouts' total liability exceed the amount you paid to use the Service (which is zero, as our Service is free). This limitation applies regardless of the legal theory under which liability is asserted.
          </p>
        </>
      )
    },
    {
      icon: Shield,
      color: "orange",
      title: "9. Indemnification",
      content: (
        <p className="text-gray-600">
          You agree to indemnify, defend, and hold harmless Electric Scouts, Chikas Holdings LLC, and their respective officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any content or information you submit through the Service.
        </p>
      )
    },
    {
      icon: RefreshCw,
      color: "green",
      title: "10. Changes to Terms",
      content: (
        <p className="text-gray-600">
          Electric Scouts reserves the right to modify, update, or replace these Terms of Service at any time at our sole discretion. Material changes will be indicated by updating the "Last Updated" date at the top of this page. We encourage you to review these Terms periodically. Your continued use of the Service following the posting of any changes constitutes your binding acceptance of the modified Terms. If you do not agree to the updated Terms, you must stop using the Service.
        </p>
      )
    },
    {
      icon: Gavel,
      color: "purple",
      title: "11. Governing Law & Dispute Resolution",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            These Terms of Service shall be governed by and construed in accordance with the laws of the State of Texas, United States of America, without regard to its conflict of law provisions.
          </p>
          <p className="text-gray-600">
            Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, the dispute shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, conducted in Dallas, Texas. You agree to waive any right to a jury trial or to participate in a class action lawsuit.
          </p>
        </>
      )
    },
    {
      icon: Mail,
      color: "blue",
      title: "12. Contact Information",
      content: (
        <div className="bg-blue-50 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold text-gray-900">Email:</span> <a href="mailto:legal@electricscouts.com" className="text-[#0A5C8C] hover:underline">legal@electricscouts.com</a></p>
            <p><span className="font-semibold text-gray-900">Company:</span> Electric Scouts (operated by Chikas Holdings LLC)</p>
            <p><span className="font-semibold text-gray-900">Jurisdiction:</span> State of Texas, United States of America</p>
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
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Terms of Service - Electric Scouts | User Agreement & Guidelines"
        description="Electric Scouts terms of service and user agreement. Understand your rights, responsibilities, and legal terms when using our free electricity rate comparison platform."
        keywords="terms of service, user agreement, electricity comparison terms, service guidelines, legal terms"
        canonical="/terms-of-service"
        structuredData={breadcrumbData}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Terms of Service" }
            ]}
            variant="light"
            className="mb-3"
          />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
            </div>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Please read these terms carefully before using Electric Scouts. By using our platform, you agree to be bound by these terms.
          </p>
          <p className="text-blue-200 text-sm mt-3">Last updated: February 26, 2026</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-3">Table of Contents</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section, i) => (
                <a key={i} href={`#section-${i}`} className="text-sm text-[#0A5C8C] hover:underline hover:text-[#084a6f] transition-colors">
                  {section.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {sections.map((section, i) => (
          <Card key={i} id={`section-${i}`} className="overflow-hidden hover:shadow-md transition-shadow">
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
