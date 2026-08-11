import { motion } from "framer-motion";

export default function ProvidersSection() {
  const topProviders = [
    { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id7uehjyso_1762886832466.png", alt: "TXU Energy" },
    { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idvo6_xjiy_logos.png", alt: "Constellation Energy" },
    { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/id6k09mhoa_1762886791027.png", alt: "Rhythm Energy" },
    { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idabzcudlc_1762848446410.png", alt: "Champion Energy" },
    { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idek1ddtu1_logos.png", alt: "Chariot Energy" },
    { src: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/logos/providers/idct-olpyu_1762886748078.png", alt: "Gexa Energy" },
  ];

  return (
    <section className="bg-slate-50 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-xs sm:text-base text-gray-500 font-medium mb-4 sm:mb-8"
        >
          Trusted by 50,000+ households — powered by top providers
        </motion.p>
        
        {/* Desktop: grid layout */}
        <div className="hidden sm:grid sm:grid-cols-6 gap-6 lg:gap-10 items-center justify-items-center">
          {topProviders.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-center w-full"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-10 lg:h-12 w-auto max-w-[120px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                loading="lazy"
                width="120"
                height="48"
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile: horizontal scroll strip */}
        <div className="sm:hidden flex items-center gap-8 overflow-x-auto scrollbar-hide px-2 pb-1">
          {topProviders.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 flex items-center justify-center"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-7 w-auto max-w-[100px] object-contain opacity-60"
                loading="lazy"
                width="100"
                height="28"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
