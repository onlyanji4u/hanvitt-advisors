import { useState, useMemo, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Award, CheckCircle, AlertTriangle, RotateCcw, HeartPulse, ShieldCheck, IndianRupee } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { amountToWords } from "@/lib/amount-words";

interface ScoreBreakdown {
  savings: number;
  debt: number;
  emergency: number;
  insurance: number;
  investment: number;
  planning: number;
}

interface InsuranceRec {
  healthCover: number;
  healthPremium: number;
  termCover: number;
  termPremium: number;
  healthReason: string[];
  termReason: string[];
  healthBreakdown: { label: string; amount: number }[];
  familyMembers: number;
  planType: string;
  existingHealth: number;
  existingTerm: number;
  healthGap: number;
  termGap: number;
  healthSufficient: boolean;
  termSufficient: boolean;
  parentsCover: number;
  parentsPremium: number;
  parentsBreakdown: { label: string; amount: number }[];
  hasParentsCover: boolean;
}

const clampedSetter = (setter: (v: string) => void, min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const raw = e.target.value;
  if (raw === '') { setter(''); return; }
  const num = parseFloat(raw);
  if (isNaN(num)) return;
  if (num > max) { setter(String(max)); return; }
  if (num < min && raw.length > 1) { setter(String(min)); return; }
  setter(raw);
};

const getHealthRatePerLakh = (eldestAge: number): number => {
  if (eldestAge <= 25) return 800;
  if (eldestAge <= 30) return 950;
  if (eldestAge <= 35) return 1100;
  if (eldestAge <= 40) return 1400;
  if (eldestAge <= 45) return 1800;
  if (eldestAge <= 50) return 2300;
  if (eldestAge <= 55) return 3000;
  if (eldestAge <= 60) return 4000;
  if (eldestAge <= 65) return 5200;
  if (eldestAge <= 70) return 6500;
  return 8500;
};

const getHealthVolumeDiscount = (siInLakhs: number): number => {
  if (siInLakhs <= 5) return 1.0;
  if (siInLakhs <= 10) return 0.90;
  if (siInLakhs <= 20) return 0.80;
  if (siInLakhs <= 50) return 0.70;
  return 0.60;
};

const getHealthFamilyMultiplier = (totalMembers: number, hasParents: boolean): number => {
  let base = totalMembers <= 1 ? 1.0 : totalMembers <= 2 ? 1.35 : totalMembers <= 3 ? 1.50 : totalMembers <= 4 ? 1.60 : 1.70;
  if (hasParents) base += 0.15;
  return base;
};

const getTermPremiumRate = (memberAge: number): number => {
  if (memberAge <= 25) return 70;
  if (memberAge <= 30) return 100;
  if (memberAge <= 35) return 140;
  if (memberAge <= 40) return 220;
  if (memberAge <= 45) return 300;
  if (memberAge <= 50) return 480;
  if (memberAge <= 55) return 750;
  return 1200;
};

export default function FinScore() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlySavings, setMonthlySavings] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [emergencyFund, setEmergencyFund] = useState('');
  const [hasHealthInsurance, setHasHealthInsurance] = useState<boolean | null>(null);
  const [hasLifeInsurance, setHasLifeInsurance] = useState<boolean | null>(null);
  const [hasInvestments, setHasInvestments] = useState<boolean | null>(null);
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
  const [hasWill, setHasWill] = useState<boolean | null>(null);

  const [age, setAge] = useState('');
  const [cityTier, setCityTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier1');
  const [hasSpouse, setHasSpouse] = useState<boolean>(true);
  const [spouseAge, setSpouseAge] = useState('');
  const [numChildren, setNumChildren] = useState('0');
  const [numParents, setNumParents] = useState('0');
  const [eldestParentAge, setEldestParentAge] = useState('');
  const [existingHealthCover, setExistingHealthCover] = useState('');
  const [existingTermCover, setExistingTermCover] = useState('');

  const [calculated, setCalculated] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const chartColors = useMemo(() => ({
    tickFill: isDark ? '#ffffff40' : 'rgba(0,0,0,0.4)',
    gridStroke: isDark ? '#ffffff08' : 'rgba(0,0,0,0.08)',
    tooltipBg: isDark ? '#131a24' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    tooltipColor: isDark ? '#fff' : '#1a2332',
    radialBg: isDark ? '#131a24' : 'rgba(0,0,0,0.06)',
    axisStroke: isDark ? '#ffffff20' : 'rgba(0,0,0,0.15)',
  }), [isDark]);

  const inputStyle = { background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' };

  const score = useMemo((): { total: number; breakdown: ScoreBreakdown } => {
    const income = parseFloat(monthlyIncome) || 0;
    const savings = parseFloat(monthlySavings) || 0;
    const debt = parseFloat(totalDebt) || 0;
    const emi = parseFloat(monthlyEMI) || 0;
    const emergency = parseFloat(emergencyFund) || 0;

    if (income <= 0) return { total: 0, breakdown: { savings: 0, debt: 0, emergency: 0, insurance: 0, investment: 0, planning: 0 } };

    const savingsRatio = Math.min((savings / income) * 100, 100);
    const savingsScore = savingsRatio >= 30 ? 20 : savingsRatio >= 20 ? 16 : savingsRatio >= 10 ? 10 : savingsRatio >= 5 ? 5 : 0;

    const emiToIncome = income > 0 ? (emi / income) * 100 : 0;
    const debtToIncome = income > 0 ? (debt / (income * 12)) * 100 : 0;
    let debtScore = 20;
    if (emiToIncome > 50) debtScore = 2;
    else if (emiToIncome > 40) debtScore = 6;
    else if (emiToIncome > 30) debtScore = 10;
    else if (emiToIncome > 20) debtScore = 14;
    if (debtToIncome > 300) debtScore = Math.max(debtScore - 6, 0);

    const monthsOfExpenses = income > 0 ? emergency / (income - savings) : 0;
    let emergencyScore = 0;
    if (monthsOfExpenses >= 12) emergencyScore = 20;
    else if (monthsOfExpenses >= 6) emergencyScore = 16;
    else if (monthsOfExpenses >= 3) emergencyScore = 10;
    else if (monthsOfExpenses >= 1) emergencyScore = 5;

    let insuranceScore = 0;
    if (hasHealthInsurance) insuranceScore += 10;
    if (hasLifeInsurance) insuranceScore += 10;

    const investmentScore = hasInvestments ? 15 : 0;

    let planningScore = 0;
    if (hasBudget) planningScore += 8;
    if (hasWill) planningScore += 7;

    const total = savingsScore + debtScore + emergencyScore + insuranceScore + investmentScore + planningScore;
    return { total: Math.min(total, 100), breakdown: { savings: savingsScore, debt: debtScore, emergency: emergencyScore, insurance: insuranceScore, investment: investmentScore, planning: planningScore } };
  }, [monthlyIncome, monthlySavings, totalDebt, monthlyEMI, emergencyFund, hasHealthInsurance, hasLifeInsurance, hasInvestments, hasBudget, hasWill]);

  const insuranceRec = useMemo((): InsuranceRec => {
    const income = parseFloat(monthlyIncome) || 0;
    const annualIncome = income * 12;
    const debt = parseFloat(totalDebt) || 0;
    const userAge = parseInt(age) || 30;
    const spAge = parseInt(spouseAge) || (userAge > 0 ? userAge - 2 : 28);
    const kids = parseInt(numChildren) || 0;
    const parents = parseInt(numParents) || 0;
    const parentAge = parseInt(eldestParentAge) || 60;

    const healthReasons: string[] = [];
    const termReasons: string[] = [];
    const healthBreakdown: { label: string; amount: number }[] = [];

    let floaterMembers = 1;
    let selfCover = 300000;
    healthBreakdown.push({ label: t('ins.health.breakdown.self'), amount: selfCover });

    let spouseCover = 0;
    if (hasSpouse) {
      floaterMembers += 1;
      spouseCover = 200000;
      healthBreakdown.push({ label: t('ins.health.breakdown.spouse'), amount: spouseCover });
    }

    let childrenCover = 0;
    if (kids > 0) {
      floaterMembers += kids;
      childrenCover = kids * 150000;
      healthBreakdown.push({ label: `${t('ins.health.breakdown.children')} (${kids})`, amount: childrenCover });
    }

    let totalFamilyMembers = floaterMembers;

    let floaterBaseCover = selfCover + spouseCover + childrenCover;
    healthReasons.push(t('ins.health.reason.floater'));

    let cityMultiplier = 1;
    if (cityTier === 'tier1') {
      cityMultiplier = 1.5;
      healthReasons.push(t('ins.health.reason.metro'));
    } else if (cityTier === 'tier2') {
      cityMultiplier = 1.2;
      healthReasons.push(t('ins.health.reason.urban'));
    }

    const floaterElderAge = Math.max(userAge, hasSpouse ? spAge : 0);
    let floaterAgeMultiplier = 1;
    if (floaterElderAge >= 55) {
      floaterAgeMultiplier = 1.4;
      healthReasons.push(t('ins.health.reason.age55'));
    } else if (floaterElderAge >= 45) {
      floaterAgeMultiplier = 1.3;
      healthReasons.push(t('ins.health.reason.age45'));
    } else if (floaterElderAge >= 35) {
      floaterAgeMultiplier = 1.15;
      healthReasons.push(t('ins.health.reason.age35'));
    }

    const inflationAdj5yr = Math.pow(1.08, 5);
    healthReasons.push(t('ins.health.reason.inflation'));

    let healthCover = floaterBaseCover * cityMultiplier * floaterAgeMultiplier * inflationAdj5yr;

    if (cityMultiplier > 1) {
      healthBreakdown.push({ label: t('ins.health.breakdown.city'), amount: Math.round(floaterBaseCover * (cityMultiplier - 1)) });
    }
    if (floaterAgeMultiplier > 1) {
      healthBreakdown.push({ label: t('ins.health.breakdown.age'), amount: Math.round(floaterBaseCover * cityMultiplier * (floaterAgeMultiplier - 1)) });
    }
    healthBreakdown.push({ label: t('ins.health.breakdown.inflation'), amount: Math.round(floaterBaseCover * cityMultiplier * floaterAgeMultiplier * (inflationAdj5yr - 1)) });

    healthCover = Math.ceil(healthCover / 100000) * 100000;
    if (healthCover < 500000) healthCover = 500000;
    if (healthCover > 50000000) healthCover = 50000000;

    let planType = floaterMembers <= 1 ? t('ins.health.plan.individual') : t('ins.health.plan.familyFloater');

    let healthPremium = 0;
    const siInLakhs = healthCover / 100000;
    const ratePerLakh = getHealthRatePerLakh(floaterElderAge);
    const basePremium = siInLakhs * ratePerLakh;
    const volumeAdj = basePremium * getHealthVolumeDiscount(siInLakhs);
    const familyAdj = volumeAdj * getHealthFamilyMultiplier(floaterMembers, false);
    healthPremium = Math.round(familyAdj);

    if (cityTier === 'tier2') {
      healthPremium = Math.round(healthPremium * 0.90);
    } else if (cityTier === 'tier3') {
      healthPremium = Math.round(healthPremium * 0.80);
    }

    healthPremium = Math.ceil(healthPremium / 100) * 100;
    if (healthPremium < 5000) healthPremium = 5000;

    let sepParentsCover = 0;
    let sepParentsPremium = 0;
    const parentsBreakdown: { label: string; amount: number }[] = [];
    const hasParentsCover = parents > 0;

    if (parents > 0) {
      const parentBaseCover = parents * 300000;
      parentsBreakdown.push({ label: `${t('ins.health.breakdown.parents')} (${parents})`, amount: parentBaseCover });

      let parentAgeMultiplier = 1;
      if (parentAge >= 55) parentAgeMultiplier = 1.4;
      else if (parentAge >= 45) parentAgeMultiplier = 1.3;
      else if (parentAge >= 35) parentAgeMultiplier = 1.15;

      sepParentsCover = parentBaseCover * cityMultiplier * parentAgeMultiplier * inflationAdj5yr;

      if (cityMultiplier > 1) {
        parentsBreakdown.push({ label: t('ins.health.breakdown.city'), amount: Math.round(parentBaseCover * (cityMultiplier - 1)) });
      }
      if (parentAgeMultiplier > 1) {
        parentsBreakdown.push({ label: t('ins.health.breakdown.age'), amount: Math.round(parentBaseCover * cityMultiplier * (parentAgeMultiplier - 1)) });
      }
      parentsBreakdown.push({ label: t('ins.health.breakdown.inflation'), amount: Math.round(parentBaseCover * cityMultiplier * parentAgeMultiplier * (inflationAdj5yr - 1)) });

      sepParentsCover = Math.ceil(sepParentsCover / 100000) * 100000;
      if (sepParentsCover < 500000) sepParentsCover = 500000;
      if (sepParentsCover > 50000000) sepParentsCover = 50000000;

      const parentSiInLakhs = sepParentsCover / 100000;
      const parentRate = getHealthRatePerLakh(parentAge);
      const parentBasePrem = parentSiInLakhs * parentRate;
      const parentVolAdj = parentBasePrem * getHealthVolumeDiscount(parentSiInLakhs);
      const parentFamAdj = parentVolAdj * (parents >= 2 ? 1.35 : 1.0);
      sepParentsPremium = Math.round(parentFamAdj);

      if (cityTier === 'tier2') sepParentsPremium = Math.round(sepParentsPremium * 0.90);
      else if (cityTier === 'tier3') sepParentsPremium = Math.round(sepParentsPremium * 0.80);

      sepParentsPremium = Math.ceil(sepParentsPremium / 100) * 100;
      if (sepParentsPremium < 8000) sepParentsPremium = 8000;
    }

    let termCover = 0;
    if (annualIncome > 0) {
      const retirementAge = 60;
      const yearsToRetirement = Math.max(retirementAge - userAge, 5);
      const hlvMultiplier = Math.min(yearsToRetirement, 25);
      const hlvCover = annualIncome * hlvMultiplier;

      const incomeReplacement = annualIncome * 10;

      const debtCover = debt;

      const childEducation = kids * 2500000;

      const totalNeed = Math.max(hlvCover, incomeReplacement) + debtCover + childEducation;

      termCover = Math.ceil(totalNeed / 500000) * 500000;
      if (termCover < 5000000) termCover = 5000000;
      if (termCover > 500000000) termCover = 500000000;

      termReasons.push(t('ins.term.reason.income'));
      if (debt > 0) termReasons.push(t('ins.term.reason.debt'));
      if (kids > 0) termReasons.push(t('ins.term.reason.dependents'));
      termReasons.push(t('ins.term.reason.hlv'));
    } else {
      termCover = 5000000;
      termReasons.push(t('ins.term.reason.minimum'));
    }

    let termPremium = 0;
    const termRate = getTermPremiumRate(userAge);
    const termCoverInLakhs = termCover / 100000;
    let termVolDiscount = 1.0;
    if (termCoverInLakhs > 200) termVolDiscount = 0.85;
    else if (termCoverInLakhs > 100) termVolDiscount = 0.90;
    termPremium = Math.round(termCoverInLakhs * termRate * termVolDiscount);
    termPremium = Math.ceil(termPremium / 100) * 100;
    if (termPremium < 5000) termPremium = 5000;
    if (termPremium > 500000) termPremium = Math.min(termPremium, Math.round(termCover * 0.03));

    const existingHealth = parseFloat(existingHealthCover) || 0;
    const existingTerm = parseFloat(existingTermCover) || 0;
    const healthGap = Math.max(0, healthCover - existingHealth);
    const termGap = Math.max(0, termCover - existingTerm);
    const healthSufficient = existingHealth >= healthCover;
    const termSufficient = existingTerm >= termCover;

    return { healthCover, healthPremium, termCover, termPremium, healthReason: healthReasons, termReason: termReasons, healthBreakdown, familyMembers: totalFamilyMembers, planType, existingHealth, existingTerm, healthGap, termGap, healthSufficient, termSufficient, parentsCover: sepParentsCover, parentsPremium: sepParentsPremium, parentsBreakdown, hasParentsCover };
  }, [monthlyIncome, totalDebt, age, cityTier, hasSpouse, spouseAge, numChildren, numParents, eldestParentAge, existingHealthCover, existingTermCover, t]);

  const getScoreLabel = (s: number) => { if (s >= 80) return t('score.excellent'); if (s >= 60) return t('score.good'); if (s >= 40) return t('score.fair'); return t('score.poor'); };
  const getScoreColor = (s: number) => { if (s >= 80) return '#10b981'; if (s >= 60) return '#D4AF37'; if (s >= 40) return '#f59e0b'; return '#f43f5e'; };

  const breakdownData = useMemo(() => [
    { name: t('score.savingsRatio'), score: score.breakdown.savings, max: 20, fill: '#3b82f6' },
    { name: t('score.debtManagement'), score: score.breakdown.debt, max: 20, fill: '#06b6d4' },
    { name: t('score.emergencyReady'), score: score.breakdown.emergency, max: 20, fill: '#D4AF37' },
    { name: t('score.insuranceCover'), score: score.breakdown.insurance, max: 20, fill: '#10b981' },
    { name: t('score.investmentHabit'), score: score.breakdown.investment, max: 15, fill: '#a855f7' },
    { name: t('score.financialPlanning'), score: score.breakdown.planning, max: 15, fill: '#f59e0b' },
  ], [score.breakdown, t]);

  const recommendations = useMemo(() => {
    const recs: { icon: 'good' | 'bad'; text: string }[] = [];
    if (score.breakdown.savings >= 16) recs.push({ icon: 'good', text: t('score.rec.savings.good') }); else recs.push({ icon: 'bad', text: t('score.rec.savings.bad') });
    if (score.breakdown.debt >= 14) recs.push({ icon: 'good', text: t('score.rec.debt.good') }); else recs.push({ icon: 'bad', text: t('score.rec.debt.bad') });
    if (score.breakdown.emergency >= 16) recs.push({ icon: 'good', text: t('score.rec.emergency.good') }); else recs.push({ icon: 'bad', text: t('score.rec.emergency.bad') });
    if (score.breakdown.insurance >= 16) recs.push({ icon: 'good', text: t('score.rec.insurance.good') }); else recs.push({ icon: 'bad', text: t('score.rec.insurance.bad') });
    if (score.breakdown.investment >= 10) recs.push({ icon: 'good', text: t('score.rec.invest.good') }); else recs.push({ icon: 'bad', text: t('score.rec.invest.bad') });
    if (score.breakdown.planning >= 10) recs.push({ icon: 'good', text: t('score.rec.planning.good') }); else recs.push({ icon: 'bad', text: t('score.rec.planning.bad') });
    return recs;
  }, [score.breakdown, t]);

  const handleCalculate = () => {
    setCalculated(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const handleReset = () => {
    setMonthlyIncome(''); setMonthlySavings(''); setTotalDebt(''); setMonthlyEMI('');
    setEmergencyFund(''); setHasHealthInsurance(null); setHasLifeInsurance(null);
    setHasInvestments(null); setHasBudget(null); setHasWill(null);
    setAge(''); setCityTier('tier1');
    setHasSpouse(true); setSpouseAge(''); setNumChildren('0'); setNumParents('0'); setEldestParentAge('');
    setExistingHealthCover(''); setExistingTermCover('');
    setCalculated(false);
  };

  const gaugeData = [{ value: score.total, fill: getScoreColor(score.total) }];

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="py-8 sm:py-10" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Award className="h-6 w-6 text-rose-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('score.title')}</h1>
          </div>
          <p className="max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{t('score.desc')}</p>
        </div>
      </section>

      <section className="py-8 sm:py-12 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-t-xl" />
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>{t('score.card.title')}</CardTitle>
                  <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('score.card.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('score.age')}</Label>
                    <Input type="number" value={age} onChange={clampedSetter(setAge, 18, 100)} placeholder="30" min={18} max={100} style={inputStyle} className="placeholder:opacity-40" data-testid="input-age" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('score.cityTier')}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['tier1', 'tier2', 'tier3'] as const).map((tier) => (
                        <button key={tier} onClick={() => setCityTier(tier)} className={cn("py-2 px-2 rounded-lg border text-xs font-medium min-h-[40px] w-full", cityTier === tier ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "")} style={cityTier !== tier ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-city-${tier}`}>{t(`score.${tier}`)}</button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
                    <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">{t('ins.health.familyDetails')}</p>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.hasSpouse')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setHasSpouse(true)} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", hasSpouse ? "bg-emerald-500 text-white border-emerald-500" : "")} style={!hasSpouse ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-hasSpouse-yes">{t('score.yes')}</button>
                        <button onClick={() => setHasSpouse(false)} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", !hasSpouse ? "bg-red-500 text-white border-red-500" : "")} style={hasSpouse ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-hasSpouse-no">{t('score.no')}</button>
                      </div>
                    </div>

                    {hasSpouse && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.spouseAge')}</Label>
                        <Input type="number" value={spouseAge} onChange={clampedSetter(setSpouseAge, 18, 100)} placeholder="28" min={18} max={100} style={inputStyle} className="placeholder:opacity-40" data-testid="input-spouse-age" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.children')}</Label>
                        <Input type="number" value={numChildren} onChange={clampedSetter(setNumChildren, 0, 6)} placeholder="0" min={0} max={6} style={inputStyle} className="placeholder:opacity-40" data-testid="input-children" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.parents')}</Label>
                        <Input type="number" value={numParents} onChange={clampedSetter(setNumParents, 0, 4)} placeholder="0" min={0} max={4} style={inputStyle} className="placeholder:opacity-40" data-testid="input-parents" />
                      </div>
                    </div>

                    {(parseInt(numParents) || 0) > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.parentAge')}</Label>
                        <Input type="number" value={eldestParentAge} onChange={clampedSetter(setEldestParentAge, 40, 100)} placeholder="60" min={40} max={100} style={inputStyle} className="placeholder:opacity-40" data-testid="input-parent-age" />
                      </div>
                    )}
                  </div>

                  {[
                    { label: t('score.monthlyIncome'), value: monthlyIncome, setter: setMonthlyIncome, placeholder: '50000', testId: 'input-monthly-income', min: 0, max: 10000000 },
                    { label: t('score.monthlySavings'), value: monthlySavings, setter: setMonthlySavings, placeholder: '10000', testId: 'input-monthly-savings', min: 0, max: 10000000 },
                    { label: t('score.totalDebt'), value: totalDebt, setter: setTotalDebt, placeholder: '0', testId: 'input-total-debt', min: 0, max: 500000000 },
                    { label: t('score.monthlyEMI'), value: monthlyEMI, setter: setMonthlyEMI, placeholder: '0', testId: 'input-monthly-emi', min: 0, max: 10000000 },
                    { label: t('score.emergencyFund'), value: emergencyFund, setter: setEmergencyFund, placeholder: '300000', testId: 'input-emergency-fund', min: 0, max: 500000000 },
                  ].map(({ label, value, setter, placeholder, testId, min, max }) => (
                    <div key={testId} className="space-y-1">
                      <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</Label>
                      <Input type="number" value={value} onChange={clampedSetter(setter, min, max)} placeholder={placeholder} min={min} max={max} style={inputStyle} className="placeholder:opacity-40" data-testid={testId} />
                      {amountToWords(value) && <p className="text-[10px] text-[#D4AF37]/70 font-medium" data-testid={`${testId}-words`}>{amountToWords(value)}</p>}
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('score.hasHealthInsurance')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setHasHealthInsurance(true)} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", hasHealthInsurance === true ? "bg-emerald-500 text-white border-emerald-500" : "")} style={hasHealthInsurance !== true ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-hasHealthInsurance-yes">{t('score.yes')}</button>
                      <button onClick={() => { setHasHealthInsurance(false); setExistingHealthCover(''); }} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", hasHealthInsurance === false ? "bg-red-500 text-white border-red-500" : "")} style={hasHealthInsurance !== false ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-hasHealthInsurance-no">{t('score.no')}</button>
                    </div>
                  </div>
                  {hasHealthInsurance === true && (
                    <div className="space-y-1 pl-3 border-l-2 border-emerald-500/30">
                      <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.existing.healthCover')}</Label>
                      <Input type="number" value={existingHealthCover} onChange={clampedSetter(setExistingHealthCover, 0, 100000000)} placeholder="500000" min={0} max={100000000} style={inputStyle} className="placeholder:opacity-40" data-testid="input-existing-health-cover" />
                      {amountToWords(existingHealthCover) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(existingHealthCover)}</p>}
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('ins.existing.healthHint')}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('score.hasLifeInsurance')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setHasLifeInsurance(true)} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", hasLifeInsurance === true ? "bg-emerald-500 text-white border-emerald-500" : "")} style={hasLifeInsurance !== true ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-hasLifeInsurance-yes">{t('score.yes')}</button>
                      <button onClick={() => { setHasLifeInsurance(false); setExistingTermCover(''); }} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", hasLifeInsurance === false ? "bg-red-500 text-white border-red-500" : "")} style={hasLifeInsurance !== false ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-hasLifeInsurance-no">{t('score.no')}</button>
                    </div>
                  </div>
                  {hasLifeInsurance === true && (
                    <div className="space-y-1 pl-3 border-l-2 border-blue-500/30">
                      <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('ins.existing.termCover')}</Label>
                      <Input type="number" value={existingTermCover} onChange={clampedSetter(setExistingTermCover, 0, 1000000000)} placeholder="5000000" min={0} max={1000000000} style={inputStyle} className="placeholder:opacity-40" data-testid="input-existing-term-cover" />
                      {amountToWords(existingTermCover) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(existingTermCover)}</p>}
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('ins.existing.termHint')}</p>
                    </div>
                  )}

                  {[
                    { key: 'hasInvestments', state: hasInvestments, setter: setHasInvestments },
                    { key: 'hasBudget', state: hasBudget, setter: setHasBudget },
                    { key: 'hasWill', state: hasWill, setter: setHasWill },
                  ].map(({ key, state, setter }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t(`score.${key}`)}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setter(true)} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", state === true ? "bg-emerald-500 text-white border-emerald-500" : "")} style={state !== true ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-${key}-yes`}>{t('score.yes')}</button>
                        <button onClick={() => setter(false)} className={cn("py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] w-full", state === false ? "bg-red-500 text-white border-red-500" : "")} style={state !== false ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-${key}-no`}>{t('score.no')}</button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button onClick={handleCalculate} className="flex-grow bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold" data-testid="button-calculate-score">{t('score.calculate')}</Button>
                    <Button variant="outline" onClick={handleReset} style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }} data-testid="button-reset-score"><RotateCcw className="h-4 w-4" /></Button>
                  </div>

                  <div className="pt-4 flex items-center gap-2 text-[10px] sm:text-xs p-3 rounded-lg" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}>
                    <Lock className="h-3 w-3 text-[#D4AF37]/50 flex-shrink-0" />
                    <span>{t('calc.privacy.badge')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-6" ref={resultsRef}>
              {calculated && (
                <>
                  <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                    <CardContent className="p-6 sm:p-8">
                      <div className="text-center mb-4">
                        <p className="text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>{t('score.yourScore')}</p>
                        <div className="relative w-48 h-48 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={gaugeData} barSize={16}>
                              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: chartColors.radialBg }} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold" style={{ color: getScoreColor(score.total) }} data-testid="text-score-value">{score.total}</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>/100</span>
                          </div>
                        </div>
                        <p className="text-lg font-bold mt-2" style={{ color: getScoreColor(score.total) }} data-testid="text-score-label">{getScoreLabel(score.total)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <HeartPulse className="h-5 w-5 text-emerald-400" />
                          <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('ins.health.title')}</CardTitle>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400" data-testid="text-plan-type">{insuranceRec.planType}</span>
                      </div>
                      <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('ins.health.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-[10px] uppercase tracking-wider text-emerald-400/60 mb-1">{t('ins.health.recommended')}</p>
                          <p className="text-2xl sm:text-3xl font-bold text-emerald-400" data-testid="text-health-cover">{formatINR(insuranceRec.healthCover)}</p>
                        </div>
                        <div className="p-5 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.premium')}</p>
                          <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="text-health-premium">{formatINR(insuranceRec.healthPremium)}<span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>/{t('ins.perYear')}</span></p>
                        </div>
                        <div className="p-5 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.familySize')}</p>
                          <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="text-family-members">{insuranceRec.familyMembers}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('ins.health.members')}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                        <p className="text-xs font-bold text-emerald-400/60 uppercase tracking-wider mb-3">{t('ins.health.coverBreakdown')}</p>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {insuranceRec.healthBreakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{idx > 0 && insuranceRec.healthBreakdown.length > 1 ? '+ ' : ''}{formatINR(item.amount)}</span>
                            </div>
                          ))}
                          <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <span className="text-emerald-400 font-bold">{t('ins.health.totalCover')}</span>
                            <span className="text-emerald-400 font-bold font-mono">{formatINR(insuranceRec.healthCover)}</span>
                          </div>
                        </div>
                      </div>

                      {insuranceRec.existingHealth > 0 && (
                        <div className={cn("p-4 rounded-xl border", insuranceRec.healthSufficient ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                          <div className="flex items-center gap-2 mb-3">
                            {insuranceRec.healthSufficient ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
                            <p className={cn("text-sm font-bold", insuranceRec.healthSufficient ? "text-emerald-400" : "text-amber-400")} data-testid="text-health-verdict">
                              {insuranceRec.healthSufficient ? t('ins.verdict.sufficient') : t('ins.verdict.insufficient')}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{t('ins.verdict.yourCover')}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }} data-testid="text-existing-health">{formatINR(insuranceRec.existingHealth)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{t('ins.verdict.recommended')}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatINR(insuranceRec.healthCover)}</span>
                            </div>
                            {!insuranceRec.healthSufficient && (
                              <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <span className="text-amber-400 font-bold">{t('ins.verdict.gap')}</span>
                                <span className="text-amber-400 font-bold font-mono" data-testid="text-health-gap">{formatINR(insuranceRec.healthGap)}</span>
                              </div>
                            )}
                            {insuranceRec.healthSufficient && (
                              <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <span className="text-emerald-400 font-bold">{t('ins.verdict.surplus')}</span>
                                <span className="text-emerald-400 font-bold font-mono" data-testid="text-health-surplus">{formatINR(insuranceRec.existingHealth - insuranceRec.healthCover)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{t('ins.howCalculated')}</p>
                        {insuranceRec.healthReason.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <CheckCircle className="h-4 w-4 text-emerald-400/50 flex-shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>{t('ins.health.disclaimer')}</p>
                    </CardContent>
                  </Card>

                  {insuranceRec.hasParentsCover && (
                    <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }} data-testid="card-parents-health">
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <HeartPulse className="h-5 w-5 text-orange-400" />
                            <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('ins.parents.title')}</CardTitle>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-orange-500/15 text-orange-400" data-testid="text-parents-plan-type">{t('ins.parents.planType')}</span>
                        </div>
                        <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('ins.parents.subtitle')}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <p className="text-[10px] uppercase tracking-wider text-orange-400/60 mb-1">{t('ins.health.recommended')}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-orange-400" data-testid="text-parents-cover">{formatINR(insuranceRec.parentsCover)}</p>
                          </div>
                          <div className="p-5 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{t('ins.health.premium')}</p>
                            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="text-parents-premium">{formatINR(insuranceRec.parentsPremium)}<span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>/{t('ins.perYear')}</span></p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                          <p className="text-xs font-bold text-orange-400/60 uppercase tracking-wider mb-3">{t('ins.parents.breakdown')}</p>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {insuranceRec.parentsBreakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{idx > 0 ? '+ ' : ''}{formatINR(item.amount)}</span>
                              </div>
                            ))}
                            <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                              <span className="text-orange-400 font-bold">{t('ins.health.totalCover')}</span>
                              <span className="text-orange-400 font-bold font-mono">{formatINR(insuranceRec.parentsCover)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-400/80 leading-relaxed">{t('ins.parents.disclaimer')}</p>
                          </div>
                        </div>

                        <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>{t('ins.health.disclaimer')}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('ins.term.title')}</CardTitle>
                      </div>
                      <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('ins.term.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <p className="text-[10px] uppercase tracking-wider text-blue-400/60 mb-1">{t('ins.term.recommended')}</p>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-400" data-testid="text-term-cover">{formatINR(insuranceRec.termCover)}</p>
                        </div>
                        <div className="p-5 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{t('ins.term.premium')}</p>
                          <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="text-term-premium">{formatINR(insuranceRec.termPremium)}<span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>/{t('ins.perYear')}</span></p>
                        </div>
                      </div>
                      {insuranceRec.existingTerm > 0 && (
                        <div className={cn("p-4 rounded-xl border", insuranceRec.termSufficient ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                          <div className="flex items-center gap-2 mb-3">
                            {insuranceRec.termSufficient ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
                            <p className={cn("text-sm font-bold", insuranceRec.termSufficient ? "text-emerald-400" : "text-amber-400")} data-testid="text-term-verdict">
                              {insuranceRec.termSufficient ? t('ins.verdict.sufficient') : t('ins.verdict.insufficient')}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{t('ins.verdict.yourCover')}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }} data-testid="text-existing-term">{formatINR(insuranceRec.existingTerm)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{t('ins.verdict.recommended')}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatINR(insuranceRec.termCover)}</span>
                            </div>
                            {!insuranceRec.termSufficient && (
                              <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <span className="text-amber-400 font-bold">{t('ins.verdict.gap')}</span>
                                <span className="text-amber-400 font-bold font-mono" data-testid="text-term-gap">{formatINR(insuranceRec.termGap)}</span>
                              </div>
                            )}
                            {insuranceRec.termSufficient && (
                              <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <span className="text-emerald-400 font-bold">{t('ins.verdict.surplus')}</span>
                                <span className="text-emerald-400 font-bold font-mono" data-testid="text-term-surplus">{formatINR(insuranceRec.existingTerm - insuranceRec.termCover)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{t('ins.howCalculated')}</p>
                        {insuranceRec.termReason.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <CheckCircle className="h-4 w-4 text-blue-400/50 flex-shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                        <p className="text-xs font-bold text-[#D4AF37]/60 uppercase tracking-wider mb-3">{t('ins.term.formula')}</p>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span style={{ color: 'var(--text-secondary)' }}>{t('ins.term.incomeReplace')}</span>
                            <span className="font-mono" style={{ color: 'var(--text-primary)' }} data-testid="text-term-income-replace">{formatINR((parseFloat(monthlyIncome) || 0) * 12 * 10)}</span>
                          </div>
                          {(parseFloat(totalDebt) || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{t('ins.term.debtCover')}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>+ {formatINR(parseFloat(totalDebt) || 0)}</span>
                            </div>
                          )}
                          {(parseInt(numChildren) || 0) > 0 && (
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--text-secondary)' }}>{t('ins.term.childEdu')}</span>
                              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>+ {formatINR((parseInt(numChildren) || 0) * 2500000)}</span>
                            </div>
                          )}
                          <div className="pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <span className="text-[#D4AF37] font-bold">{t('ins.term.totalNeed')}</span>
                            <span className="text-[#D4AF37] font-bold font-mono">{formatINR(insuranceRec.termCover)}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>{t('ins.term.disclaimer')}</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('score.breakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.gridStroke} />
                            <XAxis type="number" domain={[0, 20]} stroke={chartColors.axisStroke} tick={{ fill: chartColors.tickFill }} />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: chartColors.tickFill }} />
                            <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipColor }} formatter={(value: number) => [`${value}`, 'Score']} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {breakdownData.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('score.recommendations')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }} data-testid={`recommendation-${idx}`}>
                          {rec.icon === 'good' ? (<CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />) : (<AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />)}
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}

              {!calculated && (
                <div className="p-8 sm:p-16 text-center rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <Award className="h-16 w-16 text-[#D4AF37]/20 mx-auto mb-4" />
                  <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t('score.card.desc')}</p>
                  <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{t('score.insuranceNote')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
