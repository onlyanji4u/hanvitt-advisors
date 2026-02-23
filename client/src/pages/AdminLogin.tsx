import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Shield, Smartphone } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [step, setStep] = useState<"email" | "otp" | "totp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  if (isAuthenticated) {
    navigate("/admin/dashboard");
    return null;
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
        toast({ title: "OTP Sent", description: "Check your email for the login code." });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent, withTotp?: string) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, string> = { email, otp };
      if (withTotp) body.totpCode = withTotp;

      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();

      if (data.requireTotp && !withTotp) {
        setStep("totp");
        setLoading(false);
        return;
      }

      if (data.requireTotp && withTotp) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      if (res.ok && data.accessToken) {
        setAuth(data.accessToken, data.admin);
        toast({ title: "Welcome!", description: "Logged in successfully." });
        navigate("/admin/dashboard");
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleVerifyOtp(e, totpCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--page-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D4AF37]/10 mb-4">
            <Shield className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Portal</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Hanvitt Advisors Management</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hanvitt.in"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    data-testid="input-admin-email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
                data-testid="button-request-otp"
              >
                {loading ? "Sending..." : "Send OTP"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Enter OTP</label>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>We sent a 6-digit code to {email}</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-center tracking-[0.5em] font-mono text-lg"
                    style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    data-testid="input-admin-otp"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
                data-testid="button-verify-otp"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); }}
                className="w-full text-sm underline"
                style={{ color: 'var(--text-muted)' }}
                data-testid="button-back-to-email"
              >
                Use a different email
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyTotp} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-[#D4AF37]" />
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Two-Factor Authentication</label>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Enter the 6-digit code from your authenticator app</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-center tracking-[0.5em] font-mono text-lg"
                    style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    data-testid="input-totp-code"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
                data-testid="button-verify-totp"
              >
                {loading ? "Verifying..." : "Verify & Login"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => { setStep("otp"); setTotpCode(""); }}
                className="w-full text-sm underline"
                style={{ color: 'var(--text-muted)' }}
                data-testid="button-back-to-otp"
              >
                Go back
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
