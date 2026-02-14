import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse, ShieldCheck, TrendingUp, AlertTriangle, Users, IndianRupee, BarChart3, Lightbulb, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Info() {
  const { t } = useLanguage();

  const healthFacts = [
    { key: 'info.health.fact1', icon: TrendingUp },
    { key: 'info.health.fact2', icon: IndianRupee },
    { key: 'info.health.fact3', icon: Users },
    { key: 'info.health.fact4', icon: AlertTriangle },
    { key: 'info.health.fact5', icon: BarChart3 },
  ];

  const termFacts = [
    { key: 'info.term.fact1', icon: Users },
    { key: 'info.term.fact2', icon: IndianRupee },
    { key: 'info.term.fact3', icon: TrendingUp },
    { key: 'info.term.fact4', icon: AlertTriangle },
    { key: 'info.term.fact5', icon: BarChart3 },
  ];

  const healthScenarios = [
    { key: 'scenario1', title: 'info.health.scenario1.title', desc: 'info.health.scenario1.desc' },
    { key: 'scenario2', title: 'info.health.scenario2.title', desc: 'info.health.scenario2.desc' },
    { key: 'scenario3', title: 'info.health.scenario3.title', desc: 'info.health.scenario3.desc' },
  ];

  const termScenarios = [
    { key: 'scenario1', title: 'info.term.scenario1.title', desc: 'info.term.scenario1.desc' },
    { key: 'scenario2', title: 'info.term.scenario2.title', desc: 'info.term.scenario2.desc' },
    { key: 'scenario3', title: 'info.term.scenario3.title', desc: 'info.term.scenario3.desc' },
  ];

  const irdaiMetrics = [
    { key: 'info.irdai.metric1.value', label: 'info.irdai.metric1.label', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'info.irdai.metric2.value', label: 'info.irdai.metric2.label', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'info.irdai.metric3.value', label: 'info.irdai.metric3.label', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { key: 'info.irdai.metric4.value', label: 'info.irdai.metric4.label', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { key: 'info.irdai.metric5.value', label: 'info.irdai.metric5.label', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { key: 'info.irdai.metric6.value', label: 'info.irdai.metric6.label', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="py-8 sm:py-10 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BookOpen className="h-6 w-6 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="text-info-title">{t('info.title')}</h1>
          </div>
          <p className="max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{t('info.desc')}</p>
        </div>
      </section>

      <section className="py-8 sm:py-12 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="irdai-metrics-grid">
            {irdaiMetrics.map((metric, idx) => (
              <div key={idx} className={`p-4 rounded-xl ${metric.bg}`} style={{ borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }} data-testid={`metric-${idx}`}>
                <p className={`text-2xl sm:text-3xl font-bold ${metric.color}`}>{t(metric.key)}</p>
                <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{t(metric.label)}</p>
              </div>
            ))}
          </div>

          <Card style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }} className="shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <HeartPulse className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>{t('info.health.title')}</CardTitle>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('info.health.subtitle')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.whatIs')}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('info.health.what')}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.keyFacts')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {healthFacts.map((fact, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div className="p-1.5 rounded-md bg-emerald-500/10 flex-shrink-0">
                        <fact.icon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t(fact.key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.health.floaterTitle')}</p>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('info.health.floaterDesc')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.realLifeExamples')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {healthScenarios.map((scenario) => (
                    <div key={scenario.key} className="p-4 rounded-xl space-y-2" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-[#D4AF37]" />
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t(scenario.title)}</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{t(scenario.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }} className="shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>{t('info.term.title')}</CardTitle>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('info.term.subtitle')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.whatIs')}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('info.term.what')}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.keyFacts')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {termFacts.map((fact, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div className="p-1.5 rounded-md bg-blue-500/10 flex-shrink-0">
                        <fact.icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t(fact.key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.term.hlvTitle')}</p>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('info.term.hlvDesc')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('info.realLifeExamples')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {termScenarios.map((scenario) => (
                    <div key={scenario.key} className="p-4 rounded-xl space-y-2" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-[#D4AF37]" />
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t(scenario.title)}</p>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{t(scenario.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }} className="shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#D4AF37]/10">
                  <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('info.irdai.title')}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('info.irdai.about')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <span className="text-[#D4AF37] font-bold mt-0.5">*</span>
                      <span>{t(`info.irdai.point${i}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center py-4">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{t('info.cta')}</p>
            <Link href="/fin-score">
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold px-8" data-testid="button-goto-finscore">{t('info.ctaButton')}</Button>
            </Link>
          </div>
        </div>
      </section>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
