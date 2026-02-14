import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DOMPurify from "dompurify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import { BarChart3 } from "lucide-react";

export default function DimeTracker() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [debt, setDebt] = useState(5000);
  const [income, setIncome] = useState(100000);
  const [mortgage, setMortgage] = useState(200000);
  const [education, setEducation] = useState(50000);
  const [assets, setAssets] = useState(25000);

  const totalNeeds = debt + income + mortgage + education;
  const gap = Math.max(0, totalNeeds - assets);

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

  const chartData = [
    { name: "Total Needs", value: totalNeeds },
    { name: "Existing Assets", value: assets },
    { name: "Protection Gap", value: gap },
  ];

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
            <div className="p-2 rounded-lg bg-purple-500/10">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('dime.title')}</h1>
          </div>
          <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>{t('dime.desc')}</p>
        </div>
      </section>

      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <CalculatorCard
          title={t('dime.card.title')}
          description={t('dime.card.desc')}
          result={
            <div className="w-full h-full flex flex-col p-4">
              <div className="mb-6 p-4 sm:p-6 rounded-xl text-center" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-[10px] sm:text-sm font-medium mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('dime.protectionGap')}</p>
                <h3 className="text-2xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>₹{gap.toLocaleString('en-IN')}</h3>
                {gap > 0 ? (
                  <p className="text-[10px] sm:text-sm text-red-400 font-medium">{t('dime.recommended')}</p>
                ) : (
                  <p className="text-[10px] sm:text-sm text-emerald-400 font-medium">{t('dime.covered')}</p>
                )}
              </div>
              <div className="flex-grow min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#ffffff08' : '#00000008'} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: isDark ? '#ffffff40' : '#1a233266' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : index === 1 ? "#64748b" : "#D4AF37"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debt" className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('dime.debt')}</span>
                <span className="font-normal" style={{ color: 'var(--text-muted)' }}>{t('dime.debtDesc')}</span>
              </Label>
              <Input id="debt" type="number" value={debt} onChange={handleNumberInput(setDebt, 100000000)} max={100000000} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
              <p className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{t('calc.max')}: ₹10 Cr</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income" className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('dime.income')}</span>
                <span className="font-normal" style={{ color: 'var(--text-muted)' }}>{t('dime.incomeDesc')}</span>
              </Label>
              <Input id="income" type="number" value={income} onChange={handleNumberInput(setIncome, 500000000)} max={500000000} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
              <p className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{t('calc.max')}: ₹50 Cr</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mortgage" className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('dime.mortgage')}</span>
                <span className="font-normal" style={{ color: 'var(--text-muted)' }}>{t('dime.mortgageDesc')}</span>
              </Label>
              <Input id="mortgage" type="number" value={mortgage} onChange={handleNumberInput(setMortgage, 500000000)} max={500000000} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
              <p className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{t('calc.max')}: ₹50 Cr</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="education" className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('dime.education')}</span>
                <span className="font-normal" style={{ color: 'var(--text-muted)' }}>{t('dime.educationDesc')}</span>
              </Label>
              <Input id="education" type="number" value={education} onChange={handleNumberInput(setEducation, 100000000)} max={100000000} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
              <p className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{t('calc.max')}: ₹10 Cr</p>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="space-y-2">
                <Label htmlFor="assets" className="text-[#D4AF37] font-bold">{t('dime.assets')}</Label>
                <Input id="assets" type="number" value={assets} onChange={handleNumberInput(setAssets, 500000000)} className="border-[#D4AF37]/30" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)' }} max={500000000} />
                <p className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{t('calc.max')}: ₹50 Cr</p>
              </div>
            </div>
          </div>
        </CalculatorCard>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
