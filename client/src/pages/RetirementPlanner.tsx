import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DOMPurify from "dompurify";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Shield,
  PiggyBank,
  BarChart3,
  Loader2,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { amountToWords } from "@/lib/amount-words";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface YearProjection {
  age: number;
  year: number;
  corpus: number;
  annualContribution: number;
  annualReturn: number;
}

interface RetirementResult {
  requiredCorpus: number;
  projectedCorpus: number;
  shortfall: number;
  monthlyExpensesAtRetirement: number;
  additionalMonthlySIPNeeded: number;
  savingsRate: number;
  yearsToRetirement: number;
  retirementDurationYears: number;
  yearByYearProjection: YearProjection[];
}

interface AIRecommendation {
  riskAssessment: string;
  savingsImprovementAdvice: string;
  inflationProtectionAdvice: string;
  assetAllocationSuggestion: string;
  retirementReadinessScore: number;
  behavioralAdvice: string;
  disclaimer: string;
}

export default function RetirementPlanner() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpenses, setMonthlyExpenses] = useState("50000");
  const [currentSavings, setCurrentSavings] = useState("500000");
  const [monthlySIP, setMonthlySIP] = useState("10000");
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(6);
  const [postRetirementReturn, setPostRetirementReturn] = useState(8);
  const [riskTolerance, setRiskTolerance] = useState<"low" | "moderate" | "high">("moderate");

  const [result, setResult] = useState<RetirementResult | null>(null);
  const [aiInsights, setAiInsights] = useState<AIRecommendation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProjection, setShowProjection] = useState(false);

  const chartColors = {
    xAxisTick: theme === "light" ? "rgba(0,0,0,0.4)" : "#ffffff40",
    yAxisTick: theme === "light" ? "rgba(0,0,0,0.4)" : "#ffffff40",
    gridStroke: theme === "light" ? "rgba(0,0,0,0.08)" : "#ffffff08",
    tooltipBg: theme === "light" ? "#ffffff" : "#131a24",
    tooltipBorder: theme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
    tooltipColor: theme === "light" ? "#1a2332" : "#fff",
    legendColor: theme === "light" ? "rgba(26,35,50,0.7)" : "#ffffff60",
  };

  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberInput =
    (setter: (val: string) => void, max: number = 1000000000) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawVal = e.target.value.replace(/[^0-9]/g, '');
      if (rawVal === "") { setter(""); return; }
      const val = parseInt(rawVal, 10);
      if (!isNaN(val)) {
        setter(String(Math.min(Math.max(0, val), max)));
      }
    };

  const handleCalculate = async () => {
    setCalculating(true);
    setError(null);
    setAiInsights(null);

    try {
      const response = await apiRequest("POST", "/api/retirement/calculate", {
        currentAge,
        retirementAge,
        lifeExpectancy,
        monthlyExpenses: parseFloat(monthlyExpenses) || 0,
        currentSavings: parseFloat(currentSavings) || 0,
        monthlySIP: parseFloat(monthlySIP) || 0,
        expectedReturn,
        inflationRate,
        postRetirementReturn,
      });
      const data: RetirementResult = await response.json();
      setResult(data);

      setAiLoading(true);
      try {
        const aiResponse = await apiRequest("POST", "/api/retirement/ai-analysis", {
          calculationResult: {
            requiredCorpus: data.requiredCorpus,
            projectedCorpus: data.projectedCorpus,
            shortfall: data.shortfall,
            monthlyExpensesAtRetirement: data.monthlyExpensesAtRetirement,
            additionalMonthlySIPNeeded: data.additionalMonthlySIPNeeded,
            savingsRate: data.savingsRate,
            yearByYearProjection: data.yearByYearProjection,
          },
          userProfile: {
            riskTolerance,
          },
        });
        const aiData = await aiResponse.json();
        setAiInsights(aiData.recommendations);
      } catch {
        console.warn("AI insights unavailable");
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const formatINR = (val: number) => `₹${val.toLocaleString("en-IN")}`;
  const formatCrLk = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(0)}k`;
  };

  const hasShortfall = result ? result.shortfall > 0 : false;
  const readinessPercent = aiInsights?.retirementReadinessScore ?? (result ? (result.shortfall <= 0 ? 85 : Math.max(10, Math.round((result.projectedCorpus / result.requiredCorpus) * 100))) : 0);

  return (
    <div style={{ background: "var(--page-bg)" }} className="min-h-screen flex flex-col">
      <Navigation />

      <section style={{ borderColor: "var(--border-subtle)" }} className="py-8 sm:py-10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Target className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 style={{ color: "var(--text-primary)" }} className="text-2xl md:text-3xl lg:text-4xl font-bold">
              {t("retirement.title")}
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)" }} className="mt-2 text-sm sm:text-base">
            {t("retirement.desc")}
          </p>
        </div>
      </section>

      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Input Form */}
          <Card className="lg:col-span-4 border-[#D4AF37]/20 shadow-xl relative z-20 flex flex-col h-fit" style={{ background: "var(--page-bg-alt)" }}>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-[#D4AF37] rounded-t-xl" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
                {t("retirement.form.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.currentAge")}</Label>
                <div className="flex items-center gap-3">
                  <Slider min={18} max={70} step={1} value={[currentAge]} onValueChange={(v) => setCurrentAge(v[0])} className="flex-grow" />
                  <span className="font-mono font-bold text-[#D4AF37] w-8 text-right" data-testid="text-current-age">{currentAge}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.retirementAge")}</Label>
                <div className="flex items-center gap-3">
                  <Slider min={Math.max(currentAge + 1, 30)} max={85} step={1} value={[retirementAge]} onValueChange={(v) => setRetirementAge(v[0])} className="flex-grow" />
                  <span className="font-mono font-bold text-[#D4AF37] w-8 text-right" data-testid="text-retirement-age">{retirementAge}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.lifeExpectancy")}</Label>
                <div className="flex items-center gap-3">
                  <Slider min={Math.max(retirementAge + 1, 60)} max={110} step={1} value={[lifeExpectancy]} onValueChange={(v) => setLifeExpectancy(v[0])} className="flex-grow" />
                  <span className="font-mono font-bold w-8 text-right" style={{ color: "var(--text-primary)" }} data-testid="text-life-expectancy">{lifeExpectancy}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.monthlyExpenses")} (₹)</Label>
                <Input type="number" value={monthlyExpenses} onChange={handleNumberInput(setMonthlyExpenses, 100000000)} onKeyDown={blockNonNumericKeys} style={{ background: "var(--glass-bg)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} className="font-mono" data-testid="input-monthly-expenses" />
                {amountToWords(monthlyExpenses) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(monthlyExpenses)}</p>}
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.currentSavings")} (₹)</Label>
                <Input type="number" value={currentSavings} onChange={handleNumberInput(setCurrentSavings)} onKeyDown={blockNonNumericKeys} style={{ background: "var(--glass-bg)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} className="font-mono" data-testid="input-current-savings" />
                {amountToWords(currentSavings) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(currentSavings)}</p>}
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.monthlySIP")} (₹)</Label>
                <Input type="number" value={monthlySIP} onChange={handleNumberInput(setMonthlySIP, 100000000)} onKeyDown={blockNonNumericKeys} style={{ background: "var(--glass-bg)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} className="font-mono" data-testid="input-monthly-sip" />
                {amountToWords(monthlySIP) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(monthlySIP)}</p>}
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.expectedReturn")} (%)</Label>
                <div className="flex items-center gap-3">
                  <Slider min={1} max={20} step={0.5} value={[expectedReturn]} onValueChange={(v) => setExpectedReturn(v[0])} className="flex-grow" />
                  <span className="font-mono font-bold text-[#D4AF37] w-12 text-right">{expectedReturn}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.inflationRate")} (%)</Label>
                <div className="flex items-center gap-3">
                  <Slider min={1} max={15} step={0.5} value={[inflationRate]} onValueChange={(v) => setInflationRate(v[0])} className="flex-grow" />
                  <span className="font-mono font-bold w-12 text-right" style={{ color: "var(--text-primary)" }}>{inflationRate}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.postRetirementReturn")} (%)</Label>
                <div className="flex items-center gap-3">
                  <Slider min={1} max={15} step={0.5} value={[postRetirementReturn]} onValueChange={(v) => setPostRetirementReturn(v[0])} className="flex-grow" />
                  <span className="font-mono font-bold w-12 text-right" style={{ color: "var(--text-primary)" }}>{postRetirementReturn}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label style={{ color: "var(--text-secondary)" }}>{t("retirement.form.riskTolerance")}</Label>
                <div className="flex gap-2">
                  {(["low", "moderate", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskTolerance(level)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${riskTolerance === level ? "bg-[#D4AF37] text-black" : ""}`}
                      style={riskTolerance !== level ? { background: "var(--glass-bg)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" } : {}}
                      data-testid={`button-risk-${level}`}
                    >
                      {t(`retirement.risk.${level}`)}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCalculate} disabled={calculating} className="w-full bg-gradient-to-r from-emerald-600 to-[#D4AF37] hover:from-emerald-500 hover:to-[#f0d060] text-black font-bold py-3 text-base" data-testid="button-calculate-retirement">
                {calculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("retirement.calculating")}
                  </>
                ) : (
                  t("retirement.calculate")
                )}
              </Button>

              <div className="pt-2 flex items-start gap-2 text-[10px] p-2 rounded-lg" style={{ color: "var(--text-tertiary)", background: "var(--glass-bg)" }}>
                <Lock className="h-3 w-3 text-[#D4AF37]/50 mt-0.5 flex-shrink-0" />
                <span>{t("retirement.privacy")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center gap-2" data-testid="text-error">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {!result && !calculating && (
              <div className="flex-grow rounded-xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                <Target className="h-16 w-16 mb-4 opacity-20" style={{ color: "var(--text-secondary)" }} />
                <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("retirement.empty")}
                </p>
                <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
                  {t("retirement.emptyHint")}
                </p>
              </div>
            )}

            {calculating && (
              <div className="flex-grow rounded-xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[400px]" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37] mb-4" />
                <p style={{ color: "var(--text-secondary)" }}>{t("retirement.calculating")}...</p>
              </div>
            )}

            {result && !calculating && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <SummaryCard icon={<Target className="h-4 w-4" />} label={t("retirement.result.required")} value={amountToWords(result.requiredCorpus)} color="text-blue-400" />
                  <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label={t("retirement.result.projected")} value={amountToWords(result.projectedCorpus)} color="text-emerald-400" />
                  <SummaryCard
                    icon={hasShortfall ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    label={hasShortfall ? t("retirement.result.shortfall") : t("retirement.result.surplus")}
                    value={amountToWords(hasShortfall ? result.shortfall : result.projectedCorpus - result.requiredCorpus)}
                    color={hasShortfall ? "text-red-400" : "text-emerald-400"}
                  />
                  <SummaryCard icon={<PiggyBank className="h-4 w-4" />} label={t("retirement.result.monthlyAtRetirement")} value={amountToWords(result.monthlyExpensesAtRetirement)} color="text-[#D4AF37]" />
                </div>

                {hasShortfall && result.additionalMonthlySIPNeeded > 0 && (
                  <div className="p-4 rounded-xl border border-amber-500/30 flex items-center gap-3" style={{ background: "var(--glass-bg)" }} data-testid="text-additional-sip">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {t("retirement.result.additionalSIP")}{" "}
                      <span className="font-bold text-[#D4AF37]">{formatINR(result.additionalMonthlySIPNeeded)}/mo</span>
                    </p>
                  </div>
                )}

                {/* Corpus Growth Chart */}
                <Card className="shadow-xl border-0" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                  <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
                    <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      {t("retirement.chart.corpusGrowth")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.yearByYearProjection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="age" stroke={theme === "light" ? "rgba(0,0,0,0.1)" : "#ffffff20"} tick={{ fill: chartColors.xAxisTick, fontSize: 11 }} label={{ value: t("retirement.chart.age"), position: "insideBottom", offset: -5, fill: chartColors.legendColor, fontSize: 11 }} />
                          <YAxis stroke={theme === "light" ? "rgba(0,0,0,0.1)" : "#ffffff20"} tick={{ fill: chartColors.yAxisTick, fontSize: 11 }} tickFormatter={formatCrLk} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridStroke} />
                          <Tooltip
                            contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "8px", color: chartColors.tooltipColor }}
                            formatter={(value: number) => [formatINR(value), ""]}
                            labelFormatter={(label) => `${t("retirement.chart.age")}: ${label}`}
                          />
                          <Area type="monotone" dataKey="corpus" stroke="#10b981" fillOpacity={1} fill="url(#corpusGrad)" name={t("retirement.chart.corpus")} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Year-by-Year Breakdown */}
                <Card className="shadow-xl border-0" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                  <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
                    <button onClick={() => setShowProjection(!showProjection)} className="flex items-center gap-2 w-full text-left" data-testid="button-toggle-projection">
                      <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
                        {t("retirement.chart.yearByYear")}
                      </CardTitle>
                      {showProjection ? <ChevronUp className="h-4 w-4 ml-auto" style={{ color: "var(--text-secondary)" }} /> : <ChevronDown className="h-4 w-4 ml-auto" style={{ color: "var(--text-secondary)" }} />}
                    </button>
                  </CardHeader>
                  <AnimatePresence>
                    {showProjection && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={result.yearByYearProjection.filter((_, i) => i % Math.ceil(result.yearByYearProjection.length / 15) === 0 || i === result.yearByYearProjection.length - 1)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="age" stroke={theme === "light" ? "rgba(0,0,0,0.1)" : "#ffffff20"} tick={{ fill: chartColors.xAxisTick, fontSize: 11 }} />
                                <YAxis stroke={theme === "light" ? "rgba(0,0,0,0.1)" : "#ffffff20"} tick={{ fill: chartColors.yAxisTick, fontSize: 11 }} tickFormatter={formatCrLk} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridStroke} />
                                <Tooltip
                                  contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: "8px", color: chartColors.tooltipColor }}
                                  formatter={(value: number, name: string) => [formatINR(value), name === "annualContribution" ? t("retirement.chart.contribution") : t("retirement.chart.returns")]}
                                  labelFormatter={(label) => `${t("retirement.chart.age")}: ${label}`}
                                />
                                <Legend wrapperStyle={{ color: chartColors.legendColor }} />
                                <Bar dataKey="annualContribution" name={t("retirement.chart.contribution")} stackId="a" fill="#D4AF37" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="annualReturn" name={t("retirement.chart.returns")} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Readiness Gauge */}
                <Card className="shadow-xl border-0" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                    <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <Shield className="h-4 w-4 text-emerald-400" />
                      {t("retirement.readiness.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center gap-6">
                      <div className="relative w-28 h-28 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="42" fill="none" stroke={theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"} strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={readinessPercent >= 70 ? "#10b981" : readinessPercent >= 40 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="8"
                            strokeDasharray={`${(readinessPercent / 100) * 264} 264`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }} data-testid="text-readiness-score">
                            {readinessPercent}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {readinessPercent >= 70 ? t("retirement.readiness.good") : readinessPercent >= 40 ? t("retirement.readiness.moderate") : t("retirement.readiness.needsWork")}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                          {t("retirement.readiness.desc")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                {aiLoading && (
                  <Card className="shadow-xl border-0" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                    <CardContent className="p-6 flex items-center justify-center gap-3">
                      <Sparkles className="h-5 w-5 text-[#D4AF37] animate-pulse" />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {t("retirement.ai.loading")}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {aiInsights && !aiLoading && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="shadow-xl border-0 overflow-hidden" style={{ background: "var(--page-bg-alt)", border: "1px solid var(--border-subtle)" }}>
                      <div className="h-1 bg-gradient-to-r from-purple-500 via-[#D4AF37] to-emerald-500" />
                      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                        <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                          <Brain className="h-4 w-4 text-purple-400" />
                          {t("retirement.ai.title")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2 space-y-4">
                        <InsightCard icon={<Shield className="h-4 w-4 text-blue-400" />} title={t("retirement.ai.riskAssessment")} text={aiInsights.riskAssessment} />
                        <InsightCard icon={<PiggyBank className="h-4 w-4 text-emerald-400" />} title={t("retirement.ai.savingsAdvice")} text={aiInsights.savingsImprovementAdvice} />
                        <InsightCard icon={<TrendingUp className="h-4 w-4 text-amber-400" />} title={t("retirement.ai.inflationAdvice")} text={aiInsights.inflationProtectionAdvice} />
                        <InsightCard icon={<BarChart3 className="h-4 w-4 text-purple-400" />} title={t("retirement.ai.assetAllocation")} text={aiInsights.assetAllocationSuggestion} />
                        <InsightCard icon={<Brain className="h-4 w-4 text-[#D4AF37]" />} title={t("retirement.ai.behavioral")} text={aiInsights.behavioralAdvice} />

                        <p className="text-[10px] pt-2 italic" style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)" }}>
                          {aiInsights.disclaimer}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }}>
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-sm sm:text-base font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function InsightCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "var(--glass-bg)" }}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{text}</p>
    </div>
  );
}
