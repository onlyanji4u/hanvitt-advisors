import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Plus, Trash2, Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { amountToWords } from "@/lib/amount-words";

interface Entry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

const COLORS = ['#D4AF37', '#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e11d48'];

const INCOME_CATEGORIES = ['salary', 'freelance', 'investment', 'rental', 'other_income'];
const EXPENSE_CATEGORIES = ['food', 'transport', 'utilities', 'rent', 'shopping', 'healthcare', 'education', 'entertainment', 'insurance', 'other_expense'];

function getStoredEntries(): Entry[] {
  try {
    const stored = localStorage.getItem('hanvitt-wealth-tracker');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveEntries(entries: Entry[]) {
  localStorage.setItem('hanvitt-wealth-tracker', JSON.stringify(entries));
}

export default function WealthTracker() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [entries, setEntries] = useState<Entry[]>(getStoredEntries);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const chartColors = useMemo(() => ({
    tickFill: isDark ? '#ffffff40' : 'rgba(0,0,0,0.4)',
    gridStroke: isDark ? '#ffffff08' : 'rgba(0,0,0,0.08)',
    tooltipBg: isDark ? '#131a24' : '#ffffff',
    tooltipColor: isDark ? '#fff' : '#1a2332',
    tooltipBorder: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    axisStroke: isDark ? '#ffffff20' : 'rgba(0,0,0,0.12)',
  }), [isDark]);

  const addEntry = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    const newEntry: Entry = { id: Date.now().toString(), type, category, amount: numAmount, description: description || t(`wealth.cat.${category}`), date };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setAmount('');
    setDescription('');
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const clearAll = () => {
    if (window.confirm(t('wealth.clearConfirm'))) {
      setEntries([]);
      saveEntries([]);
    }
  };

  const totalIncome = useMemo(() => entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0), [entries]);
  const totalExpenses = useMemo(() => entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0), [entries]);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const categoryData = useMemo(() => {
    const expenseEntries = entries.filter(e => e.type === 'expense');
    const grouped: Record<string, number> = {};
    expenseEntries.forEach(e => { grouped[e.category] = (grouped[e.category] || 0) + e.amount; });
    return Object.entries(grouped).map(([name, value]) => ({ name: t(`wealth.cat.${name}`), value }));
  }, [entries, t]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    entries.forEach(e => {
      const month = e.date.substring(0, 7);
      if (!months[month]) months[month] = { income: 0, expense: 0 };
      if (e.type === 'income') months[month].income += e.amount;
      else months[month].expense += e.amount;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, data]) => ({
      month: month.substring(5), [t('wealth.income')]: data.income, [t('wealth.expense')]: data.expense
    }));
  }, [entries, t]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <Navigation />

      <section className="py-8 sm:py-10 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Wallet className="h-6 w-6 text-orange-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('wealth.title')}</h1>
          </div>
          <p className="max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{t('wealth.desc')}</p>
        </div>
      </section>

      <section className="py-8 sm:py-12 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: TrendingUp, label: t('wealth.totalIncome'), value: `₹${totalIncome.toLocaleString('en-IN')}`, color: 'text-emerald-400', testId: 'text-total-income', iconBg: 'bg-emerald-500/10' },
              { icon: TrendingDown, label: t('wealth.totalExpenses'), value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: 'text-red-400', testId: 'text-total-expenses', iconBg: 'bg-red-500/10' },
              { icon: PiggyBank, label: t('wealth.netSavings'), value: `₹${netSavings.toLocaleString('en-IN')}`, color: netSavings >= 0 ? '' : 'text-red-400', testId: 'text-net-savings', iconBg: 'bg-blue-500/10' },
              { icon: Wallet, label: t('wealth.savingsRate'), value: `${savingsRate}%`, color: savingsRate >= 20 ? 'text-[#D4AF37]' : 'text-orange-400', testId: 'text-savings-rate', iconBg: 'bg-[#D4AF37]/10' },
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-xl text-center overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                <div className={cn("mx-auto mb-2 p-2 rounded-lg w-fit", stat.iconBg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                <p className={cn("text-lg sm:text-xl font-bold", stat.color)} style={!stat.color ? { color: 'var(--text-primary)' } : undefined} data-testid={stat.testId}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-t-xl" />
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>{t('wealth.card.title')}</CardTitle>
                  <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('wealth.card.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }} className={cn("py-2 px-3 rounded-lg border text-sm font-medium transition-all min-h-[40px] w-full", type === 'income' ? "bg-emerald-500 text-white border-emerald-500" : "")} style={type !== 'income' ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-type-income">{t('wealth.income')}</button>
                    <button onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }} className={cn("py-2 px-3 rounded-lg border text-sm font-medium transition-all min-h-[40px] w-full", type === 'expense' ? "bg-red-500 text-white border-red-500" : "")} style={type !== 'expense' ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid="button-type-expense">{t('wealth.expense')}</button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('wealth.category')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button key={cat} onClick={() => setCategory(cat)} className={cn("py-2 px-2 rounded-lg border text-xs font-medium transition-all min-h-[36px] w-full text-left", category === cat ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "")} style={category !== cat ? { background: 'var(--glass-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : undefined} data-testid={`button-category-${cat}`}>{t(`wealth.cat.${cat}`)}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('wealth.amount')}</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" className="placeholder:text-white/40" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} data-testid="input-amount" />
                    {amountToWords(amount) && <p className="text-[10px] text-[#D4AF37]/70 font-medium">{amountToWords(amount)}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('wealth.description')}</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t(`wealth.cat.${category}`)} className="placeholder:text-white/40" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} data-testid="input-description" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('wealth.date')}</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} data-testid="input-date" />
                  </div>

                  <Button onClick={addEntry} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black font-bold" data-testid="button-add-entry">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('wealth.add')}
                  </Button>

                  <div className="pt-4 flex items-center gap-2 text-[10px] sm:text-xs p-3 rounded-lg" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--glass-bg)' }}>
                    <Lock className="h-3 w-3 text-[#D4AF37]/50 flex-shrink-0" />
                    <span>{t('calc.privacy.badge')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-6">
              {categoryData.length > 0 && (
                <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('wealth.byCategory')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                            {categoryData.map((_, idx) => (<Cell key={idx} fill={COLORS[idx % COLORS.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: chartColors.tooltipBorder, borderRadius: '8px', color: chartColors.tooltipColor }} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {monthlyData.length > 0 && (
                <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('wealth.monthly')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                          <XAxis dataKey="month" stroke={chartColors.axisStroke} tick={{ fill: chartColors.tickFill }} />
                          <YAxis stroke={chartColors.axisStroke} tick={{ fill: chartColors.tickFill }} />
                          <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: chartColors.tooltipBorder, borderRadius: '8px', color: chartColors.tooltipColor }} formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                          <Bar dataKey={t('wealth.income')} fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={t('wealth.expense')} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-xl" style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t('wealth.recentEntries')}</CardTitle>
                  {entries.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAll} className="text-red-400 border-red-400/20 bg-red-500/10" data-testid="button-clear-all">
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t('wealth.clearAll')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {entries.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }} data-testid="text-no-entries">{t('wealth.noEntries')}</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {entries.slice(0, 20).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }} data-testid={`entry-${entry.id}`}>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", entry.type === 'income' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>{t(`wealth.${entry.type}`)}</span>
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.date}</span>
                            </div>
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{entry.description}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{t(`wealth.cat.${entry.category}`)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn("font-bold text-sm", entry.type === 'income' ? "text-emerald-400" : "text-red-400")}>{entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}</span>
                            <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="h-7 w-7" style={{ color: 'var(--text-secondary)' }} data-testid={`button-delete-${entry.id}`}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
