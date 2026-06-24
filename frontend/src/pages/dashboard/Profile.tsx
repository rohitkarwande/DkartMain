import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Loader2, Mail, Phone, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Profile() {
  const { user, setUser } = useAuth();
  
  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    bio: "",
    age: "",
    profession: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      const data = res.data;
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        company_name: data.company_name || "",
        bio: data.bio || "",
        age: data.age ? String(data.age) : "",
        profession: data.profession || "",
      });
      // Update context user if it differs
      if (user && (user.email !== data.email || user.phone !== data.phone)) {
        setUser({ ...user, email: data.email, phone: data.phone });
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
      await fetchProfile(); // refresh to ensure context and form stay perfectly in sync
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-slate-500 mt-2">Manage your personal information and preferences.</p>
      </div>

      {/* Optional Personal Details */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Personal Details <span className="text-slate-400 text-sm font-normal ml-2">(Optional)</span></CardTitle>
              <CardDescription>Providing these details builds trust with buyers and sellers on the platform.</CardDescription>
            </div>
            <Button 
              type="button" 
              variant={isEditing ? "ghost" : "outline"} 
              size="sm" 
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing) fetchProfile(); // Reset unsaved changes on cancel
              }}
            >
              {isEditing ? "Cancel" : "Edit Details"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
            {success && <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.first_name : (profile.first_name || "abc")} 
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} 
                  placeholder="e.g. John" 
                  className={!isEditing ? "bg-slate-50 text-slate-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name / Surname</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.last_name : (profile.last_name || "xyz")} 
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} 
                  placeholder="e.g. Doe" 
                  className={!isEditing ? "bg-slate-50 text-slate-500" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Age</Label>
                <Input 
                  type="number"
                  min="18"
                  max="100"
                  disabled={!isEditing}
                  value={isEditing ? profile.age : (profile.age || "123")} 
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })} 
                  placeholder="e.g. 35" 
                  className={!isEditing ? "bg-slate-50 text-slate-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Profession / Role</Label>
                <select 
                  disabled={!isEditing}
                  className={`flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${!isEditing ? "bg-slate-50 text-slate-500" : "bg-background"}`}
                  value={isEditing ? profile.profession : (profile.profession || "Other")}
                  onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                >
                  <option value="">Select Profession</option>
                  <option value="Doctor">Doctor / Surgeon</option>
                  <option value="Clinic Manager">Clinic / Hospital Manager</option>
                  <option value="Equipment Dealer">Equipment Dealer / Reseller</option>
                  <option value="Service Engineer">Service Engineer</option>
                  <option value="Student">Medical Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Hospital / Company Name</Label>
                <Input 
                  disabled={!isEditing}
                  value={isEditing ? profile.company_name : (profile.company_name || "ABC Corp")} 
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} 
                  placeholder="e.g. City Care Hospital" 
                  className={!isEditing ? "bg-slate-50 text-slate-500" : ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Short Bio</Label>
                <Textarea 
                  disabled={!isEditing}
                  rows={4}
                  value={isEditing ? profile.bio : (profile.bio || "No bio available.")} 
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
                  placeholder="Tell others a bit about your practice or business..." 
                  className={`resize-none ${!isEditing ? "bg-slate-50 text-slate-500" : ""}`}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 px-8">
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
