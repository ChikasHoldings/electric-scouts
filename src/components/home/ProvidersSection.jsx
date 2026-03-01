import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

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
            We Work With the Providers. You Get the Savings.
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg px-4 max-w-2xl mx-auto">
            Negotiated rates from 40+ licensed electricity providers across 12 deregulated states — rates you won't find on their websites.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-8 items-center opacity-70 hover:opacity-100 transition-opacity duration-300">
          {[
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id3-oid0b2_1762848198226.png", alt: "4Change Energy - Texas Electricity Provider" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idy5qy7kto_1762848313421.png", alt: "APG&E - Affordable Electricity Plans" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idecuvstjb_logos.png", alt: "BKV Energy - Natural Gas Backed Electricity Provider" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idabzcudlc_1762848446410.png", alt: "Champion Energy - Leading Electricity Provider" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idek1ddtu1_logos.png", alt: "Chariot Energy - 100% Renewable Electricity Provider" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idvo6_xjiy_logos.png", alt: "Constellation Energy - Nationwide Electricity Supplier" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idt9p2rc1n_1762848661994.png", alt: "Ambit Energy - Multi-State Electricity Provider" }].
          map((logo, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-center h-14 sm:h-16 lg:h-20 px-2 ${index === 6 ? 'col-span-2 sm:col-span-1' : ''}`}>

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
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idy542ofcd_logos.png", alt: "Express Energy - Low Fixed Rate Plans" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/screenshot46.png", alt: "Discount Power - Affordable Electricity Plans" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idct-olpyu_1762886748078.png", alt: "Gexa Energy - Green Energy Options" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id6k09mhoa_1762886791027.png", alt: "Rhythm Energy - Smart Electricity Plans" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id7uehjyso_1762886832466.png", alt: "TXU Energy - Texas Largest Electricity Provider" }].
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
