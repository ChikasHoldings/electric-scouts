import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap } from "lucide-react";

const providerLogos = [
  { name: "4Change Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/4change-energy.png" },
  { name: "APG&E", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/apge-supplier.png" },
  { name: "BKV Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/bkv-energy.png" },
  { name: "Champion Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/10/logo-champion-energy_bw.png" },
  { name: "Chariot Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/chariot-energy-supplier.png" },
  { name: "Constellation Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/10/logo-constellation-energy_bw.png" },
  { name: "Energy Texas", url: "https://www.powerwizard.com/wp-content/uploads/2025/10/logo-energy-texas_bw.svg" },
  { name: "Express Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/express-energy.png" },
  { name: "Frontier Utilities", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/frontier-utilities.png" },
  { name: "Gexa Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/gexa-energy-supplier.png" },
  { name: "Rhythm Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/rhythm-energy.png" },
  { name: "TriEagle Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/trieagle-energy.png" },
  { name: "TXU Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/tux-energy-supplier.png" },
  { name: "Veteran Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/veteran-energy.png" }
];

export default function ProvidersSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-100 to-transparent rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full px-4 py-2 border border-yellow-100 mb-6">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-600">14+ TRUSTED PARTNERS</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Trusted Electricity{" "}
            <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Providers
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            Top energy providers that deliver a variety of simple and clear electricity plans.
          </p>
        </div>

        {/* Provider Grid with Enhanced Hover Effects */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {providerLogos.map((provider, index) => (
            <Link
              key={index}
              to={createPageUrl("ProviderDetails") + `?provider=${provider.name}`}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
              <div className="relative bg-white rounded-2xl p-6 h-28 flex items-center justify-center shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 group-hover:border-transparent transform group-hover:scale-105">
                <img
                  src={provider.url}
                  alt={provider.name}
                  className="max-h-14 max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  onError={(e) => {
                    e.target.outerHTML = `<div class="text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">${provider.name.substring(0, 3)}</div>`;
                  }}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl px-8 py-4 border border-green-100">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">100% Verified Providers</p>
              <p className="text-xs text-gray-600">All partners are licensed and regulated</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}