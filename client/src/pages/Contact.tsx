import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/hooks/use-language";
export default function Contact() {
  const { t } = useLanguage();

  return (
    <div style={{ background: 'var(--page-bg)' }} className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          <div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">Reach Out</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('contact.title')}</h1>
            <p className="text-base sm:text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>{t('contact.desc')}</p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                  <Phone className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t('contact.phone')}</h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>9256 192939</p>
                  <div className="space-y-1 mt-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Mon - Sun: 9:00 AM - 9:00 PM</p>
                    <p className="text-sm font-bold text-[#D4AF37]">{t('footer.claims')}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                  <Mail className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t('contact.email')}</h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>help@hanvitt.in</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('contact.reply')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                  <MapPin className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t('contact.office')}</h3>
                  <p style={{ color: 'var(--text-tertiary)' }}>Hanvitt Advisors</p>
                  <p style={{ color: 'var(--text-tertiary)' }}>Manikonda</p>
                  <p style={{ color: 'var(--text-tertiary)' }}>Hyderabad, Telangana 500089</p>
                </div>
              </div>
            </div>
          </div>

          <Card style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }} className="shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-t-xl" />
            <CardHeader>
              <CardTitle className="text-2xl" style={{ color: 'var(--text-primary)' }}>{t('contact.form.title')}</CardTitle>
              <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('contact.form.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-lg h-16 flex items-center justify-center gap-3 rounded-xl"
                onClick={() => window.open("https://wa.me/919256192939", "_blank")}
                data-testid="button-whatsapp"
              >
                <SiWhatsapp className="h-6 w-6" />
                {t('contact.whatsapp')}
              </Button>

              <Button
                variant="outline"
                className="w-full font-bold text-lg h-16 flex items-center justify-center gap-3 rounded-xl"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                onClick={() => window.location.href = "tel:+919256192939"}
                data-testid="button-call"
              >
                <Phone className="h-6 w-6" />
                {t('contact.call')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
