import React from "react";
import { motion } from "framer-motion";

export default function ProvidersSection() {
  return (
    <section className="bg-slate-50 py-6 sm:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#084a6f] mb-1.5 px-4">
            We Work With the Providers. You Get the Savings.
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm px-4 max-w-xl mx-auto">
            Negotiated rates from 40+ licensed providers across 12 deregulated states — rates you won't find on their websites.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-5 items-center opacity-70 hover:opacity-100 transition-opacity duration-300">
          {[
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id3-oid0b2_1762848198226.png", alt: "4Change Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idy5qy7kto_1762848313421.png", alt: "APG&E" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idecuvstjb_logos.png", alt: "BKV Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idabzcudlc_1762848446410.png", alt: "Champion Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idek1ddtu1_logos.png", alt: "Chariot Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idvo6_xjiy_logos.png", alt: "Constellation Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idt9p2rc1n_1762848661994.png", alt: "Ambit Energy" }].
          map((logo, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            className={`flex items-center justify-center h-10 sm:h-12 lg:h-14 px-2 ${index === 6 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <img
              src={logo.src}
              alt={logo.alt}
              className="h-6 sm:h-8 lg:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
              loading="lazy" />
            </motion.div>
          )}
        </div>
        
        {/* Row 2 */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-3 sm:mt-5 opacity-70 hover:opacity-100 transition-opacity duration-300">
          {[
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idy542ofcd_logos.png", alt: "Express Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/screenshot46.png", alt: "Discount Power" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idct-olpyu_1762886748078.png", alt: "Gexa Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id6k09mhoa_1762886791027.png", alt: "Rhythm Energy" },
          { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id7uehjyso_1762886832466.png", alt: "TXU Energy" }].
          map((logo, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (index + 7) * 0.04 }}
            className="flex items-center justify-center h-10 sm:h-12 lg:h-14 w-16 sm:w-24 lg:w-28 px-2">
              <img
              src={logo.src}
              alt={logo.alt}
              className="h-6 sm:h-8 lg:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
              loading="lazy" />
            </motion.div>
          )}
        </div>
      </div>
    </section>);
}
