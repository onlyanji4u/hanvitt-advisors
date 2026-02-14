import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CalculatorCardProps {
  title: string;
  description: string;
  children: ReactNode;
  result?: ReactNode;
}

export function CalculatorCard({ title, description, children, result }: CalculatorCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
      <Card className="lg:col-span-4 border-[#D4AF37]/20 shadow-xl relative z-20 flex flex-col h-fit" style={{ background: 'var(--page-bg-alt)' }}>
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-t-xl" />
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl" style={{ color: 'var(--text-primary)' }}>{title}</CardTitle>
          <CardDescription className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0 flex-grow">
          {children}

          <div className="mt-6 sm:mt-8 pt-4 flex items-start sm:items-center gap-2 text-[10px] sm:text-xs p-2 sm:p-3 rounded-lg" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', background: 'var(--glass-bg)' }}>
            <Lock className="h-3 w-3 text-[#D4AF37]/50 mt-0.5 sm:mt-0 flex-shrink-0" />
            <span>Your financial data never leaves your browser. Zero-data retention policy.</span>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-8 flex flex-col">
        <div className="h-full rounded-xl shadow-xl p-4 sm:p-6 flex flex-col justify-center min-h-[300px] sm:min-h-[400px]" style={{ background: 'var(--page-bg-alt)', border: '1px solid var(--border-subtle)' }}>
          {result}
        </div>
      </div>
    </div>
  );
}
