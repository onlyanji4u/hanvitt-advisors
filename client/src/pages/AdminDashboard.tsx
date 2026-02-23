import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Pencil, Trash2, Package, Tag, ClipboardList, X, Save, ToggleLeft, ToggleRight, Loader2, ShieldCheck, AlertTriangle, Smartphone, Copy, Eye, EyeOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAdminAuth, adminFetch } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import type { CaService, CrossSellOffer, AuditLog, SecurityLog } from "@shared/schema";

type Tab = "services" | "offers" | "audit" | "security";

export default function AdminDashboard() {
  const { isAuthenticated, admin, logout, accessToken } = useAdminAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("services");
  const [services, setServices] = useState<CaService[]>([]);
  const [offers, setOffers] = useState<CrossSellOffer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingService, setEditingService] = useState<CaService | null>(null);
  const [editingOffer, setEditingOffer] = useState<CrossSellOffer | null>(null);
  const [caTaxEnabled, setCaTaxEnabled] = useState(true);
  const [togglingCaTax, setTogglingCaTax] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [securityStats, setSecurityStats] = useState<{ total: number; last24h: number; topIps: { ip: string; count: number }[]; recentTypes: { type: string; count: number }[] } | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ otpauthUrl: string; secret: string } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showTotpDisable, setShowTotpDisable] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      fetchSettings();
    }
  }, [isAuthenticated, tab]);

  const fetchSettings = async () => {
    try {
      const res = await adminFetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setCaTaxEnabled(data.ca_tax_enabled !== "false");
      }
    } catch {}
  };

  const toggleCaTax = async () => {
    setTogglingCaTax(true);
    const newVal = !caTaxEnabled;
    try {
      const res = await adminFetch("/api/admin/settings/ca_tax_enabled", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: String(newVal) }),
      });
      if (res.ok) {
        setCaTaxEnabled(newVal);
        toast({ title: "Updated", description: `CA & Tax section ${newVal ? "enabled" : "disabled"} on website.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" });
    }
    setTogglingCaTax(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "services") {
        const res = await adminFetch("/api/admin/services");
        if (res.ok) setServices(await res.json());
      } else if (tab === "offers") {
        const res = await adminFetch("/api/admin/offers");
        if (res.ok) setOffers(await res.json());
      } else if (tab === "audit") {
        const res = await adminFetch("/api/admin/audit-logs?limit=100");
        if (res.ok) setAuditLogs(await res.json());
      } else if (tab === "security") {
        const [logsRes, statsRes, totpRes] = await Promise.all([
          adminFetch("/api/admin/security/logs?limit=100"),
          adminFetch("/api/admin/security/stats"),
          adminFetch("/api/admin/auth/totp/status"),
        ]);
        if (logsRes.ok) setSecurityLogs(await logsRes.json());
        if (statsRes.ok) setSecurityStats(await statsRes.json());
        if (totpRes.ok) {
          const data = await totpRes.json();
          setTotpEnabled(data.totpEnabled);
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await adminFetch("/api/admin/auth/logout", { method: "POST" });
    } catch {}
    logout();
    navigate("/admin");
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service? Any linked cross-sell offers will be automatically turned off.")) return;
    try {
      const res = await adminFetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setServices(s => s.filter(x => x.id !== id));
        const offerMsg = data.deactivatedOffers > 0 ? ` ${data.deactivatedOffers} linked offer(s) were turned off.` : "";
        toast({ title: "Deleted", description: `Service removed.${offerMsg}` });
        if (data.deactivatedOffers > 0) {
          setOffers(o => o.map(offer => ({ ...offer })));
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    try {
      const res = await adminFetch(`/api/admin/offers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOffers(o => o.filter(x => x.id !== id));
        toast({ title: "Deleted", description: "Offer removed." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  if (!isAuthenticated) return null;

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: "services", label: "CA Services", icon: Package },
    { key: "offers", label: "Cross-Sell Offers", icon: Tag },
    { key: "audit", label: "Audit Logs", icon: ClipboardList },
    { key: "security", label: "Security", icon: ShieldCheck },
  ];

  const handleTotpSetup = async () => {
    setTotpLoading(true);
    try {
      const res = await adminFetch("/api/admin/auth/totp/setup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTotpSetup(data);
        setShowTotpSetup(true);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to setup 2FA.", variant: "destructive" });
    }
    setTotpLoading(false);
  };

  const handleTotpVerify = async () => {
    if (totpVerifyCode.length !== 6) return;
    setTotpLoading(true);
    try {
      const res = await adminFetch("/api/admin/auth/totp/verify-setup", {
        method: "POST",
        body: JSON.stringify({ secret: totpSetup?.secret, token: totpVerifyCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setTotpEnabled(true);
        setShowTotpSetup(false);
        setTotpSetup(null);
        setTotpVerifyCode("");
        toast({ title: "2FA Enabled", description: "Two-factor authentication is now active." });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to verify.", variant: "destructive" });
    }
    setTotpLoading(false);
  };

  const handleTotpDisable = async () => {
    if (totpDisableCode.length !== 6) return;
    setTotpLoading(true);
    try {
      const res = await adminFetch("/api/admin/auth/totp/disable", {
        method: "POST",
        body: JSON.stringify({ token: totpDisableCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setTotpEnabled(false);
        setShowTotpDisable(false);
        setTotpDisableCode("");
        toast({ title: "2FA Disabled", description: "Two-factor authentication has been removed." });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to disable.", variant: "destructive" });
    }
    setTotpLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#D4AF37' }}>Admin Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{admin?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCaTax}
            disabled={togglingCaTax}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ border: '1px solid var(--border-subtle)', color: caTaxEnabled ? '#22c55e' : 'var(--text-muted)', opacity: togglingCaTax ? 0.6 : 1 }}
            data-testid="button-toggle-ca-tax"
          >
            {togglingCaTax ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : caTaxEnabled ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {togglingCaTax ? "Updating..." : `CA & Tax ${caTaxEnabled ? "ON" : "OFF"}`}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }} data-testid="button-admin-logout">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === key ? 'bg-[#D4AF37] text-black' : ''}`}
              style={tab !== key ? { color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' } : {}}
              data-testid={`tab-${key}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "services" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CA & Tax Services</h2>
              <button
                onClick={() => { setEditingService(null); setShowServiceModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black"
                data-testid="button-add-service"
              >
                <Plus className="h-4 w-4" /> Add Service
              </button>
            </div>
            {loading ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                No services yet. Add your first service.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map(s => (
                  <motion.div key={s.id} layout className="rounded-2xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">{s.category}</span>
                        <h3 className="text-base font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{s.serviceName}</h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{s.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-[#D4AF37]">₹{Number(s.priceMin).toLocaleString('en-IN')}{s.priceMax ? ` – ₹${Number(s.priceMax).toLocaleString('en-IN')}` : ''}</span>
                        {s.frequency && <span className="text-xs block mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.frequency}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingService(s); setShowServiceModal(true); }} className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }} data-testid={`button-edit-service-${s.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteService(s.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400" style={{ border: '1px solid var(--border-subtle)' }} data-testid={`button-delete-service-${s.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "offers" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Cross-Sell Offers</h2>
              <button
                onClick={() => { setEditingOffer(null); setShowOfferModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black"
                data-testid="button-add-offer"
              >
                <Plus className="h-4 w-4" /> Add Offer
              </button>
            </div>
            {loading ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                No offers yet. Create your first cross-sell offer.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {offers.map(o => (
                  <motion.div key={o.id} layout className="rounded-2xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{o.triggerProduct}</span>
                        <h3 className="text-base font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{o.offerTitle}</h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                        {o.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{o.offerDescription}</p>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{o.offerType === 'free_service' ? 'Free Service' : o.offerType === 'percentage' ? `${o.discountValue}% Off` : `₹${o.discountValue} Off`}</span>
                      <span>{o.startDate} → {o.endDate}</span>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => { setEditingOffer(o); setShowOfferModal(true); }} className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }} data-testid={`button-edit-offer-${o.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteOffer(o.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400" style={{ border: '1px solid var(--border-subtle)' }} data-testid={`button-delete-offer-${o.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Audit Logs</h2>
            {loading ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                No audit logs yet.
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--glass-bg)' }}>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Action</th>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Entity</th>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Admin</th>
                        <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              log.action === 'create' ? 'bg-green-500/10 text-green-500' :
                              log.action === 'update' ? 'bg-blue-500/10 text-blue-400' :
                              log.action === 'delete' ? 'bg-red-500/10 text-red-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>{log.action}</span>
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{log.entity}</td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{log.adminId.slice(0, 8)}...</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Security & Monitoring</h2>

            <div className="rounded-2xl p-6" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication (2FA)</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Add an extra layer of security to your admin account using an authenticator app like Google Authenticator or Authy.
              </p>
              {totpEnabled ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">2FA is enabled</span>
                  </div>
                  {showTotpDisable ? (
                    <div className="space-y-3">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter your authenticator code to disable 2FA:</p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={totpDisableCode}
                          onChange={e => setTotpDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-40 px-4 py-2.5 rounded-xl text-sm text-center tracking-[0.3em] font-mono"
                          style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                          data-testid="input-totp-disable"
                        />
                        <button
                          onClick={handleTotpDisable}
                          disabled={totpLoading || totpDisableCode.length !== 6}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 disabled:opacity-50"
                          data-testid="button-confirm-disable-totp"
                        >
                          {totpLoading ? "..." : "Disable"}
                        </button>
                        <button onClick={() => { setShowTotpDisable(false); setTotpDisableCode(""); }} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--text-muted)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTotpDisable(true)}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400"
                      data-testid="button-disable-totp"
                    >
                      Disable 2FA
                    </button>
                  )}
                </div>
              ) : showTotpSetup && totpSetup ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="p-4 rounded-xl bg-white mx-auto sm:mx-0">
                      <QRCodeSVG value={totpSetup.otpauthUrl} size={180} data-testid="qr-totp-setup" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        1. Scan this QR code with your authenticator app
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Or manually enter this secret key:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs px-3 py-2 rounded-lg font-mono flex-1 break-all" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
                          {showSecret ? totpSetup.secret : "••••••••••••••••"}
                        </code>
                        <button onClick={() => setShowSecret(!showSecret)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }} data-testid="button-toggle-secret">
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(totpSetup.secret); toast({ title: "Copied!" }); }} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }} data-testid="button-copy-secret">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-medium mt-4" style={{ color: 'var(--text-primary)' }}>
                        2. Enter the 6-digit code from your app:
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={totpVerifyCode}
                          onChange={e => setTotpVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-40 px-4 py-2.5 rounded-xl text-sm text-center tracking-[0.3em] font-mono"
                          style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                          data-testid="input-totp-verify-setup"
                        />
                        <button
                          onClick={handleTotpVerify}
                          disabled={totpLoading || totpVerifyCode.length !== 6}
                          className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50"
                          data-testid="button-verify-totp-setup"
                        >
                          {totpLoading ? "Verifying..." : "Verify & Enable"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setShowTotpSetup(false); setTotpSetup(null); setTotpVerifyCode(""); }} className="text-sm underline" style={{ color: 'var(--text-muted)' }}>
                    Cancel setup
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleTotpSetup}
                  disabled={totpLoading}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50"
                  data-testid="button-setup-totp"
                >
                  {totpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable 2FA"}
                </button>
              )}
            </div>

            {securityStats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Blocked</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="stat-total-blocked">{securityStats.total}</span>
                </div>
                <div className="rounded-2xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last 24 Hours</span>
                  </div>
                  <span className={`text-2xl font-bold ${securityStats.last24h > 10 ? 'text-red-400' : ''}`} style={securityStats.last24h <= 10 ? { color: 'var(--text-primary)' } : {}} data-testid="stat-last-24h">{securityStats.last24h}</span>
                </div>
                <div className="rounded-2xl p-5 sm:col-span-2" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-medium uppercase tracking-wider block mb-3" style={{ color: 'var(--text-muted)' }}>Threat Types</span>
                  <div className="flex flex-wrap gap-2">
                    {securityStats.recentTypes.map(t => (
                      <span key={t.type} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: t.type === 'SQL Injection' ? 'rgba(239,68,68,0.1)' : t.type === 'XSS Attack' ? 'rgba(234,179,8,0.1)' : 'rgba(107,114,128,0.1)', color: t.type === 'SQL Injection' ? '#ef4444' : t.type === 'XSS Attack' ? '#eab308' : '#6b7280' }}>
                        {t.type}: {t.count}
                      </span>
                    ))}
                    {securityStats.recentTypes.length === 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No threats detected</span>}
                  </div>
                </div>
              </div>
            )}

            {securityStats && securityStats.topIps.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Top Suspicious IPs</h3>
                <div className="space-y-2">
                  {securityStats.topIps.map(ip => (
                    <div key={ip.ip} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--page-bg)' }}>
                      <code className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{ip.ip}</code>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ip.count > 5 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-500'}`}>{ip.count} attempts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Blocked Attempts</h3>
              {loading ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : securityLogs.length === 0 ? (
                <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No blocked attempts recorded. Your site is clean!
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'var(--glass-bg)' }}>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>IP Address</th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Attempt Details</th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.map(log => (
                          <tr key={log.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <td className="px-4 py-3">
                              <code className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{log.ipAddress}</code>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <span className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{log.attempt}</span>
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showServiceModal && (
          <ServiceModal
            service={editingService}
            onClose={() => setShowServiceModal(false)}
            onSaved={() => { setShowServiceModal(false); fetchData(); }}
          />
        )}
        {showOfferModal && (
          <OfferModal
            offer={editingOffer}
            services={services}
            onClose={() => setShowOfferModal(false)}
            onSaved={() => { setShowOfferModal(false); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceModal({ service, onClose, onSaved }: { service: CaService | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    serviceName: service?.serviceName || "",
    description: service?.description || "",
    category: service?.category || "",
    priceMin: service ? String(service.priceMin) : "",
    priceMax: service?.priceMax ? String(service.priceMax) : "",
    frequency: service?.frequency || "",
    isActive: service?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = service ? `/api/admin/services/${service.id}` : "/api/admin/services";
      const method = service ? "PUT" : "POST";
      const res = await adminFetch(url, { method, body: JSON.stringify(form) });
      if (res.ok) {
        toast({ title: service ? "Updated" : "Created", description: `Service ${service ? 'updated' : 'created'} successfully.` });
        onSaved();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{service ? "Edit Service" : "Add Service"}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ModalInput label="Service Name" value={form.serviceName} onChange={v => setForm(f => ({ ...f, serviceName: v }))} required testId="input-service-name" />
          <ModalInput label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} required placeholder="e.g. ITR Filing, GST, Audit" testId="input-service-category" />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              data-testid="textarea-service-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ModalInput label="Min Price (₹)" value={form.priceMin} onChange={v => setForm(f => ({ ...f, priceMin: v }))} required type="text" placeholder="e.g. 999.00" testId="input-service-price-min" />
            <ModalInput label="Max Price (₹)" value={form.priceMax} onChange={v => setForm(f => ({ ...f, priceMax: v }))} type="text" placeholder="e.g. 4999.00" testId="input-service-price-max" />
          </div>
          <ModalInput label="Frequency (optional)" value={form.frequency} onChange={v => setForm(f => ({ ...f, frequency: v }))} type="text" placeholder="e.g. Monthly, Quarterly, Annual" testId="input-service-frequency" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className="flex items-center gap-2" data-testid="toggle-service-active">
              {form.isActive ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{form.isActive ? "Active" : "Inactive"}</span>
            </button>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50" data-testid="button-save-service">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : service ? "Update Service" : "Create Service"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function OfferModal({ offer, services, onClose, onSaved }: { offer: CrossSellOffer | null; services: CaService[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    triggerProduct: offer?.triggerProduct || "",
    offerTitle: offer?.offerTitle || "",
    offerDescription: offer?.offerDescription || "",
    offerType: offer?.offerType || "free_service",
    discountValue: offer?.discountValue ? String(offer.discountValue) : "",
    freeServiceId: offer?.freeServiceId || "",
    isActive: offer?.isActive ?? true,
    startDate: offer?.startDate || new Date().toISOString().split('T')[0],
    endDate: offer?.endDate || "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const triggerOptions = [
    "health_insurance", "term_insurance", "retirement_planning",
    "child_plan", "sme_insurance", "insurance_gap_analysis",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: form.discountValue || null,
        freeServiceId: form.freeServiceId || null,
      };
      const url = offer ? `/api/admin/offers/${offer.id}` : "/api/admin/offers";
      const method = offer ? "PUT" : "POST";
      const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        toast({ title: offer ? "Updated" : "Created", description: `Offer ${offer ? 'updated' : 'created'} successfully.` });
        onSaved();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg rounded-2xl p-6 my-8" style={{ background: 'var(--page-bg)', border: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{offer ? "Edit Offer" : "Add Offer"}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Trigger Product</label>
            <select
              value={form.triggerProduct}
              onChange={e => setForm(f => ({ ...f, triggerProduct: e.target.value }))}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              data-testid="select-trigger-product"
            >
              <option value="" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>Select trigger...</option>
              {triggerOptions.map(t => (
                <option key={t} value={t} style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <ModalInput label="Offer Title" value={form.offerTitle} onChange={v => setForm(f => ({ ...f, offerTitle: v }))} required testId="input-offer-title" />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={form.offerDescription}
              onChange={e => setForm(f => ({ ...f, offerDescription: e.target.value }))}
              required
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              data-testid="textarea-offer-description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Offer Type</label>
            <select
              value={form.offerType}
              onChange={e => setForm(f => ({ ...f, offerType: e.target.value }))}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              data-testid="select-offer-type"
            >
              <option value="free_service" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>Free Service</option>
              <option value="percentage" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>Percentage Discount</option>
              <option value="flat_discount" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>Flat Discount</option>
            </select>
          </div>
          {form.offerType !== "free_service" && (
            <ModalInput label={form.offerType === "percentage" ? "Discount (%)" : "Discount Amount (₹)"} value={form.discountValue} onChange={v => setForm(f => ({ ...f, discountValue: v }))} testId="input-discount-value" />
          )}
          {form.offerType === "free_service" && services.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Free Service</label>
              <select
                value={form.freeServiceId}
                onChange={e => setForm(f => ({ ...f, freeServiceId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                data-testid="select-free-service"
              >
                <option value="" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>Select service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id} style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>{s.serviceName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <ModalInput label="Start Date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} required type="date" testId="input-start-date" />
            <ModalInput label="End Date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} required type="date" testId="input-end-date" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className="flex items-center gap-2" data-testid="toggle-offer-active">
              {form.isActive ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{form.isActive ? "Active" : "Inactive"}</span>
            </button>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] text-black disabled:opacity-50" data-testid="button-save-offer">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : offer ? "Update Offer" : "Create Offer"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ModalInput({ label, value, onChange, required, type = "text", placeholder, testId }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string; testId: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        data-testid={testId}
      />
    </div>
  );
}
