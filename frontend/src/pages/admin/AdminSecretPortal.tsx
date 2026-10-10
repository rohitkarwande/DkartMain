import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Lock,
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound
} from "lucide-react";

export function AdminSecretPortal() {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<"identify" | "dual_otp" | "already_active">("identify");
  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for 5 minutes (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  // Check if already authenticated with 2FA
  useEffect(() => {
    const token = localStorage.getItem("token");
    const is2FaVerified = localStorage.getItem("admin_2fa_verified") === "true";

    if (token && is2FaVerified) {
      // Validate session with backend
      api.get("/admin/auth/session")
        .then((res) => {
          if (res.data?.valid) {
            setStep("already_active");
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("admin_2fa_verified");
        });
    }
  }, []);

  // Timer effect for OTP countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "dual_otp" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Step 1: Request Dual OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your administrator email address or registered mobile number.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/admin/auth/request-dual-otp", {
        identifier: identifier.trim()
      });

      setUserId(res.data.userId);
      setMaskedEmail(res.data.maskedEmail);
      setMaskedPhone(res.data.maskedPhone);
      setStep("dual_otp");
      setTimeLeft(300);
      setCanResend(false);
      setSuccessMsg("Dual verification codes sent! Please check both your email and mobile SMS.");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to initiate administrator verification.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Dual OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOtp.trim() || !mobileOtp.trim()) {
      setError("Please enter both the Email verification code and Mobile SMS code.");
      return;
    }

    if (!userId) {
      setError("Session expired. Please start over.");
      setStep("identify");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/admin/auth/verify-dual-otp", {
        userId,
        emailOtp: emailOtp.trim(),
        mobileOtp: mobileOtp.trim()
      });

      // Save elevated admin token and verification flag
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("admin_2fa_verified", "true");
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      setSuccessMsg("✓ Administrator 2FA verified successfully! Redirecting...");

      // Redirect into Admin Layout
      setTimeout(() => {
        navigate("/admin");
      }, 1000);

    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid verification codes. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-white">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-600/30 mb-4 border border-violet-400/20">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <span className="text-xs uppercase tracking-widest text-violet-400 font-semibold px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 mb-2">
            Admin Security Gateway
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Dr's Kart Control Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Mandatory Two-Factor Dual Authentication (Email + Mobile)
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{successMsg}</p>
          </div>
        )}

        {/* ── CASE 1: ALREADY ACTIVE SESSION ── */}
        {step === "already_active" && (
          <div className="space-y-6 text-center">
            <div className="p-6 rounded-2xl bg-violet-950/30 border border-violet-800/30 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Administrator Session Active</h2>
              <p className="text-xs text-slate-400">
                You already hold an active, verified two-factor administrative session.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/admin")}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-base shadow-lg shadow-violet-600/30 transition-all"
              >
                Enter Admin Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("admin_2fa_verified");
                  setStep("identify");
                }}
                className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm"
              >
                Re-Authenticate with New 2FA
              </Button>
            </div>
          </div>
        )}

        {/* ── CASE 2: STEP 1 - IDENTIFICATION ── */}
        {step === "identify" && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-id" className="text-sm font-medium text-slate-300 flex items-center justify-between">
                <span>Administrator Identifier</span>
                <span className="text-xs text-slate-500 font-normal">Email or Mobile</span>
              </Label>
              <div className="relative">
                <Input
                  id="admin-id"
                  type="text"
                  placeholder="admin@drskart.com or +919876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="h-12 pl-11 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-violet-500 focus:ring-violet-500/20"
                />
                <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verification codes will be concurrently dispatched to both your registered administrator email and registered mobile phone number.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Dual Security Codes...
                </>
              ) : (
                <>
                  Send 2FA Security Codes
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-violet-400" /> 256-Bit TLS Encrypted
              </span>
              <span>Hostinger Production Gateway</span>
            </div>
          </form>
        )}

        {/* ── CASE 3: STEP 2 - DUAL VERIFICATION (EMAIL + MOBILE OTP) ── */}
        {step === "dual_otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setStep("identify")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change Account
              </button>
              <div className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                Expires: <span className={timeLeft < 60 ? "text-red-400 font-bold" : "text-violet-300"}>{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* OTP Section 1: Email Code */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-otp" className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-violet-400" /> Email Verification Code
                </Label>
                <span className="text-[11px] font-mono text-slate-400">{maskedEmail}</span>
              </div>
              <Input
                id="email-otp"
                type="text"
                maxLength={6}
                placeholder="6-digit Email OTP"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                autoFocus
                className="h-12 text-center text-xl tracking-[0.3em] font-mono font-bold bg-slate-900 border-slate-700 text-white rounded-xl focus:border-violet-500"
              />
              <p className="text-[11px] text-slate-400">
                Check inbox or spam folder for "Dr's Kart Auth Verification Code".
              </p>
            </div>

            {/* OTP Section 2: Mobile SMS Code */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mobile-otp" className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" /> Mobile SMS Code
                </Label>
                <span className="text-[11px] font-mono text-slate-400">{maskedPhone}</span>
              </div>
              <Input
                id="mobile-otp"
                type="text"
                maxLength={6}
                placeholder="6-digit SMS OTP"
                value={mobileOtp}
                onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                className="h-12 text-center text-xl tracking-[0.3em] font-mono font-bold bg-slate-900 border-slate-700 text-white rounded-xl focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                Check SMS on your registered phone. (Also visible in server console).
              </p>
            </div>

            {/* Verification Button */}
            <Button
              type="submit"
              disabled={loading || emailOtp.length !== 6 || mobileOtp.length !== 6}
              className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying Dual Credentials...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  Verify & Unlock Admin Panel
                </>
              )}
            </Button>

            {/* Resend Action */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={!canResend || loading}
                className={`text-xs inline-flex items-center gap-1.5 font-medium transition-colors ${
                  canResend
                    ? "text-violet-400 hover:text-violet-300 underline cursor-pointer"
                    : "text-slate-600 cursor-not-allowed"
                }`}
              >
                <RefreshCw className="h-3 w-3" />
                Resend Both Security Codes {timeLeft > 0 && `(${formatTimer(timeLeft)})`}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
