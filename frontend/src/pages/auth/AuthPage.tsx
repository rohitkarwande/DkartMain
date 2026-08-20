import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Mail, Phone, ShieldCheck, ArrowRight, ArrowLeft, MapPin, Briefcase } from "lucide-react";
import { api } from "@/lib/api";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    location.pathname === "/signup" ? "register" : "login"
  );
  const [method, setMethod] = useState<"email" | "phone">("email");
  
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"input" | "otp" | "onboarding">("input");
  const [userId, setUserId] = useState<number | null>(null);
  
  const [profession, setProfession] = useState("");
  const [userLocation, setUserLocation] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
    
    // Auto-detect location when reaching onboarding step
    if (step === "onboarding" && !userLocation) {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data.city) {
            setUserLocation(data.city);
          }
        })
        .catch(err => console.error("Auto-detect location failed:", err));
    }
  }, [step]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleLogin = async (payload: { credential?: string; email?: string; name?: string; isMock?: boolean }) => {
    setLoading(true);
    setError("");
    setShowGoogleModal(false);
    try {
      const res = await api.post("/auth/google", payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (!res.data.user.profession || !res.data.user.location) {
        setStep("onboarding");
      } else {
        navigate("/");
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleClientId && (window as any).google && step === "input") {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            handleGoogleLogin({ credential: response.credential });
          },
        });

        const btnElement = document.getElementById("google-signin-btn");
        if (btnElement) {
          (window as any).google.accounts.id.renderButton(btnElement, {
            theme: "outline",
            size: "large",
            width: btnElement.clientWidth || 380,
            text: "continue_with",
            shape: "rectangular",
          });
        }
      } catch (e) {
        console.error("Google SSO init error:", e);
      }
    }
  }, [googleClientId, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = activeTab === "login" ? "/auth/send-otp" : "/auth/register";
      const action = activeTab === "login" ? "login" : "register";
      
      const res = await api.post(endpoint, {
        identifier,
        action,
      });
      setUserId(res.data.userId);
      setStep("otp");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to send OTP";
      setError(msg);
      // Auto switch tabs if user already exists or doesn't exist
      if (msg.includes("already registered") && activeTab === "register") {
        setActiveTab("login");
      } else if (msg.includes("not registered") && activeTab === "login") {
        setActiveTab("register");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-otp", {
        userId,
        otp: finalOtp,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      if (!res.data.user.profession || !res.data.user.location) {
        setStep("onboarding");
      } else {
        // Navigate and force reload to update navbar state
        navigate("/");
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put("/user/profile", {
        profession,
        location: userLocation,
      });
      // Fetch latest profile and update user in local storage
      const profileRes = await api.get("/user/profile");
      localStorage.setItem("user", JSON.stringify(profileRes.data));

      navigate("/");
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* LEFT: Branding Split Screen (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative z-10 p-12 flex flex-col justify-between h-full max-w-2xl text-white">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">DKart</span>
          </div>
          
          <div className="mb-24">
            <h1 className="text-5xl font-bold leading-tight mb-6">
              India's Most Trusted<br/> Healthcare Marketplace
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              Join thousands of verified hospitals, clinics, and dealers to buy and sell premium medical equipment seamlessly.
            </p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-2 rounded-full">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="font-medium text-slate-200">Verified Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/20 p-2 rounded-full">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="font-medium text-slate-200">Secure Deals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth Logic */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white lg:bg-slate-50">
        <div className="w-full max-w-md bg-white lg:shadow-xl lg:border lg:rounded-2xl p-6 sm:p-10 relative overflow-hidden">
          
          {/* Animated Background Blob */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-emerald-50 opacity-50 pointer-events-none blur-3xl"></div>

          {step === "input" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome</h2>
                <p className="text-slate-500 mt-2">Login or register to continue</p>
              </div>

              {error && (
                <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

              <Tabs value={activeTab} onValueChange={(val: any) => { setActiveTab(val); setError(""); }} className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/80 rounded-xl h-14">
                  <TabsTrigger value="login" className="rounded-lg text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">Login</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">Register</TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSendOtp} className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-center bg-slate-100/50 p-1 rounded-xl w-fit mx-auto">
                    <button 
                      type="button" 
                      onClick={() => { setMethod("email"); setIdentifier(""); }} 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${method === 'email' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <Mail className="h-4 w-4" /> Email
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setMethod("phone"); setIdentifier(""); }} 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${method === 'phone' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <Phone className="h-4 w-4" /> Phone
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-slate-700">
                      {method === "email" ? "Email Address" : "Mobile Number"}
                    </Label>
                    <div className="relative">
                      {method === "phone" && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                          +91
                        </div>
                      )}
                      {method === "email" && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                      )}
                      <Input
                        id="identifier"
                        type={method === "email" ? "email" : "tel"}
                        placeholder={method === "email" ? "doctor@hospital.com" : "9876543210"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className={`h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 text-lg ${method === 'phone' ? 'pl-11' : 'pl-11'}`}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !identifier} 
                  className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      {activeTab === "login" ? "Login securely" : "Create Account"}
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              {googleClientId ? (
                <div className="w-full flex justify-center">
                  <div id="google-signin-btn" className="w-full max-w-[380px] min-h-[50px]"></div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full h-14 text-base font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-3 rounded-xl shadow-sm"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              )}
            </div>
          ) : step === "otp" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setStep("input")}
                className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </button>
              
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Verify OTP</h2>
                <p className="text-slate-500 mt-2">
                  Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{identifier}</span>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    />
                  ))}
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || otp.join("").length !== 6} 
                  className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Proceed"
                  )}
                </Button>
              </form>
            </div>
          ) : step === "onboarding" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Almost there!</h2>
                <p className="text-slate-500 mt-2">
                  Tell us a bit about yourself so we can personalize your experience.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleOnboardingSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-slate-700">Profession / Role</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <select
                      id="profession"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      required
                      className="flex h-14 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 pl-11 text-lg ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Select your profession</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Clinic Owner">Clinic Owner</option>
                      <option value="Hospital Admin">Hospital Admin</option>
                      <option value="Dealer">Dealer</option>
                      <option value="Just to explore">Just to explore</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700">City / Location</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Input
                      id="location"
                      placeholder="e.g. Mumbai, Delhi"
                      value={userLocation}
                      onChange={(e) => setUserLocation(e.target.value)}
                      required
                      className="h-14 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 text-lg pl-11"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !profession || !userLocation} 
                  className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 rounded-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </form>
            </div>
          ) : null}

          <div className="mt-8 text-center text-sm text-slate-500">
            By continuing, you agree to DKart's <br/>
            <a href="#" className="underline hover:text-slate-900">Terms of Service</a> and <a href="#" className="underline hover:text-slate-900">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* simulated google identity picker modal overlay */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center">
              <svg className="h-10 w-10 mb-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h3 className="text-xl font-bold text-slate-800">Sign in with Google</h3>
              <p className="text-xs text-slate-500 mt-1">to continue to DKart Marketplace</p>
            </div>

            {/* List of profiles */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleGoogleLogin({ email: "rohitkarwande82@gmail.com", name: "Dr. Rohit Karwande", isMock: true })}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-violet-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0">
                  RK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-violet-600 transition-colors">Dr. Rohit Karwande</div>
                  <div className="text-xs text-slate-500 truncate">rohitkarwande82@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md shrink-0">Admin</span>
              </button>

              <button
                onClick={() => handleGoogleLogin({ email: "infodrskart@gmail.com", name: "DKart Info", isMock: true })}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0">
                  DK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">DKart Info</div>
                  <div className="text-xs text-slate-500 truncate">infodrskart@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">Admin</span>
              </button>

              <button
                onClick={() => handleGoogleLogin({ email: "divya.karwande@gmail.com", name: "Dr. Divya Karwande", isMock: true })}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0">
                  DK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Dr. Divya Karwande</div>
                  <div className="text-xs text-slate-500 truncate">divya.karwande@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">Seller</span>
              </button>
            </div>

            {/* Custom Account Input Option */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Or enter custom account</div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowGoogleModal(false)}
                    className="flex-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-200/50 hover:bg-slate-200 rounded-xl py-2.5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleGoogleLogin({ email: customGoogleEmail, name: customGoogleName || customGoogleEmail.split("@")[0], isMock: true })}
                    disabled={!customGoogleEmail.includes("@")}
                    className="flex-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl py-2.5 shadow-sm transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
