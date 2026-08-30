import { useParams, useNavigate, Link } from "react-router-dom";
import { useSingleEquipment, useSimilarEquipment } from "@/hooks/useEquipment";
import { useCreateInquiry } from "@/hooks/useInquiries";
import { 
  Loader2, MapPin, Tag, ShieldCheck, Mail, ArrowLeft, 
  Calendar, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { api, API_BASE_URL } from "@/lib/api";

export function EquipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: equipment, isLoading, isError } = useSingleEquipment(id || "");
  const { data: similar } = useSimilarEquipment(id || "");
  const createInquiry = useCreateInquiry();

  const [inquiryMsg, setInquiryMsg] = useState("I am interested in this equipment. Please share pricing and availability details.");
  const [isSent, setIsSent] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Report Listing states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Suspected Fraud");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Admin delete listing states
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdminDelete = async () => {
    if (!id || !equipment) return;
    if (!confirm(`Are you sure you want to delete (archive) the listing "${equipment?.title || ""}" as an administrator?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/equipment/${id}`);
      alert("Listing has been successfully deleted/archived.");
      navigate("/search");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!id || !equipment?.seller_id) return;
    setIsSubmittingReport(true);
    setReportError("");
    setReportSuccess("");
    try {
      await api.post("/reports/fraud", {
        reported_user_id: equipment.seller_id,
        equipment_post_id: id,
        reason: reportReason,
        description: reportDescription,
      });
      setReportSuccess("Report submitted successfully. Thank you for keeping our platform safe.");
      setReportDescription("");
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess("");
      }, 3000);
    } catch (err: any) {
      setReportError(err.response?.data?.error || "Failed to submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Auto scroll to top when equipment changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-red-500 mb-4">Equipment not found or failed to load.</p>
        <Button asChild variant="outline"><Link to="/search">← Back to Search</Link></Button>
      </div>
    );
  }

  const handleContactSeller = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setInquiryError("");
    
    if (!id) {
      setInquiryError("Invalid equipment ID.");
      return;
    }

    try {
      console.log("Sending inquiry payload:", { equipment_post_id: id, message: inquiryMsg });
      await createInquiry.mutateAsync({
        equipment_post_id: id,
        message: inquiryMsg,
      });
      setIsSent(true);
    } catch (err: any) {
      console.error("Inquiry error response:", err.response?.data);
      const msg = err.response?.data?.error || "Failed to send inquiry.";
      setInquiryError(msg);
    }
  };

  const formattedPrice = equipment?.price
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(equipment.price)
    : "Price on Request";

  const allMedia = (equipment?.images || []).map((img: any) => ({
    url: typeof img === 'string' ? img : `${API_BASE_URL}${img.image_url}`,
    isVideo: img?.media_type === 'video',
  }));

  const active = allMedia[activeIndex];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back breadcrumb */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-medium transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Right: Price + CTA — shows FIRST on mobile via order */}
        <div className="space-y-6 lg:order-last">
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:sticky lg:top-20 transition-colors">
            {/* Status badge */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="capitalize text-xs font-bold border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1">
                {equipment.category}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs font-semibold ${equipment.status === 'Active' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                {equipment.status}
              </Badge>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mb-1.5 leading-tight">{equipment.title}</h1>
            <p className="text-slate-500 dark:text-slate-300 text-sm font-medium mb-4">{equipment.brand} · {equipment.model}</p>

            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-5">{formattedPrice}</div>

            <div className="space-y-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-200">
                <MapPin className="h-4 w-4 mr-2 text-slate-400 dark:text-emerald-400 shrink-0" />
                {[equipment.city, equipment.state].filter(Boolean).join(", ") || "Location not specified"}
              </div>
              <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-200">
                <Tag className="h-4 w-4 mr-2 text-slate-400 dark:text-emerald-400 shrink-0" />
                Condition: <span className="font-bold ml-1 text-slate-900 dark:text-white">{equipment.condition}</span>
              </div>
              {equipment.manufacturing_year && (
                <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-200">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400 dark:text-emerald-400 shrink-0" />
                  Manufactured: <span className="ml-1 text-slate-900 dark:text-white">{equipment.manufacturing_year}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verified Seller
              </div>
            </div>

            {/* Inquiry CTA */}
            {equipment.status === 'Sold' ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">Equipment Sold</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This item has been sold to another user and is no longer available.</p>
              </div>
            ) : isSent ? (
              <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="font-semibold text-green-700 dark:text-green-300">Inquiry Sent!</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">The seller will contact you soon. Check your inquiries dashboard.</p>
                <Button asChild variant="link" size="sm" className="mt-2 text-green-700 dark:text-green-400 font-semibold">
                  <Link to="/dashboard/inquiries">View My Inquiries →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                  placeholder="Write your message to the seller..."
                  className="resize-none text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  rows={3}
                />
                {inquiryError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{inquiryError}</p>
                )}
                <Button
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={handleContactSeller}
                  disabled={createInquiry.isPending}
                >
                  {createInquiry.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" /> Contact Seller</>
                  )}
                </Button>
                {!user && (
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Login</Link> required to contact seller
                  </p>
                )}
              </div>
            )}

            {user && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-650 hover:underline font-semibold font-medium transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  Report this Listing
                </button>
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-850 space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider text-center">Admin Actions</p>
                <Button
                  variant="destructive"
                  className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold"
                  onClick={handleAdminDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                  ) : (
                    <>Delete Listing</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6 lg:order-first">
          
          {/* Media Gallery */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {allMedia.length > 0 ? (
                active.isVideo ? (
                  <video
                    key={active.url}
                    src={active.url}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img 
                    src={active.url} 
                    alt={equipment.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"; }}
                  />
                )
              ) : (
                <div className="text-center text-slate-400 dark:text-slate-500">
                  <p className="text-lg font-medium">No Media Available</p>
                </div>
              )}
            </div>
            {allMedia.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800">
                {allMedia.map((media, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`relative h-16 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      i === activeIndex ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-700 hover:opacity-80'
                    }`}
                  >
                    {media.isVideo ? (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white">VIDEO</span>
                      </div>
                    ) : (
                      <img src={media.url} alt="" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">Equipment Specifications</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Category", equipment.category],
                ["Brand", equipment.brand],
                ["Model", equipment.model],
                ["Year of Manufacture", equipment.manufacturing_year || "Not specified"],
                ["Condition", equipment.condition],
                ["Status", equipment.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">{label}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {equipment.description && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Description</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{equipment.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Similar Listings */}
      {similar && similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Similar Equipment</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {similar.slice(0, 5).map((item) => (
              <EquipmentCard
                key={item.id}
                id={String(item.id)}
                title={item.title}
                brand={item.brand}
                category={(item as any).category}
                price={item.price}
                location={[item.city, item.state].filter(Boolean).join(", ") || "India"}
                condition={item.condition}
                status={item.status}
                isSponsored={(item as any).is_sponsored}
                image={(item.images?.[0] as any)?.image_url 
                  ? `${API_BASE_URL}${(item.images[0] as any).image_url}` 
                  : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-white" />
              <div className="font-extrabold text-white text-base">Report Listing</div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help us keep Dr's Kart secure. If you believe this listing contains inaccurate information, is fraudulent, or violates platform policies, please report it.
              </p>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="Suspected Fraud">Suspected Fraud</option>
                  <option value="Inaccurate Specifications">Inaccurate Specifications</option>
                  <option value="Incorrect Pricing">Incorrect Pricing</option>
                  <option value="Listing Unavailable/Sold">Listing Unavailable/Sold</option>
                  <option value="Counterfeit or Copy">Counterfeit or Copy</option>
                  <option value="Other Policy Violation">Other Policy Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Details / Explanation
                </label>
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide details about why you are reporting this listing..."
                  className="text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-red-500 text-left"
                  rows={3}
                />
              </div>

              {reportSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-xs text-green-700 dark:text-green-400 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  {reportSuccess}
                </div>
              )}
              {reportError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-400 rounded-lg">
                  {reportError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => { setShowReportModal(false); setReportSuccess(""); setReportError(""); }}
                  disabled={isSubmittingReport}
                >
                  Cancel
                </Button>
                {!reportSuccess && (
                  <Button
                    className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold"
                    onClick={handleReportSubmit}
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
