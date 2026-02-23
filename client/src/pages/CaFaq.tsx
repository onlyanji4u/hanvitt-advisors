import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronDown, Building2, User, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/hooks/use-language";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface FaqItem {
  question: string;
  answer: string;
  category: "retail" | "business";
}

function FaqAccordion({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
      data-testid={`faq-item-${index}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
        data-testid={`button-faq-toggle-${index}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className={`flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold ${item.category === 'retail' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {item.category === 'retail' ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }} data-testid={`text-faq-question-${index}`}>{item.question}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>
      <div
        className="grid transition-all duration-200"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', visibility: open ? 'visible' : 'hidden' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }} data-testid={`text-faq-answer-${index}`}>
            {item.answer}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CaFaq() {
  const { t } = useLanguage();
  const { caTaxEnabled, isLoading: settingsLoading } = useSiteSettings();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "retail" | "business">("all");

  useEffect(() => {
    if (!settingsLoading && !caTaxEnabled) {
      navigate("/");
    }
  }, [caTaxEnabled, settingsLoading, navigate]);

  const faqs: FaqItem[] = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1'),
      category: "retail",
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2'),
      category: "retail",
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3'),
      category: "retail",
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4'),
      category: "retail",
    },
    {
      question: t('faq.q5'),
      answer: t('faq.a5'),
      category: "retail",
    },
    {
      question: t('faq.q6'),
      answer: t('faq.a6'),
      category: "business",
    },
    {
      question: t('faq.q7'),
      answer: t('faq.a7'),
      category: "business",
    },
    {
      question: t('faq.q8'),
      answer: t('faq.a8'),
      category: "business",
    },
    {
      question: t('faq.q9'),
      answer: t('faq.a9'),
      category: "business",
    },
    {
      question: t('faq.q10'),
      answer: t('faq.a10'),
      category: "business",
    },
    {
      question: t('faq.q11'),
      answer: t('faq.a11'),
      category: "retail",
    },
    {
      question: t('faq.q12'),
      answer: t('faq.a12'),
      category: "retail",
    },
    {
      question: t('faq.q13'),
      answer: t('faq.a13'),
      category: "retail",
    },
    {
      question: t('faq.q14'),
      answer: t('faq.a14'),
      category: "retail",
    },
    {
      question: t('faq.q15'),
      answer: t('faq.a15'),
      category: "retail",
    },
    {
      question: t('faq.q16'),
      answer: t('faq.a16'),
      category: "business",
    },
    {
      question: t('faq.q17'),
      answer: t('faq.a17'),
      category: "business",
    },
    {
      question: t('faq.q18'),
      answer: t('faq.a18'),
      category: "business",
    },
    {
      question: t('faq.q19'),
      answer: t('faq.a19'),
      category: "business",
    },
    {
      question: t('faq.q20'),
      answer: t('faq.a20'),
      category: "business",
    },
  ];

  const filtered = filter === "all" ? faqs : faqs.filter(f => f.category === filter);

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-5" data-testid="text-faq-badge">
              <HelpCircle className="h-3.5 w-3.5" />
              {t('faq.badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }} data-testid="text-faq-title">
              {t('faq.title')}
            </h1>
            <p className="text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }} data-testid="text-faq-subtitle">
              {t('faq.subtitle')}
            </p>
          </motion.div>

          <div className="flex justify-center gap-2 mb-8">
            {(["all", "retail", "business"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${filter === f ? "bg-[#D4AF37] text-black" : ""}`}
                style={filter !== f ? { color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' } : {}}
                data-testid={`faq-filter-${f}`}
              >
                {f === "all" ? t('faq.filterAll') : f === "retail" ? t('faq.filterRetail') : t('faq.filterBusiness')}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((item, i) => (
              <FaqAccordion key={item.question} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}