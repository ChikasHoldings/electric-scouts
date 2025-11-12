import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
            Trusted Electricity Providers
          </h2>
          <p className="text-lg text-gray-700">
            Top energy providers that deliver a variety of simple and clear electricity plans.
          </p>
        </div>

        {/* Provider Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {providerLogos.map((provider, index) => (
            <Link
              key={index}
              to={createPageUrl("ProviderDetails") + `?provider=${provider.name}`}
              className="group"
            >
              <div className="bg-white rounded-lg p-6 h-24 flex items-center justify-center hover:shadow-lg transition-all duration-300">
                <img
                  src={provider.url}
                  alt={provider.name}
                  className="max-h-12 max-w-full object-contain filter grayscale hover:grayscale-0 transition-all"
                  onError={(e) => {
                    e.target.outerHTML = `<div class="text-sm font-semibold text-gray-400">${provider.name.substring(0, 3)}</div>`;
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}