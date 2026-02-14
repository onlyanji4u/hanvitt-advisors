import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DOMPurify from "dompurify";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import { ShieldCheck, HeartPulse, Briefcase, Shield } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export default function TheGap() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentAge, setCurrentAge] = React.useState(30);
  const [retirementAge, setRetirementAge] = React.useState(60);
  const [annualExpenses, setAnnualExpenses] = React.useState(500000);

  const [adults, setAdults] = React.useState(2);
  const [kids, setKids] = React.useState(1);
  const [monthlyMedical, setMonthlyMedical] = React.useState(2000);
  const [locationTier, setLocationTier] = React.useState("tier1");
  const [hasPreExisting, setHasPreExisting] = React.useState("no");
  const [plannedSurgery, setPlannedSurgery] = React.useState("none");

  const inflationRate = 0.06;
  const safeWithdrawalRate = 0.04;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const futureAnnualExpenses = annualExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
  const corpusNeeded = futureAnnualExpenses / safeWithdrawalRate;

  const healthMetrics = React.useMemo(() => {
    let baseCover = 500000;
    baseCover += (adults - 1) * 200000;
    baseCover += kids * 150000;

    const surgeryPrices: Record<string, number> = {
      none: 0, angioplasty: 500000, bypass: 800000, knee: 600000,
      maternity: 200000, cataract: 100000, cancer: 2500000
    };

    baseCover = Math.max(baseCover, surgeryPrices[plannedSurgery] || 0);
    if (locationTier === "tier1") baseCover *= 1.5;
    if (locationTier === "tier2") baseCover *= 1.2;
    if (monthlyMedical > 5000) baseCover += 500000;
    if (hasPreExisting === "yes") baseCover *= 1.3;
    baseCover *= Math.pow(1.06, 5);

    let estPremium = (baseCover * 0.003) + (adults * 5000) + (kids * 2000);
    if (hasPreExisting === "yes") estPremium *= 1.4;

    return {
      recommendedCover: Math.ceil(baseCover / 100000) * 100000,
      estimatedPremium: Math.ceil(estPremium / 500) * 500
    };
  }, [adults, kids, locationTier, hasPreExisting, monthlyMedical, plannedSurgery]);

  const handleNumberInput = (setter: (val: number) => void, max: number = 1000000000) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = DOMPurify.sanitize(rawVal);
    const val = parseFloat(sanitized);
    if (!isNaN(val)) {
      setter(Math.min(Math.max(0, val), max));
    } else if (rawVal === "") {
      setter(0);
    }
  };

  const retirementChartData = [{ name: "Corpus Needed", value: corpusNeeded }];

  const tooltipStyle = {
    background: isDark ? '#1a1a24' : '#ffffff',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: isDark ? '#fff' : '#1a2332'
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="py-8 sm:py-10" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('gap.title')}</h1>
          </div>
          <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>{t('gap.desc')}</p>
        </div>
      </section>

      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="retirement" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 p-1 h-auto rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
            <TabsTrigger value="retirement" className="py-4 text-sm font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {t('gap.card.title')}
              </div>
            </TabsTrigger>
            <TabsTrigger value="health" className="py-4 text-sm font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4" />
                {t('health.title')}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="retirement" className="mt-0 focus-visible:ring-0">
            <CalculatorCard
              title={t('gap.card.title')}
              description={t('gap.card.desc')}
              result={
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
                  <div className="relative w-64 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={retirementChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          <Cell fill="#D4AF37" />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{t('gap.targetCorpus')}</span>
                      <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>₹{(corpusNeeded / 10000000).toFixed(2)} Cr</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="p-4 rounded-xl flex flex-col justify-center" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('gap.futureExpenses')}</p>
                      <p className="text-lg sm:text-2xl font-bold break-words" style={{ color: 'var(--text-primary)' }}>₹{Math.round(futureAnnualExpenses).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>{t('gap.inflationAdjusted')} {yearsToRetirement} {t('calc.years')}</p>
                    </div>
                    <div className="bg-[#D4AF37]/10 p-4 rounded-xl border border-[#D4AF37]/20 flex flex-col justify-center">
                      <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-wider mb-1">{t('gap.targetCorpus')}</p>
                      <p className="text-lg sm:text-2xl font-bold text-[#D4AF37] break-words">₹{Math.round(corpusNeeded).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-[#D4AF37]/40 mt-2">{t('gap.safeWithdrawal')}</p>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label style={{ color: 'var(--text-secondary)' }}>{t('gap.ageRange')}</Label>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('gap.currentAge')}: {currentAge} | {t('gap.retireAge')}: {retirementAge}</span>
                  </div>
                  <div className="pt-2">
                    <Label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>{t('gap.currentAge')} ({currentAge})</Label>
                    <Slider min={18} max={90} value={[currentAge]} onValueChange={(val) => { if (val[0] < retirementAge) setCurrentAge(val[0]); }} className="mb-6" />
                    <Label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>{t('gap.retireAge')} ({retirementAge})</Label>
                    <Slider min={30} max={100} value={[retirementAge]} onValueChange={(val) => { if (val[0] > currentAge) setRetirementAge(val[0]); }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenses" style={{ color: 'var(--text-secondary)' }}>{t('gap.annualExpenses')} (₹)</Label>
                  <Input id="expenses" type="number" value={annualExpenses} onChange={handleNumberInput(setAnnualExpenses, 100000000)} className="font-mono text-lg" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} max={100000000} />
                  <div className="flex justify-between items-center">
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('calc.max')}: ₹10 Cr</p>
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{t('gap.lifestyleDesc')}</p>
                  </div>
                </div>
              </div>
            </CalculatorCard>
          </TabsContent>

          <TabsContent value="health" className="mt-0 focus-visible:ring-0">
            <CalculatorCard
              title={t('health.title')}
              description={t('health.desc')}
              result={
                <div className="h-full flex flex-col justify-center p-6 space-y-8">
                  <div className="text-center p-8 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                    <HeartPulse className="h-12 w-12 text-[#D4AF37] mx-auto mb-4" />
                    <p className="font-medium mb-1 uppercase tracking-wider text-xs" style={{ color: 'var(--text-muted)' }}>{t('health.recommended')}</p>
                    <h3 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>₹{healthMetrics.recommendedCover.toLocaleString('en-IN')}</h3>
                  </div>
                  <div className="bg-[#D4AF37]/10 p-6 rounded-xl border border-[#D4AF37]/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('health.premium')}</span>
                      <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <p className="text-3xl font-bold text-[#D4AF37]">₹{healthMetrics.estimatedPremium.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] mt-3 italic" style={{ color: 'var(--text-muted)' }}>*Estimated annual premium based on market averages for comprehensive plans.</p>
                  </div>
                </div>
              }
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('health.adults')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => setAdults(n)} className={cn("py-2 px-1 rounded-lg border text-sm font-medium transition-all flex items-center justify-center min-h-[40px] w-full", adults === n ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "")} style={adults !== n ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-adults-${n}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('health.kids')}</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => setKids(n)} className={cn("py-2 px-1 rounded-lg border text-sm font-medium transition-all flex items-center justify-center min-h-[40px] w-full", kids === n ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "")} style={kids !== n ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-kids-${n}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('health.medicalExp')} (₹)</Label>
                  <Input type="number" value={monthlyMedical} onChange={handleNumberInput(setMonthlyMedical, 500000)} max={500000} className="h-10 text-base" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} data-testid="input-monthly-medical" />
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('health.surgery')}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {[
                      { id: "none", label: t('health.surgery.none') },
                      { id: "angioplasty", label: t('health.surgery.angioplasty') },
                      { id: "bypass", label: t('health.surgery.bypass') },
                      { id: "knee", label: t('health.surgery.knee') },
                      { id: "maternity", label: t('health.surgery.maternity') },
                      { id: "cataract", label: t('health.surgery.cataract') },
                      { id: "cancer", label: t('health.surgery.cancer') }
                    ].map((s) => (
                      <button key={s.id} onClick={() => setPlannedSurgery(s.id)} className={cn("py-2 px-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all min-h-[40px] flex items-center leading-tight", plannedSurgery === s.id ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "")} style={plannedSurgery !== s.id ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-surgery-${s.id}`}>{s.label}</button>
                    ))}
                  </div>
                  <p className="text-[10px] italic mt-1" style={{ color: 'var(--text-muted)' }}>{t('health.surgery.future_note')}</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('health.location')}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {[
                      { id: "tier1", label: t('health.tier1') },
                      { id: "tier2", label: t('health.tier2') },
                      { id: "tier3", label: t('health.tier3') }
                    ].map((l) => (
                      <button key={l.id} onClick={() => setLocationTier(l.id)} className={cn("py-2 px-4 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all min-h-[44px] w-full flex items-center", locationTier === l.id ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "")} style={locationTier !== l.id ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-location-${l.id}`}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label style={{ color: 'var(--text-secondary)' }}>{t('health.preexisting')}</Label>
                  <RadioGroup value={hasPreExisting} onValueChange={setHasPreExisting} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="pe-yes" />
                      <Label htmlFor="pe-yes" className="font-normal cursor-pointer" style={{ color: 'var(--text-secondary)' }}>{t('health.yes')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="pe-no" />
                      <Label htmlFor="pe-no" className="font-normal cursor-pointer" style={{ color: 'var(--text-secondary)' }}>{t('health.no')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CalculatorCard>
          </TabsContent>
        </Tabs>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
