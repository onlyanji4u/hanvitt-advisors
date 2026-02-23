import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FileText, Calculator, Shield, IndianRupee, ArrowRight, Tag, Sparkles } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/hooks/use-language";
import { useSiteSettings } from "@/hooks/use-site-settings";
import type { CaService, CrossSellOffer } from "@shared/schema";

const categoryIcons: Record<string, typeof FileText> = {
  "ITR Filing": FileText,
  "GST": Calculator,
  "Audit": Shield,
  "Advisory": Sparkles,
};

export default function CaServices() {
  const { t } = useLanguage();
  const { caTaxEnabled, isLoading: settingsLoading } = useSiteSettings();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!settingsLoading && !caTaxEnabled) {
      navigate("/");
    }
  }, [caTaxEnabled, settingsLoading, navigate]);

  const { data: services = [], isLoading: servicesLoading } = useQuery<CaService[]>({
    queryKey: ['/api/public/services'],
  });

  const { data: offers = [] } = useQuery<CrossSellOffer[]>({
    queryKey: ['/api/public/offers'],
  });

  const categoryOrder = ["ITR Filing", "NRI Tax", "GST", "Compliance", "Audit"];
  const categories = [...new Set(services.map(s => s.category))].sort((a, b) => {
    const aIdx = categoryOrder.findIndex(c => a.toLowerCase().includes(c.toLowerCase()));
    const bIdx = categoryOrder.findIndex(c => b.toLowerCase().includes(c.toLowerCase()));
    const aRank = aIdx === -1 ? categoryOrder.length : aIdx;
    const bRank = bIdx === -1 ? categoryOrder.length : bIdx;
    return aRank - bRank;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] mb-6" data-testid="text-ca-badge">
              {t('ca.badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }} data-testid="text-ca-title">
              {t('ca.title')} <span className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] bg-clip-text text-transparent">{t('ca.titleHighlight')}</span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }} data-testid="text-ca-description">
              {t('ca.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="px-4 pb-12" data-testid="section-offers-banner">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex overflow-x-auto gap-4 p-4">
                {offers.map(offer => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 w-80 rounded-xl p-5"
                    style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)' }}
                    data-testid={`card-offer-${offer.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-[#D4AF37]" />
                      <span className="text-xs font-bold text-[#D4AF37] uppercase">{t('ca.specialOffer')}</span>
                    </div>
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }} data-testid={`text-offer-title-${offer.id}`}>{offer.offerTitle}</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{offer.offerDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {offer.offerType === 'free_service' ? 'Free Service' : offer.offerType === 'percentage' ? `${offer.discountValue}% Off` : `₹${offer.discountValue} Off`}
                      </span>
                      {offer.endDate && <span className="text-xs" style={{ color: 'var(--text-muted)' }} data-testid={`text-offer-end-${offer.id}`}>Ends {new Date(offer.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {servicesLoading ? (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }} data-testid="text-loading">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }} data-testid="section-empty-services">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-[#D4AF37]" />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('ca.comingSoon')}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{t('ca.comingSoonDesc')}</p>
              <Link href="/contact" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold text-sm" data-testid="link-contact-ca">
                {t('ca.contactUs')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              {categories.map(category => {
                const Icon = categoryIcons[category] || FileText;
                const categoryServices = services.filter(s => s.category === category);
                return (
                  <div key={category} className="mb-12" data-testid={`section-category-${category}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid={`text-category-${category}`}>{category}</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryServices.map((service, i) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-2xl p-6 group hover:shadow-lg hover:shadow-[#D4AF37]/5 transition-all"
                          style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
                          data-testid={`card-service-${service.id}`}
                        >
                          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }} data-testid={`text-service-name-${service.id}`}>{service.serviceName}</h3>
                          <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--text-muted)' }}>{service.description}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4 text-[#D4AF37]" />
                                <span className="text-xl font-bold text-[#D4AF37]" data-testid={`text-service-price-${service.id}`}>{Number(service.priceMin).toLocaleString('en-IN')}{service.priceMax ? ` – ₹${Number(service.priceMax).toLocaleString('en-IN')}` : ''}</span>
                              </div>
                              {service.frequency && <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-muted)' }} data-testid={`text-service-frequency-${service.id}`}>{service.frequency}</span>}
                            </div>
                            <Link href="/contact" onClick={() => { sessionStorage.setItem("ca_enquiry", JSON.stringify({ interest: "ca_tax_advisory", serviceName: service.serviceName, category: service.category, description: service.description, frequency: service.frequency || "" })); }} className="text-sm font-medium flex items-center gap-1 text-[#D4AF37] group-hover:gap-2 transition-all" data-testid={`link-enquire-${service.id}`}>
                              {t('ca.enquire')} <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
