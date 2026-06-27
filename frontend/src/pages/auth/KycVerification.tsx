import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSubmitKyc, useKycStatus } from "@/hooks/useAuth";
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  FileText,
  Clock,
  XCircle,
  Upload,
  Paperclip,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DOC_TYPES = [
  { value: "GST_Certificate", label: "GST Certificate" },
  { value: "Medical_License", label: "Medical Device License" },
  { value: "Company_Incorporation", label: "Company Incorporation Document" },
  { value: "Drug_License", label: "Drug License" },
  { value: "Trade_License", label: "Trade License" },
  { value: "Other", label: "Other Business ID" },
];

export function KycVerification() {
  const navigate = useNavigate();
  const submitKyc = useSubmitKyc();
  const { data: kycStatus, isLoading: kycLoading } = useKycStatus();

  const [docType, setDocType] = useState("GST_Certificate");
  const [docNumber, setDocNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isReapplying, setIsReapplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB.");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() && !selectedFile) {
      setError("Please enter your document number OR upload a document file.");
      return;
    }
    setError("");

    try {
      await submitKyc.mutateAsync({
        document_type: docType,
        document_url: docNumber.trim() ? `DOC:${docType}:${docNumber.trim()}` : undefined,
        company_name: companyName.trim() || undefined,
        document_file: selectedFile || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "KYC submission failed. Please try again.");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (kycLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ── Pending state ─────────────────────────────────────────────────────────
  if (!submitted && kycStatus?.status === "Pending" && !isReapplying) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Under Review</h1>
        <p className="text-slate-500 mb-6">
          Your KYC application is currently being reviewed by the DKart team.
          You'll receive a notification once a decision is made.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left">
          <p className="font-semibold mb-1">Application Details</p>
          <p>Document type: <strong>{kycStatus.document_type?.replace(/_/g, " ")}</strong></p>
          <p className="mt-1">Submitted: <strong>{kycStatus.submitted_at ? new Date(kycStatus.submitted_at).toLocaleDateString("en-IN") : "—"}</strong></p>
        </div>
        <Link to="/" className="inline-block mt-6 text-sm text-slate-500 hover:text-slate-700 font-medium">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // ── Approved state ────────────────────────────────────────────────────────
  if (!submitted && kycStatus?.status === "Approved") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Seller Account Active</h1>
        <p className="text-slate-500 mb-6">
          Your KYC has been approved. You can now list and sell equipment on DKart.
        </p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/sell">
            Start Listing Equipment <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  // ── Rejected state ────────────────────────────────────────────────────────
  if (!submitted && kycStatus?.status === "Rejected" && !isReapplying) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Not Approved</h1>
        <p className="text-slate-500 mb-4">
          Unfortunately, your seller application was rejected.
        </p>
        {kycStatus.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 text-left mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Reason from admin</p>
                <p>{kycStatus.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}
        <Button
          onClick={() => setIsReapplying(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reapply with New Documents
        </Button>
        <div className="mt-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // ── Submitted success ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h1>
        <p className="text-slate-500 mb-6">
          Your KYC application is now pending admin review. You'll be notified in real-time once approved.
        </p>
        <Link to="/" className="inline-flex items-center text-emerald-600 font-semibold hover:underline">
          Browse the Marketplace <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    );
  }

  // ── Application Form ──────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Become a Seller on DKart</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          To list medical equipment, verify your business credentials.
          This builds trust with buyers across the platform.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[
          { n: 1, label: "Register", done: true },
          { n: 2, label: "Verify Business", done: true },
          { n: 3, label: "List Equipment", done: false },
        ].map((step, i, arr) => (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                {step.n}
              </div>
              <span className={`text-sm font-medium ${step.done ? "text-slate-700" : "text-slate-400"}`}>{step.label}</span>
            </div>
            {i < arr.length - 1 && <div className="w-8 h-px bg-slate-300 mx-4" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" /> Business Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization Name</Label>
              <Input
                id="company"
                placeholder="e.g. Apollo Hospitals Equipment Division"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docType">Document Type</Label>
                <select
                  id="docType"
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  required
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="docNumber">Document Number / ID <span className="text-slate-400 font-normal">(optional if uploading file)</span></Label>
                <Input
                  id="docNumber"
                  placeholder="e.g. 27AAPFU0939F1Z3"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Upload className="h-5 w-5 text-slate-400" /> Document Upload <span className="text-sm text-slate-400 font-normal">(recommended)</span>
            </h3>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 ${
                selectedFile ? "border-emerald-400 bg-emerald-50/30" : "border-slate-300"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <Paperclip className="h-5 w-5 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-emerald-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="ml-2 text-slate-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400">JPG, PNG, GIF, PDF — up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">What happens next?</p>
              <p>Your submission will be reviewed by the DKart admin team. Once approved, your account will be instantly upgraded to Seller — no logout required.</p>
            </div>
          </div>

          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-4 justify-end items-center">
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-700">
              Cancel, go back to Marketplace
            </Link>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-12 px-8"
              disabled={submitKyc.isPending}
            >
              {submitKyc.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <>Submit Application <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
