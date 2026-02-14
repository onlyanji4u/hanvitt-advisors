import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Phone, ChevronDown, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const toolLinks = [
    { href: "/savings-lab", label: t('nav.savingsLab') },
    { href: "/wealth-tracker", label: t('nav.wealthTracker') },
    { href: "/fin-score", label: t('nav.finScore') },
  ];

  const isToolPage = toolLinks.some(l => l.href === location);

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--nav-bg)', backdropFilter: 'blur(16px)' }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo">
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-[#D4AF37] text-[#1a2332] font-bold text-lg" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>H</div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text-primary)' }}>
              Hanvitt <span className="hidden sm:inline">Advisors</span>
            </span>
            <span className="text-[8px] font-medium uppercase tracking-[0.25em] leading-none hidden sm:block text-[#D4AF37]">Guiding Wealth</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Link href="/" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${location === '/' ? "bg-primary/10" : "hover:bg-primary/5"}`} style={{ color: location === '/' ? '#D4AF37' : 'var(--text-secondary)' }}>
            {t('nav.home')}
          </Link>

          <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
            <button className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${isToolPage ? "bg-primary/10" : "hover:bg-primary/5"}`} style={{ color: isToolPage ? '#D4AF37' : 'var(--text-secondary)' }} data-testid="button-tools-dropdown">
              {t('nav.tools')}
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 w-56 rounded-xl shadow-2xl py-2 z-50"
                  style={{ background: 'var(--page-bg-alt)', border: '1px solid var(--border-subtle)' }}
                >
                  {toolLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-primary/5"
                      style={{ color: location === link.href ? '#D4AF37' : 'var(--text-secondary)' }}
                      onClick={() => setToolsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/info" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${location === '/info' ? "bg-primary/10" : "hover:bg-primary/5"}`} style={{ color: location === '/info' ? '#D4AF37' : 'var(--text-secondary)' }}>
            {t('nav.info')}
          </Link>

          <Link href="/contact" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${location === '/contact' ? "bg-primary/10" : "hover:bg-primary/5"}`} style={{ color: location === '/contact' ? '#D4AF37' : 'var(--text-secondary)' }}>
            {t('nav.contact')}
          </Link>

          <div className="h-5 w-px mx-2" style={{ background: 'var(--border-subtle)' }} />

          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-full transition-all"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <div className="flex items-center rounded-full p-0.5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
            {(['en', 'hi', 'te'] as const).map((lang) => (
              <button
                key={lang}
                className={`h-7 px-2.5 text-xs font-medium rounded-full transition-all ${language === lang ? 'bg-[#D4AF37] text-black' : ''}`}
                style={language !== lang ? { color: 'var(--text-muted)' } : {}}
                onClick={() => setLanguage(lang)}
                data-testid={`button-lang-${lang}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <a href="tel:9256192939" className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black px-4 py-2 rounded-full ml-2 shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-shadow" data-testid="link-phone">
            <Phone className="h-3.5 w-3.5" />
            <span>Call Now</span>
          </a>
        </nav>

        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={toggleTheme}
            className="h-7 w-7 flex items-center justify-center rounded-full transition-all"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            data-testid="button-theme-toggle-mobile"
          >
            {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
          </button>
          <button
            className="h-7 px-2.5 text-[10px] font-medium rounded-full transition-all"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            onClick={() => {
              const langs: Array<'en' | 'hi' | 'te'> = ['en', 'hi', 'te'];
              const idx = langs.indexOf(language);
              setLanguage(langs[(idx + 1) % langs.length]);
            }}
            data-testid="button-lang-mobile"
          >
            {language === 'en' ? 'HI' : language === 'hi' ? 'TE' : 'EN'}
          </button>
          <button
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden backdrop-blur-xl"
            style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--nav-bg)' }}
          >
            <div className="space-y-1 px-4 py-4">
              <Link href="/" onClick={() => setIsOpen(false)} className={`block px-3 py-3 text-sm font-medium rounded-lg ${location === '/' ? "bg-primary/10" : ""}`} style={{ color: location === '/' ? '#D4AF37' : 'var(--text-muted)' }}>
                {t('nav.home')}
              </Link>
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-tertiary)' }}>{t('nav.tools')}</div>
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-3 pl-6 text-sm font-medium rounded-lg ${location === link.href ? "bg-primary/10" : ""}`}
                  style={{ color: location === link.href ? '#D4AF37' : 'var(--text-tertiary)' }}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/info" onClick={() => setIsOpen(false)} className={`block px-3 py-3 text-sm font-medium rounded-lg ${location === '/info' ? "bg-primary/10" : ""}`} style={{ color: location === '/info' ? '#D4AF37' : 'var(--text-muted)' }}>
                {t('nav.info')}
              </Link>
              <Link href="/contact" onClick={() => setIsOpen(false)} className={`block px-3 py-3 text-sm font-medium rounded-lg ${location === '/contact' ? "bg-primary/10" : ""}`} style={{ color: location === '/contact' ? '#D4AF37' : 'var(--text-muted)' }}>
                {t('nav.contact')}
              </Link>
              <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <a href="tel:9256192939" className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm px-3">
                  <Phone className="h-4 w-4" />
                  9256 192939
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
