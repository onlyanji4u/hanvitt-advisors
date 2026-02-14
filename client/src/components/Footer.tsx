import { Link } from "wouter";
import { ShieldCheck, Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function Footer() {
  const { t } = useLanguage();

  const toolLinks = [
    { href: "/savings-lab", label: t('nav.savingsLab') },
    { href: "/wealth-tracker", label: t('nav.wealthTracker') },
    { href: "/fin-score", label: t('nav.finScore') },
  ];

  return (
    <footer className="py-8 sm:py-10" style={{ background: 'var(--page-bg)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center h-9 w-9 rounded-md bg-[#D4AF37] text-[#1a2332] font-bold text-lg" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>H</div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>Hanvitt Advisors</span>
                <span className="text-[8px] font-medium uppercase tracking-[0.25em] leading-none text-[#D4AF37]">Guiding Wealth</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#D4AF37] mb-4">{t('footer.quickLinks')}</h4>
            <div className="space-y-2">
              {toolLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm hover:text-[#D4AF37] transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#D4AF37] mb-4">{t('footer.contact')}</h4>
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#D4AF37]/50 flex-shrink-0" />
                <span className="break-words">Manikonda, Hyderabad - 500089</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#D4AF37]/50 flex-shrink-0" />
                <a href="tel:9256192939" className="hover:text-[#D4AF37] transition-colors">9256 192939</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#D4AF37]/50 flex-shrink-0" />
                <a href="mailto:help@hanvitt.in" className="hover:text-[#D4AF37] transition-colors">help@hanvitt.in</a>
              </div>
              <p className="text-[#D4AF37]/60 font-medium text-xs">{t('footer.claims')}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest text-[#D4AF37] mb-4">{t('footer.certifications')}</h4>
            <div className="flex items-start gap-3" style={{ color: 'var(--text-tertiary)' }}>
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]/50 shrink-0" />
              <p className="text-xs leading-relaxed">
                {t('trust.description')}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center text-xs space-y-2" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
          <p className="text-[#D4AF37]/40">{t('footer.disclaimer')}</p>
          <p>{t('footer.regulatory')}</p>
          <p>&copy; {new Date().getFullYear()} Hanvitt Advisors. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
