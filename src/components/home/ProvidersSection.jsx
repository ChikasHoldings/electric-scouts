import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

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
{ name: "Veteran Energy", url: "https://www.powerwizard.com/wp-content/uploads/2025/05/veteran-energy.png" }];


export default function ProvidersSection() {
  return (
    <section className="bg-slate-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-10 lg:mb-12">

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#084a6f] mb-2 sm:mb-3 px-4">
            Exclusive Provider Discounts
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg px-4 max-w-2xl mx-auto">
            Compare discounted rates from America's most trusted electricity companies
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-8 items-center opacity-70 hover:opacity-100 transition-opacity duration-300">
          {[
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/8818da2fa_id3-OId0b2_1762848198226.png", alt: "4Change Energy - Texas Electricity Provider with Competitive Fixed and Variable Rate Plans" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/b8f3a8167_idy5Qy7KTo_1762848313421.png", alt: "APG&E - Affordable Electricity Plans for Texas Residents" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/49ae44b66_idecUVsTjb_logos.png", alt: "BKV Energy - Natural Gas Backed Electricity Provider Serving Texas" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/c2f973518_idabZcuDLC_1762848446410.png", alt: "Champion Energy - Leading Texas Electricity Provider with Fixed and Renewable Plans" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/315800ea4_idEK1dDtu1_logos.png", alt: "Chariot Energy - 100% Renewable Electricity Provider for Texas Homes" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/f5dbabf5e_idvO6_xjIY_logos.png", alt: "Constellation Energy - Nationwide Electricity Supplier Serving Residential and Commercial Customers" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/df51b99dd_idT9p2RC1n_1762848661994.png", alt: "Ambit Energy - Multi-State Electricity Provider with Competitive Rates" }].
          map((logo, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-center h-14 sm:h-16 lg:h-20 px-2">

              <img
              src={logo.src}
              alt={logo.alt}
              className="h-8 sm:h-10 lg:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
              loading="lazy" />

            </motion.div>
          )}
        </div>
        
        {/* Row 2 - Centered */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-4 sm:mt-8 opacity-70 hover:opacity-100 transition-opacity duration-300">
          {[
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/05c459c06_idy542OFcd_logos.png", alt: "Express Energy - Texas Electricity Provider Offering Low Fixed Rate Plans" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/9cb91c2f7_Screenshot46.png", alt: "Discount Power - Affordable Electricity Plans for Texas Homes and Businesses" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/c916d021e_idcT-olPyu_1762886748078.png", alt: "Gexa Energy - Texas Retail Electricity Provider with Green Energy Options" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/ff1558170_id6k09mhoA_1762886791027.png", alt: "Rhythm Energy - Smart Electricity Plans with Renewable Energy for Texas" },
          { src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6912db884ed8189895990617/2c7ef2a13_id7UEhjySO_1762886832466.png", alt: "TXU Energy - Texas Largest Electricity Provider with Fixed and Variable Rate Plans" }].
          map((logo, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (index + 7) * 0.05 }}
            className="flex items-center justify-center h-14 sm:h-16 lg:h-20 w-20 sm:w-28 lg:w-32 px-2">

              <img
              src={logo.src}
              alt={logo.alt}
              className="h-8 sm:h-10 lg:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
              loading="lazy" />

            </motion.div>
          )}
        </div>
      </div>
    </section>);

}