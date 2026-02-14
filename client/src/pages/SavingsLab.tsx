import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import DOMPurify from "dompurify";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import { TrendingUp } from "lucide-react";
import { amountToWords } from "@/lib/amount-words";

export default function SavingsLab() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [interestRate, setInterestRate] = useState(7);
  const [years, setYears] = useState(20);

  const data = useMemo(() => {
    const chartData = [];
    let currentBalance = initialAmount;
    let totalInvested = initialAmount;

    for (let year = 0; year <= years; year++) {
      chartData.push({
        year,
        balance: Math.round(currentBalance),
        invested: Math.round(totalInvested),
        interest: Math.round(currentBalance - totalInvested)
      });

      for (let m = 0; m < 12; m++) {
        currentBalance = currentBalance * (1 + (interestRate / 100) / 12) + monthlyContribution;
        totalInvested += monthlyContribution;
      }
    }
    return chartData;
  }, [initialAmount, monthlyContribution, interestRate, years]);

  const finalBalance = data[data.length - 1].balance;
  const totalInterest = data[data.length - 1].interest;

  // Chart color configurations based on theme
  const chartColors = {
    xAxisTick: theme === 'light' ? 'rgba(0,0,0,0.4)' : '#ffffff40',
    yAxisTick: theme === 'light' ? 'rgba(0,0,0,0.4)' : '#ffffff40',
    gridStroke: theme === 'light' ? 'rgba(0,0,0,0.08)' : '#ffffff08',
    tooltipBg: theme === 'light' ? '#ffffff' : '#131a24',
    tooltipBorder: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    tooltipColor: theme === 'light' ? '#1a2332' : '#fff',
    legendColor: theme === 'light' ? 'rgba(26,35,50,0.7)' : '#ffffff60'
  };

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

  return (
    <div style={{ background: 'var(--page-bg)' }} className="min-h-screen flex flex-col">
      <Navigation />

      <section style={{ borderColor: 'var(--border-subtle)' }} className="py-8 sm:py-10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl md:text-3xl lg:text-4xl font-bold">{t('savings.title')}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm sm:text-base">{t('savings.desc')}</p>
        </div>
      </section>

      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <CalculatorCard
          title={t('savings.card.title')}
          description={t('savings.card.desc')}
          result={
            <div className="w-full h-full min-h-[400px] flex flex-col">
              <div style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)' }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl border">
                <div className="p-2">
                  <p style={{ color: 'var(--text-secondary)' }} className="text-xs uppercase tracking-wider mb-1">{t('savings.totalValue')}</p>
                  <p style={{ color: 'var(--text-primary)' }} className="text-xl sm:text-2xl font-bold">
                    ₹{finalBalance.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-2">
                  <p style={{ color: 'var(--text-secondary)' }} className="text-xs uppercase tracking-wider mb-1">{t('savings.totalInterest')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#D4AF37]">
                    ₹{totalInterest.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" stroke={theme === 'light' ? 'rgba(0,0,0,0.1)' : '#ffffff20'} tick={{ fill: chartColors.xAxisTick, fontSize: 11 }} />
                    <YAxis
                      stroke={theme === 'light' ? 'rgba(0,0,0,0.1)' : '#ffffff20'}
                      tick={{ fill: chartColors.yAxisTick, fontSize: 11 }}
                      tickFormatter={(value) => {
                        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
                        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                        return `₹${value / 1000}k`;
                      }}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridStroke} />
                    <Tooltip
                      contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '8px', color: chartColors.tooltipColor }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, "Amount"]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend wrapperStyle={{ color: chartColors.legendColor }} />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" name={t('savings.balance')} />
                    <Area type="monotone" dataKey="invested" stroke="#D4AF37" fillOpacity={1} fill="url(#colorInvested)" name={t('savings.principal')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="initial" style={{ color: 'var(--text-secondary)' }}>{t('savings.initial')} (₹)</Label>
              <Input id="initial" type="number" value={initialAmount} onChange={handleNumberInput(setInitialAmount, 1000000000)} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} className="font-mono placeholder:text-white/40" max={1000000000} data-testid="input-initial-deposit" />
              {amountToWords(initialAmount) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(initialAmount)}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="monthly" style={{ color: 'var(--text-secondary)' }}>{t('savings.monthly')} (₹)</Label>
              <Input id="monthly" type="number" value={monthlyContribution} onChange={handleNumberInput(setMonthlyContribution, 10000000)} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} className="font-mono placeholder:text-white/40" max={10000000} data-testid="input-monthly-contribution" />
              {amountToWords(monthlyContribution) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(monthlyContribution)}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="rate" style={{ color: 'var(--text-secondary)' }}>{t('savings.rate')} (%)</Label>
                <span className="font-mono font-bold text-[#D4AF37]">{interestRate}%</span>
              </div>
              <Slider id="rate" min={1} max={15} step={0.1} value={[interestRate]} onValueChange={(val) => setInterestRate(val[0])} className="py-4" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label htmlFor="years" style={{ color: 'var(--text-secondary)' }}>{t('savings.period')} ({t('calc.years')})</Label>
                <span style={{ color: 'var(--text-primary)' }} className="font-mono font-bold">{years} {t('calc.years')}</span>
              </div>
              <Slider id="years" min={1} max={50} step={1} value={[years]} onValueChange={(val) => setYears(val[0])} className="py-4" />
            </div>
          </div>
        </CalculatorCard>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
