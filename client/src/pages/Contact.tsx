import { useState, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Loader2, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const interestTypes = [
  "health_insurance",
  "term_insurance",
  "retirement_planning",
  "child_plan",
  "sme_insurance",
  "general_query",
] as const;

export default function Contact() {
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
      <ContactForm />
    </GoogleReCaptchaProvider>
  );
}

function ContactForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const formSectionRef = useRef<HTMLDivElement>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [interestType, setInterestType] = useState("");
  const [message, setMessage] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = "Name must be at least 2 characters";
    if (fullName.trim().length > 50) errs.fullName = "Name must be at most 50 characters";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email";
    if (email.trim().length > 30) errs.email = "Email must be at most 30 characters";
    if (phone && !/^[6-9]\d{9}$/.test(phone)) errs.phone = "Please enter a valid 10-digit Indian mobile number (starts with 6-9)";
    if (city.trim().length > 20) errs.city = "City must be at most 20 characters";
    if (!interestType) errs.interestType = "Please select what you're interested in";
    if (!message.trim() || message.trim().length < 10) errs.message = "Message must be at least 10 characters";
    if (message.trim().length > 1000) errs.message = "Message must be at most 1000 characters";
    if (!consentGiven) errs.consent = "You must agree to be contacted";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let token = "";
      if (executeRecaptcha) {
        try {
          token = await executeRecaptcha("contact_form_submit");
        } catch {
          token = "";
        }
      }

      await apiRequest("POST", "/api/contact", {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        interestType,
        message: message.trim(),
        consentGiven: true,
        recaptcha_token: token,
      });

      toast({ title: t('contact.form.success') });
      setFullName("");
      setEmail("");
      setPhone("");
      setCity("");
      setInterestType("");
      setMessage("");
      setConsentGiven(false);
      setErrors({});
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      toast({ title: t('contact.form.error'), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'var(--glass-bg)',
    borderColor: 'var(--border-subtle)',
    color: 'var(--text-primary)',
  };

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
                  <p style={{ color: 'var(--text-tertiary)' }}>hanvitt.advisors@gmail.com</p>
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

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 flex items-center justify-center gap-2 rounded-xl"
                  onClick={() => window.open("https://wa.me/919256192939", "_blank")}
                  data-testid="button-whatsapp"
                >
                  <SiWhatsapp className="h-5 w-5" />
                  {t('contact.whatsapp')}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 font-bold h-14 flex items-center justify-center gap-2 rounded-xl"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  onClick={() => window.location.href = "tel:+919256192939"}
                  data-testid="button-call"
                >
                  <Phone className="h-5 w-5" />
                  {t('contact.call')}
                </Button>
              </div>
            </div>
          </div>

          <motion.div
            ref={formSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card style={{ background: 'var(--page-bg-alt)', borderColor: 'var(--border-subtle)' }} className="shadow-2xl rounded-2xl">
              <div className="h-1 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-t-xl" />
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: 'var(--text-primary)' }}>{t('contact.form.title')}</CardTitle>
                <CardDescription style={{ color: 'var(--text-secondary)' }}>{t('contact.form.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-secondary)' }} data-testid="label-fullname">{t('contact.form.fullName')} *</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                      maxLength={50}
                      style={inputStyle}
                      data-testid="input-fullname"
                    />
                    {errors.fullName && <p className="text-xs text-red-500" data-testid="error-fullname">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-secondary)' }} data-testid="label-email">{t('contact.form.email')} *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                      maxLength={30}
                      style={inputStyle}
                      data-testid="input-email"
                    />
                    {errors.email && <p className="text-xs text-red-500" data-testid="error-email">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-secondary)' }} data-testid="label-phone">{t('contact.form.phone')}</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); clearError("phone"); }}
                        placeholder={t('contact.form.phonePlaceholder')}
                        style={inputStyle}
                        data-testid="input-phone"
                      />
                      {errors.phone && <p className="text-xs text-red-500" data-testid="error-phone">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label style={{ color: 'var(--text-secondary)' }} data-testid="label-city">{t('contact.form.city')}</Label>
                      <Input
                        value={city}
                        onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                        placeholder={t('contact.form.cityPlaceholder')}
                        maxLength={20}
                        style={inputStyle}
                        data-testid="input-city"
                      />
                      {errors.city && <p className="text-xs text-red-500" data-testid="error-city">{errors.city}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-secondary)' }} data-testid="label-interest">{t('contact.form.interest')} *</Label>
                    <Select value={interestType} onValueChange={(v) => { setInterestType(v); clearError("interestType"); }}>
                      <SelectTrigger style={inputStyle} data-testid="select-interest">
                        <SelectValue placeholder={t('contact.form.selectInterest')} />
                      </SelectTrigger>
                      <SelectContent>
                        {interestTypes.map((type) => (
                          <SelectItem key={type} value={type} data-testid={`option-${type}`}>
                            {t(`contact.interest.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.interestType && <p className="text-xs text-red-500" data-testid="error-interest">{errors.interestType}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--text-secondary)' }} data-testid="label-message">{t('contact.form.message')} *</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); clearError("message"); }}
                      placeholder={t('contact.form.messagePlaceholder')}
                      maxLength={1000}
                      rows={4}
                      style={inputStyle}
                      data-testid="input-message"
                    />
                    {errors.message && <p className="text-xs text-red-500" data-testid="error-message">{errors.message}</p>}
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent"
                      checked={consentGiven}
                      onCheckedChange={(checked) => { setConsentGiven(checked === true); clearError("consent"); }}
                      data-testid="checkbox-consent"
                    />
                    <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                      {t('contact.form.consent')}
                    </Label>
                  </div>
                  {errors.consent && <p className="text-xs text-red-500 -mt-2" data-testid="error-consent">{errors.consent}</p>}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#D4AF37] hover:bg-[#b8962f] text-[#1a2332] font-bold text-lg h-14 rounded-xl"
                    data-testid="button-submit"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        {t('contact.form.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        {t('contact.form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
