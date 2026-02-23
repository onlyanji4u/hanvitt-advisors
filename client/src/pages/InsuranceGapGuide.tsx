import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, Clock, Briefcase, Users, XCircle, CheckCircle, Download, ArrowRight, HeartPulse, Phone, RefreshCw, IndianRupee, Shield, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { amountToWords } from "@/lib/amount-words";

const mythIcons = [ShieldAlert, Clock, Briefcase, AlertTriangle, Users];

const medicalInflationData = [
  { year: '2020', cost: 5.0 },
  { year: '2022', cost: 6.1 },
  { year: '2024', cost: 7.4 },
  { year: '2026', cost: 9.0 },
  { year: '2028', cost: 10.9 },
  { year: '2030', cost: 13.3 },
  { year: '2032', cost: 16.1 },
  { year: '2035', cost: 22.0 },
];

const coverageGapData = [
  { procedure: 'Heart Surgery', avgCost: 8, typicalCover: 3 },
  { procedure: 'Knee Replacement', avgCost: 5, typicalCover: 2.5 },
  { procedure: 'Cancer Treatment', avgCost: 15, typicalCover: 3 },
  { procedure: 'Organ Transplant', avgCost: 25, typicalCover: 5 },
  { procedure: 'ICU (10 days)', avgCost: 6, typicalCover: 2 },
];

function MythFactCard({ index, t }: { index: number; t: (key: string) => string }) {
  const Icon = mythIcons[index];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="h-full overflow-hidden rounded-2xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
        <CardContent className="p-0">
          <div className="p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">Myth #{index + 1}</span>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }} data-testid={`text-myth-${index + 1}`}>
                  {t(`igap.myth${index + 1}.myth`)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Fact</span>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }} data-testid={`text-fact-${index + 1}`}>
                  {t(`igap.myth${index + 1}.fact`)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ComparisonTable({ t }: { t: (key: string) => string }) {
  const rows = [
    { feature: 'coverage', employer: 'coverageEmployer', personal: 'coveragePersonal' },
    { feature: 'portability', employer: 'portabilityEmployer', personal: 'portabilityPersonal' },
    { feature: 'ncb', employer: 'ncbEmployer', personal: 'ncbPersonal' },
    { feature: 'customization', employer: 'customizationEmployer', personal: 'customizationPersonal' },
    { feature: 'retirement', employer: 'retirementEmployer', personal: 'retirementPersonal' },
    { feature: 'roomRent', employer: 'roomRentEmployer', personal: 'roomRentPersonal' },
    { feature: 'family', employer: 'familyEmployer', personal: 'familyPersonal' },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border-subtle)' }}>
      <table className="w-full text-sm" data-testid="table-comparison">
        <thead>
          <tr style={{ background: 'var(--glass-bg)' }}>
            <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>{t('igap.compare.feature')}</th>
            <th className="text-left px-4 py-3 font-semibold text-red-400" style={{ borderBottom: '1px solid var(--border-subtle)' }}>{t('igap.compare.employer')}</th>
            <th className="text-left px-4 py-3 font-semibold text-emerald-400" style={{ borderBottom: '1px solid var(--border-subtle)' }}>{t('igap.compare.personal')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.feature} style={{ background: i % 2 === 0 ? 'var(--page-bg-alt)' : 'var(--page-bg)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
                {t(`igap.compare.${row.feature}`)}
              </td>
              <td className="px-4 py-3 text-red-400" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {t(`igap.compare.${row.employer}`)}
              </td>
              <td className="px-4 py-3 text-emerald-400" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {t(`igap.compare.${row.personal}`)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UrgencyBanner({ t }: { t: (key: string) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-2xl p-8 md:p-12" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(212,175,55,0.1) 100%)', border: '1px solid rgba(220,38,38,0.2)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-red-500/5 -translate-y-32 translate-x-32" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }} data-testid="text-urgency-title">
            {t('igap.section.urgencyTitle')}
          </h3>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }} data-testid="text-urgency-desc">
            {t('igap.section.urgencyDesc')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface GapAnalysisResult {
  gapScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  currentCoverL: number;
  recommendedCoverL: number;
  gapAmountL: number;
  futureCoverValueL: number;
  estimatedAnnualPremium: number;
  findings: string[];
  recommendations: string[];
  ageUsed: number;
  depsUsed: number;
}

const MEDICAL_INFLATION_RATE = 0.12;
const PREMIUM_BASE_PER_LAKH = 450;

function calculateGapAnalysis(ageNum: number, depsNum: number, coverNum: number): GapAnalysisResult {
  const coverL = coverNum / 100000;

  let baseCoverL = 10;
  if (ageNum >= 45) baseCoverL = 15;
  if (ageNum >= 55) baseCoverL = 25;
  const depsCoverL = depsNum * 5;
  const ageMultiplier = ageNum < 35 ? 1.0 : ageNum < 45 ? 1.3 : ageNum < 55 ? 1.6 : 2.0;
  const recommendedCoverL = Math.ceil((baseCoverL + depsCoverL) * ageMultiplier);

  const gapAmountL = Math.max(0, recommendedCoverL - coverL);

  const futureCoverValueL = Math.round((coverL / Math.pow(1 + MEDICAL_INFLATION_RATE, 5)) * 10) / 10;

  let gapScore = 0;
  if (coverL <= 0) gapScore = 95;
  else {
    const coverageRatio = coverL / recommendedCoverL;
    if (coverageRatio < 0.2) gapScore = 90;
    else if (coverageRatio < 0.4) gapScore = 75;
    else if (coverageRatio < 0.6) gapScore = 60;
    else if (coverageRatio < 0.8) gapScore = 40;
    else if (coverageRatio < 1.0) gapScore = 25;
    else gapScore = 10;
    if (ageNum >= 50) gapScore = Math.min(100, gapScore + 10);
    if (depsNum >= 3) gapScore = Math.min(100, gapScore + 5);
  }

  const riskLevel: 'high' | 'medium' | 'low' = gapScore >= 60 ? 'high' : gapScore >= 30 ? 'medium' : 'low';

  const agePremiumMultiplier = ageNum < 30 ? 0.7 : ageNum < 40 ? 1.0 : ageNum < 50 ? 1.5 : ageNum < 60 ? 2.2 : 3.0;
  const familyMultiplier = 1 + (depsNum * 0.25);
  const estimatedAnnualPremium = Math.round(recommendedCoverL * PREMIUM_BASE_PER_LAKH * agePremiumMultiplier * familyMultiplier);

  const findings: string[] = [];
  const recommendations: string[] = [];

  findings.push('portability');
  if (coverL > 0) findings.push('inflation');
  findings.push('majorProcedure');
  if (depsNum > 0) findings.push('familyRisk');
  findings.push('noNCB');

  recommendations.push('personalCover');
  if (coverL >= 3) recommendations.push('superTopup');
  recommendations.push('earlyStart');
  recommendations.push('criticalIllness');
  recommendations.push('review');

  return {
    gapScore,
    riskLevel,
    currentCoverL: coverL,
    recommendedCoverL,
    gapAmountL,
    futureCoverValueL,
    estimatedAnnualPremium,
    findings,
    recommendations,
    ageUsed: ageNum,
    depsUsed: depsNum,
  };
}

function GapScoreGauge({ score, riskLevel, t }: { score: number; riskLevel: string; t: (k: string) => string }) {
  const color = riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#10b981';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>/100</span>
        </div>
      </div>
      <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${color}20`, color }}>
        {t(`igap.result.${riskLevel}`)}
      </div>
    </div>
  );
}

function AnalysisResults({ result, t, onReset }: { result: GapAnalysisResult; t: (k: string) => string; onReset: () => void }) {
  const pieData = [
    { name: t('igap.result.currentCover'), value: result.currentCoverL, color: '#D4AF37' },
    { name: t('igap.result.gapAmount'), value: result.gapAmountL, color: '#ef4444' },
  ];

  const formatFinding = (key: string) => {
    let text = t(`igap.result.finding.${key}`);
    text = text.replace('{cover}', String(result.currentCoverL));
    text = text.replace('{future}', String(result.futureCoverValueL));
    text = text.replace('{deps}', String(result.depsUsed));
    return text;
  };

  const formatRec = (key: string) => {
    let text = t(`igap.result.rec.${key}`);
    text = text.replace('{amount}', amountToWords(result.recommendedCoverL * 100000) || `₹${result.recommendedCoverL}L`);
    text = text.replace('{cover}', String(result.currentCoverL));
    text = text.replace('{age}', String(result.ageUsed));
    return text;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
      <Card className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
        <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] to-[#f0d060]" />
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-[#D4AF37]" />
            <CardTitle className="text-2xl" style={{ color: 'var(--text-primary)' }} data-testid="text-analysis-title">
              {t('igap.result.title')}
            </CardTitle>
          </div>
          <CardDescription style={{ color: 'var(--text-secondary)' }}>
            {t('igap.result.subtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex justify-center">
              <GapScoreGauge score={result.gapScore} riskLevel={result.riskLevel} t={t} />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              {[
                { label: t('igap.result.currentCover'), value: result.currentCoverL > 0 ? `₹${result.currentCoverL}L` : '₹0', icon: Briefcase, color: '#D4AF37' },
                { label: t('igap.result.recommendedCover'), value: `₹${result.recommendedCoverL}L`, icon: Shield, color: '#3b82f6' },
                { label: t('igap.result.gapAmount'), value: result.gapAmountL > 0 ? `₹${result.gapAmountL}L` : '₹0', icon: AlertTriangle, color: result.gapAmountL > 0 ? '#ef4444' : '#10b981' },
                { label: t('igap.result.inflationImpact'), value: result.currentCoverL > 0 ? `₹${result.futureCoverValueL}L` : 'N/A', icon: TrendingUp, color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: item.color }} data-testid={`text-result-${i}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {result.gapAmountL > 0 && (
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--page-bg-alt)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }}
                      formatter={(value: number) => [`₹${value}L`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 -mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('igap.result.premiumEstimate')}</span>
            </div>
            <p className="text-2xl font-bold text-[#D4AF37]" data-testid="text-premium-estimate">
              {amountToWords(result.estimatedAnnualPremium) || `₹${result.estimatedAnnualPremium.toLocaleString('en-IN')}`}
              <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-secondary)' }}>
                (~₹{Math.round(result.estimatedAnnualPremium / 12).toLocaleString('en-IN')} {t('igap.result.perMonth')})
              </span>
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle className="h-4 w-4 text-red-400" />
              {t('igap.result.keyFindings')}
            </h4>
            <div className="space-y-2">
              {result.findings.map((key, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatFinding(key)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {t('igap.result.recommendations')}
            </h4>
            <div className="space-y-2">
              {result.recommendations.map((key, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatRec(key)}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
            {t('igap.result.disclaimer')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/contact" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold py-3 rounded-xl shadow-lg" data-testid="button-talk-expert">
                <Phone className="mr-2 h-4 w-4" />
                {t('igap.result.cta')}
              </Button>
            </a>
            <Button variant="outline" onClick={onReset} className="flex-1 rounded-xl py-3 font-bold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} data-testid="button-new-analysis">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('igap.result.newAnalysis')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsuranceGapForm({ t, formRef, resetTrigger }: { t: (key: string) => string; formRef: React.RefObject<HTMLDivElement>; resetTrigger: number }) {
  const [age, setAge] = useState("");
  const [dependents, setDependents] = useState("");
  const [employerCoverage, setEmployerCoverage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<GapAnalysisResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const prevResetTrigger = useRef(resetTrigger);

  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      prevResetTrigger.current = resetTrigger;
      if (analysisResult) {
        setAnalysisResult(null);
        setAge("");
        setDependents("");
        setEmployerCoverage("");
        setErrors({});
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [resetTrigger]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!age.trim()) errs.age = "Please enter your age";
    else if (parseInt(age) < 18) errs.age = "Age must be at least 18";
    if (!dependents.trim()) errs.dependents = "Please enter number of dependents";
    if (!employerCoverage.trim()) errs.coverage = "Please enter your employer coverage amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const ageNum = parseInt(age);
    const depsNum = parseInt(dependents);
    const coverNum = parseInt(employerCoverage);

    const result = calculateGapAnalysis(ageNum, depsNum, coverNum);
    setAnalysisResult(result);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAge("");
    setDependents("");
    setEmployerCoverage("");
    setErrors({});
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  if (analysisResult) {
    return (
      <div ref={resultRef}>
        <AnalysisResults result={analysisResult} t={t} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div ref={formRef}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-2xl shadow-2xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-t-xl" />
        <CardHeader>
          <CardTitle className="text-2xl" style={{ color: 'var(--text-primary)' }} data-testid="text-form-title">{t('igap.form.title')}</CardTitle>
          <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('igap.form.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-insurance-gap">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-secondary)' }}>{t('igap.form.age')} *</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val === '') { setAge(''); return; }
                    const num = parseInt(val, 10);
                    if (isNaN(num)) return;
                    if (num > 100) { setAge('100'); return; }
                    setAge(String(num));
                    setErrors(prev => ({ ...prev, age: "" }));
                  }}
                  min={18}
                  max={100}
                  placeholder="18-100"
                  onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                  style={{ background: 'var(--page-bg)', borderColor: errors.age ? 'red' : 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  data-testid="input-gap-age"
                />
                {errors.age && <p className="text-xs text-red-400">{errors.age}</p>}
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-secondary)' }}>{t('igap.form.dependents')} *</Label>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{t('igap.form.dependentsHint')}</p>
                <Input
                  type="number"
                  value={dependents}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val === '') { setDependents(''); return; }
                    const num = parseInt(val, 10);
                    if (isNaN(num)) return;
                    if (num > 20) { setDependents('20'); return; }
                    setDependents(String(num));
                    setErrors(prev => ({ ...prev, dependents: "" }));
                  }}
                  min={0}
                  max={20}
                  placeholder="0-20"
                  onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                  style={{ background: 'var(--page-bg)', borderColor: errors.dependents ? 'red' : 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  data-testid="input-gap-dependents"
                />
                {errors.dependents && <p className="text-xs text-red-400">{errors.dependents}</p>}
              </div>
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--text-secondary)' }}>{t('igap.form.employerCoverage')} *</Label>
                <Input
                  type="number"
                  value={employerCoverage}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val === '') { setEmployerCoverage(''); return; }
                    const num = parseInt(val, 10);
                    if (isNaN(num)) return;
                    if (num > 20000000) { setEmployerCoverage('20000000'); return; }
                    setEmployerCoverage(String(num));
                    setErrors(prev => ({ ...prev, coverage: "" }));
                  }}
                  min={0}
                  max={20000000}
                  placeholder="500000"
                  onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                  style={{ background: 'var(--page-bg)', borderColor: errors.coverage ? 'red' : 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  data-testid="input-gap-employer-coverage"
                />
                {amountToWords(employerCoverage) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(employerCoverage)}</p>}
                {errors.coverage && <p className="text-xs text-red-400">{errors.coverage}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold py-3 rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all"
              data-testid="button-gap-submit"
            >
              {t('igap.form.submit')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
    </div>
  );
}

function MedicalInflationChart({ t }: { t: (key: string) => string }) {
  return (
    <Card className="rounded-2xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
      <CardHeader>
        <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('igap.section.inflation')}</CardTitle>
        <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('igap.section.inflationDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={medicalInflationData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} label={{ value: t('igap.chart.cost'), angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)', fontSize: 11 } }} />
            <Tooltip
              contentStyle={{ background: 'var(--page-bg-alt)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value: number) => [`₹${value}L`, t('igap.chart.cost')]}
            />
            <Line type="monotone" dataKey="cost" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, stroke: '#D4AF37' }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          ₹5L employer cover value projection at 12% medical inflation
        </p>
      </CardContent>
    </Card>
  );
}

function CoverageGapChart({ t }: { t: (key: string) => string }) {
  return (
    <Card className="rounded-2xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
      <CardHeader>
        <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('igap.section.coverageGap')}</CardTitle>
        <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('igap.section.coverageGapDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={coverageGapData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="procedure" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} label={{ value: t('igap.chart.cost'), angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)', fontSize: 11 } }} />
            <Tooltip
              contentStyle={{ background: 'var(--page-bg-alt)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value: number) => [`₹${value}L`]}
            />
            <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
            <Bar dataKey="avgCost" name={t('igap.chart.avgCost')} fill="#ef4444" fillOpacity={0.7} radius={[6, 6, 0, 0]} />
            <Bar dataKey="typicalCover" name={t('igap.chart.typicalCover')} fill="#D4AF37" fillOpacity={0.7} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function InsuranceGapGuide() {
  const { t } = useLanguage();
  const formRef = useRef<HTMLDivElement>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const scrollToForm = () => {
    setResetTrigger(prev => prev + 1);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Navigation />
      <ScrollToTop />

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
              <HeartPulse className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>INSURANCE AWARENESS</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span style={{ color: 'var(--text-primary)' }}>{t('igap.title')}</span>
              <br />
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] bg-clip-text text-transparent">
                {t('igap.subtitle')}
              </span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }} data-testid="text-hero-desc">
              {t('igap.heroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={scrollToForm}
                className="bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold px-8 py-3 rounded-full shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all text-base"
                data-testid="button-cta-gap-analysis"
              >
                {t('igap.form.submit')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-8 py-3 font-bold text-base"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                onClick={() => window.open('/api/insurance-gap/pdf', '_blank')}
                data-testid="button-download-pdf"
              >
                <Download className="mr-2 h-4 w-4" />
                {t('igap.form.downloadPdf')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t('igap.section.myths')}</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>{t('igap.section.mythsDesc')}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <MythFactCard key={i} index={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20" style={{ background: 'var(--glass-bg)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t('igap.section.comparison')}</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>{t('igap.section.comparisonDesc')}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <ComparisonTable t={t} />
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <MedicalInflationChart t={t} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <CoverageGapChart t={t} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20" style={{ background: 'var(--glass-bg)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <UrgencyBanner t={t} />
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <InsuranceGapForm t={t} formRef={formRef} resetTrigger={resetTrigger} />
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="rounded-full px-8 py-3 font-bold"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              onClick={() => window.open('/api/insurance-gap/pdf', '_blank')}
              data-testid="button-download-pdf-bottom"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('igap.form.downloadPdf')}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg md:text-xl font-semibold italic" style={{ color: 'var(--text-secondary)' }} data-testid="text-positioning">
            "{t('igap.positioning')}"
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
