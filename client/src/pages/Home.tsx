import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, TrendingUp, Shield, BarChart3, Wallet, Award, Lock, ShieldCheck, Clock, Phone, Calculator, Sparkles, Zap, Target, Eye } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Home() {
  const { t } = useLanguage();

  const tools = [
    { icon: TrendingUp, title: t('nav.savingsLab'), description: t('savings.desc'), link: '/savings-lab', gradient: 'from-blue-500 to-cyan-400' },
    { icon: Wallet, title: t('nav.wealthTracker'), description: t('wealth.desc'), link: '/wealth-tracker', gradient: 'from-orange-500 to-amber-400' },
    { icon: Award, title: t('nav.finScore'), description: t('score.desc'), link: '/fin-score', gradient: 'from-rose-500 to-red-400' },
  ];

  const marqueeTools = [...tools, ...tools];

  const bentoFeatures = [
    { icon: TrendingUp, title: t('showcase.savings.tagline'), desc: t('showcase.savings.desc'), link: '/savings-lab', accent: '#3b82f6' },
    { icon: Wallet, title: t('showcase.wealth.tagline'), desc: t('showcase.wealth.desc'), link: '/wealth-tracker', accent: '#f59e0b' },
    { icon: Award, title: t('showcase.score.tagline'), desc: t('showcase.score.desc'), link: '/fin-score', accent: '#f43f5e' },
  ];

  const securityItems = [
    { icon: Lock, title: t('security.encryption'), desc: t('security.encryption.desc') },
    { icon: Eye, title: t('security.privacy'), desc: t('security.privacy.desc') },
    { icon: ShieldCheck, title: t('security.irdai'), desc: t('security.irdai.desc') },
    { icon: Clock, title: t('security.support'), desc: t('security.support.desc') },
  ];

  const steps = [
    { num: '01', title: t('steps.1.title'), desc: t('steps.1.desc'), icon: Calculator },
    { num: '02', title: t('steps.2.title'), desc: t('steps.2.desc'), icon: Lock },
    { num: '03', title: t('steps.3.title'), desc: t('steps.3.desc'), icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col noise-bg" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="relative py-10 sm:py-14 lg:py-20 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              IRDAI Registered
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 tracking-tight"
            >
              <span style={{ color: 'var(--text-primary)' }}>{t('hero.title')}</span>
              <br />
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#f0d060] to-[#D4AF37] bg-clip-text text-transparent">{t('hero.subtitle')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl mb-6 max-w-2xl leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold text-base sm:text-lg px-8 py-6 h-auto rounded-full shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all" data-testid="button-hero-consultation">
                  {t('hero.cta.consultation')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/savings-lab">
                <Button variant="outline" className="text-base sm:text-lg px-8 py-6 h-auto rounded-full backdrop-blur-sm" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', background: 'var(--glass-bg)' }} data-testid="button-hero-tools">
                  <Zap className="h-5 w-5 mr-2 text-[#D4AF37]" />
                  {t('hero.cta.tools')}
                </Button>
              </Link>
            </motion.div>
          </div>

        </div>
      </section>

      <section className="py-8 overflow-hidden" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--glass-bg)' }}>
        <div className="relative">
          <div className="marquee-track">
            {marqueeTools.map((tool, idx) => (
              <Link key={idx} href={tool.link}>
                <div className="flex-shrink-0 mx-3 px-6 py-4 rounded-xl transition-all cursor-pointer group flex items-center gap-4 min-w-[240px] sm:min-w-[280px]" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${tool.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <tool.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{tool.title}</p>
                    <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8 sm:mb-10">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">Your Tools</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('tools.title')}</h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base" style={{ color: 'var(--text-tertiary)' }}>{t('tools.description')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bentoFeatures.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className=""
              >
                <Link href={item.link}>
                  <div className="h-full p-6 sm:p-8 rounded-2xl transition-all cursor-pointer group relative overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03] blur-2xl" style={{ background: item.accent }} />
                    <div className="relative z-10">
                      <div className="p-2 rounded-lg w-fit mb-4" style={{ background: `${item.accent}15` }}>
                        <item.icon className="h-5 w-5" style={{ color: item.accent }} />
                      </div>
                      <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
                      <span className="flex items-center text-[#D4AF37] font-bold text-sm group-hover:gap-3 gap-2 transition-all" data-testid={`link-tool-${idx}`}>
                        {t('tools.try')}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/[0.02] via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8 sm:mb-10">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">Trust</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('security.title')}</h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base" style={{ color: 'var(--text-tertiary)' }}>{t('security.desc')}</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {securityItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="p-6 rounded-2xl text-center h-full" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <div className="bg-[#D4AF37]/10 p-3 rounded-xl w-fit mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-8 sm:mb-10">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('steps.title')}</h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base" style={{ color: 'var(--text-tertiary)' }}>{t('steps.desc')}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative text-center"
              >
                <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 relative z-10 border border-[#D4AF37]/20">
                  <step.icon className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <p className="text-[#D4AF37]/50 font-bold text-xs tracking-widest mb-2">{step.num}</p>
                <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h4>
                <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/[0.05] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[200px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">Why Us</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{t('why.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
              {[
                { title: t('why.fiduciary.title'), desc: t('why.fiduciary.desc') },
                { title: t('why.strategy.title'), desc: t('why.strategy.desc') },
                { title: t('why.privacy.title'), desc: t('why.privacy.desc') },
              ].map((item, idx) => (
                <div key={idx} className="text-left p-6 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <CheckCircle className="h-5 w-5 text-[#D4AF37] mb-3" />
                  <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black rounded-full px-6 py-5 sm:px-10 sm:py-7 h-auto text-base sm:text-lg font-bold shadow-xl shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all" data-testid="button-cta-bottom">
                <Phone className="h-5 w-5 mr-2" />
                {t('why.cta')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
