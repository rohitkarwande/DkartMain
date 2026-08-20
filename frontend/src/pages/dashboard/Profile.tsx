import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Phone, CheckCircle2, ShieldAlert, ShieldCheck, AlertCircle, Sun, Moon, Laptop, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";

export function Profile() {
  const { data: user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const queryClient = useQueryClient();
  
  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Contact data from server
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "", is_verified: false });

  // Contact verification state
  const [contactMode, setContactMode] = useState<"idle" | "email" | "phone">("idle");
  const [contactInput, setContactInput] = useState("");
  const [contactOtp, setContactOtp] = useState("");
  const [contactStep, setContactStep] = useState<"input" | "otp">("input");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    bio: "",
    age: "",
    profession: "",
    location: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      const data = res.data;
      setContactInfo({
        email: data.email || "",
        phone: data.phone || "",
        is_verified: data.is_verified || false,
      });
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        company_name: data.company_name || "",
        bio: data.bio || "",
        age: data.age ? String(data.age) : "",
        profession: data.profession || "",
        location: data.location || "",
      });
      // Update context user if it differs
      if (user && (user.email !== data.email || user.phone !== data.phone)) {
        queryClient.setQueryData(['user'], { ...user, email: data.email, phone: data.phone });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/user/profile", {
        ...profile,
        age: profile.age ? parseInt(profile.age, 10) : null,
      });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendContactOtp = async () => {
    setContactLoading(true);
    setContactError("");
    const type = contactMode;
    const identifier = contactInput.trim();
    if (!identifier) { setContactError("Please enter a value"); setContactLoading(false); return; }
    try {
      await api.post("/user/add-contact", { identifier, type });
      setContactStep("otp");
      setContactSuccess("");
    } catch (err: any) {
      setContactError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setContactLoading(false);
    }
  };

  const handleVerifyContactOtp = async () => {
    setContactLoading(true);
    setContactError("");
    try {
      await api.post("/user/verify-contact", {
        identifier: contactInput.trim(),
        type: contactMode,
        otp: contactOtp,
      });
      setContactSuccess(`${contactMode === "email" ? "Email" : "Phone"} verified successfully!`);
      setContactMode("idle");
      setContactStep("input");
      setContactInput("");
      setContactOtp("");
      await fetchProfile();
    } catch (err: any) {
      setContactError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setContactLoading(false);
    }
  };

  const startContactMode = (type: "email" | "phone") => {
    setContactMode(type);
    setContactStep("input");
    // Pre-fill with existing value if present
    setContactInput(type === "email" ? contactInfo.email : (contactInfo.phone?.replace("+91", "") || ""));
    setContactError("");
    setContactSuccess("");
    setContactOtp("");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const hasEmail = !!contactInfo.email;
  const hasPhone = !!contactInfo.phone;
  // A user is "Verified" only when they have BOTH email AND phone linked
  const isVerified = hasEmail && hasPhone;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your personal information, security, and appearance preferences.</p>
      </div>

      {/* ── Appearance & Color Mode Settings ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Appearance & Color Mode</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">Choose between light, dark, or system-synchronized theme.</CardDescription>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
              Active: {theme === 'system' ? `System (${resolvedTheme})` : theme}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all group ${
                theme === "light"
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2.5 rounded-xl ${theme === "light" ? "bg-amber-100 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500"}`}>
                  <Sun className="h-5 w-5" />
                </div>
                {theme === "light" && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                  </div>
                )}
              </div>
              <p className="font-bold text-base text-slate-900 dark:text-white mb-1">Light Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">Clean daylight interface with high contrast emerald accents.</p>
              
              {/* Mini visual mockup */}
              <div className="w-full h-16 rounded-lg bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-12 h-1.5 rounded bg-slate-300"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-2 rounded bg-white border border-slate-200"></div>
                  <div className="w-3/4 h-2 rounded bg-white border border-slate-200"></div>
                </div>
              </div>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all group ${
                theme === "dark"
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2.5 rounded-xl ${theme === "dark" ? "bg-indigo-900/60 text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-400"}`}>
                  <Moon className="h-5 w-5" />
                </div>
                {theme === "dark" && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                  </div>
                )}
              </div>
              <p className="font-bold text-base text-slate-900 dark:text-white mb-1">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">Sleek obsidian & slate theme designed for comfortable night viewing.</p>
              
              {/* Mini visual mockup */}
              <div className="w-full h-16 rounded-lg bg-slate-950 border border-slate-800 p-2 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-12 h-1.5 rounded bg-slate-700"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-2 rounded bg-slate-800 border border-slate-700"></div>
                  <div className="w-3/4 h-2 rounded bg-slate-800 border border-slate-700"></div>
                </div>
              </div>
            </button>

            {/* System Mode Option */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all group ${
                theme === "system"
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2.5 rounded-xl ${theme === "system" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-emerald-500"}`}>
                  <Laptop className="h-5 w-5" />
                </div>
                {theme === "system" && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                  </div>
                )}
              </div>
              <p className="font-bold text-base text-slate-900 dark:text-white mb-1">System Default</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">Automatically synchronizes with your device operating system theme.</p>
              
              {/* Mini visual mockup split */}
              <div className="w-full h-16 rounded-lg border border-slate-200 dark:border-slate-700 flex overflow-hidden shadow-inner">
                <div className="w-1/2 h-full bg-slate-100 p-2 flex flex-col justify-between border-r border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-full h-2 rounded bg-white border border-slate-200"></div>
                </div>
                <div className="w-1/2 h-full bg-slate-950 p-2 flex flex-col justify-between">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <div className="w-full h-2 rounded bg-slate-800 border border-slate-700"></div>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account & Contact Info */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">Account & Verification</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Your login credentials and account verification status.</CardDescription>
            </div>
            {isVerified ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Verified
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Pending Verification
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">

          {/* Verification Banner */}
          {!isVerified && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-200">Your account is not fully verified.</p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  {hasEmail && !hasPhone
                    ? "Add & verify your phone number below to complete verification."
                    : !hasEmail && hasPhone
                    ? "Add & verify your email address below to complete verification."
                    : "Verify either your email or phone number to become verified."}
                </p>
              </div>
            </div>
          )}

          {/* Email Row */}
          <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{hasEmail ? contactInfo.email : "Not added"}</p>
              </div>
            </div>
            {hasEmail ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium shrink-0">
                <CheckCircle2 className="h-4 w-4" /> Added
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => startContactMode("email")}>
                Add Email
              </Button>
            )}
          </div>

          {/* Phone Row */}
          <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{hasPhone ? contactInfo.phone : "Not added"}</p>
              </div>
            </div>
            {hasPhone ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium shrink-0">
                <CheckCircle2 className="h-4 w-4" /> Added
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => startContactMode("phone")}>
                Add Phone
              </Button>
            )}
          </div>

          {/* Inline OTP Verification UI */}
          {contactMode !== "idle" && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {contactStep === "input"
                  ? `Enter your ${contactMode === "email" ? "email address" : "phone number"}`
                  : `Enter the OTP sent to ${contactInput}`}
              </p>

              {contactError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-2">{contactError}</p>
              )}

              {contactStep === "input" ? (
                <div className="flex gap-3">
                  <Input
                    type={contactMode === "email" ? "email" : "tel"}
                    placeholder={contactMode === "email" ? "you@example.com" : "9876543210"}
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    className="flex-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <Button
                    onClick={handleSendContactOtp}
                    disabled={contactLoading || !contactInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={contactOtp}
                    onChange={(e) => setContactOtp(e.target.value)}
                    className="flex-1 text-center text-lg tracking-widest font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <Button
                    onClick={handleVerifyContactOtp}
                    disabled={contactLoading || contactOtp.length !== 6}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setContactMode("idle"); setContactStep("input"); setContactError(""); }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Cancel
              </button>
            </div>
          )}

          {contactSuccess && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              ✅ {contactSuccess}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">Personal Details <span className="text-slate-400 text-sm font-normal ml-2">(Optional)</span></CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Providing these details builds trust with buyers and sellers on the platform.</CardDescription>
            </div>
            <Button 
              type="button" 
              variant={isEditing ? "ghost" : "outline"} 
              size="sm" 
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing) fetchProfile();
              }}
            >
              {isEditing ? "Cancel" : "Edit Details"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>}
            {success && <div className="p-3 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="dark:text-slate-200">First Name</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.first_name : (profile.first_name || "Not provided")} 
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} 
                  placeholder="e.g. John" 
                  className={!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-white"}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Last Name / Surname</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.last_name : (profile.last_name || "Not provided")} 
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} 
                  placeholder="e.g. Doe" 
                  className={!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-white"}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Age</Label>
                <Input 
                  type="number"
                  min="18"
                  max="100"
                  disabled={!isEditing}
                  value={isEditing ? profile.age : (profile.age || "Not provided")} 
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })} 
                  placeholder="e.g. 35" 
                  className={!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-white"}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Profession / Role</Label>
                <select 
                  disabled={!isEditing}
                  className={`flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "bg-background dark:bg-slate-800 dark:border-slate-700 dark:text-white"}`}
                  value={isEditing ? profile.profession : (profile.profession || "")}
                  onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                >
                  <option value="">Select Profession</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Clinic Owner">Clinic Owner</option>
                  <option value="Hospital Admin">Hospital Admin</option>
                  <option value="Dealer">Dealer</option>
                  <option value="Just to explore">Just to explore</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="dark:text-slate-200">Location / City</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.location : (profile.location || "Not provided")} 
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })} 
                  placeholder="e.g. Mumbai, Delhi" 
                  className={!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-white"}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="dark:text-slate-200">Hospital / Company Name</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.company_name : (profile.company_name || "Not provided")} 
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} 
                  placeholder="e.g. City Care Hospital" 
                  className={!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-white"}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="dark:text-slate-200">Short Bio</Label>
                <Textarea 
                  disabled={!isEditing}
                  rows={4}
                  value={isEditing ? profile.bio : (profile.bio || "No bio available.")} 
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
                  placeholder="Tell others a bit about your practice or business..." 
                  className={`resize-none ${!isEditing ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:border-slate-700" : "dark:bg-slate-800 dark:border-slate-700 dark:text-white"}`}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 px-8 text-white">
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
