import { useState } from "react";
import { useMyListings } from "@/hooks/useEquipment";
import type { Equipment } from "@/hooks/useEquipment";
import { api, API_BASE_URL } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Loader2, Sparkles, TrendingUp, CalendarDays, CheckCircle2,
  Clock, XCircle, ChevronRight, Megaphone, Star,
} from "lucide-react";

// ─── API hooks ──────────────────────────────────────────────────────────────

function usePromotionPlans() {
  return useQuery({
    queryKey: ["promotion-plans"],
    queryFn: async () => {
      const res = await api.get("/promotions/plans");
      return res.data.plans as PromotionPlan[];
    },
  });
}

function useMyPromotions() {
  return useQuery({
    queryKey: ["my-promotions"],
    queryFn: async () => {
      const res = await api.get("/promotions/mine");
      return res.data.promotions as MyPromotion[];
    },
  });
}

function useRequestPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { equipment_post_id: string; plan_id: number }) => {
      const res = await api.post("/promotions/request", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-promotions"] });
    },
  });
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface PromotionPlan {
  id: number;
  name: string;
  type: "sponsored" | "carousel";
  price: number;
  duration_days: number;
  description: string;
}

interface MyPromotion {
  id: number;
  equipment_post_id: string;
  type: "sponsored" | "carousel";
  status: "Pending" | "Active" | "Expired" | "Rejected";
  starts_at: string | null;
  expires_at: string | null;
  plan_name: string;
  plan_price: number;
  duration_days: number;
  equipment_title: string;
  equipment_category: string;
  created_at: string;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Active: "bg-green-50 text-green-700 border-green-200",
  Expired: "bg-slate-100 text-slate-500 border-slate-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_ICONS = {
  Pending: <Clock className="h-3.5 w-3.5" />,
  Active: <CheckCircle2 className="h-3.5 w-3.5" />,
  Expired: <CalendarDays className="h-3.5 w-3.5" />,
  Rejected: <XCircle className="h-3.5 w-3.5" />,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Promotions() {
  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const { data: plans, isLoading: plansLoading } = usePromotionPlans();
  const { data: myPromotions, isLoading: promosLoading } = useMyPromotions();
  const requestPromotion = useRequestPromotion();

  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PromotionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activeListing = listings?.find((l) => l.id === selectedListingId) as Equipment | undefined;

  const openModal = (listing: Equipment) => {
    setSelectedListingId(String(listing.id));
    setSelectedPlan(null);
    setSuccessMsg("");
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedListingId || !selectedPlan) return;
    setErrorMsg("");
    try {
      const result = await requestPromotion.mutateAsync({
        equipment_post_id: selectedListingId,
        plan_id: selectedPlan.id,
      });
      setSuccessMsg(result.message);
      setSelectedPlan(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to submit promotion request.");
    }
  };

  const formattedPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Promote Your Listings</h1>
        </div>
        <p className="text-slate-500 text-sm mt-1 ml-12">
          Boost visibility with sponsored search placement or a featured hero carousel slide on the homepage.
        </p>
      </div>

      {/* Plans Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plansLoading ? (
          <div className="col-span-2 flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
        ) : (
          plans?.map((plan) => (
            <Card key={plan.id} className={`border-2 ${plan.type === 'sponsored' ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/40'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan.type === 'sponsored' ? (
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Megaphone className="h-5 w-5 text-emerald-600" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${plan.type === 'sponsored' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {plan.type === 'sponsored' ? 'Sponsored Listing' : 'Hero Carousel'}
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{formattedPrice(plan.price)}</span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{plan.name}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-medium">
                  <CalendarDays className="h-3.5 w-3.5" /> {plan.duration_days} days
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* My Listings — Promote Action */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Your Active Listings</h2>
        {listingsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
        ) : !listings?.filter((l: Equipment) => l.status === 'Active').length ? (
          <div className="p-8 text-center border border-dashed rounded-xl text-slate-400 text-sm">
            No active listings to promote. Activate a listing first.
          </div>
        ) : (
          <div className="grid gap-3">
            {listings
              ?.filter((l: Equipment) => l.status === 'Active')
              .map((listing: Equipment) => {
                const imageUrl = listing.images?.[0]
                  ? `${API_BASE_URL}${(listing.images[0] as any).image_url || listing.images[0]}`
                  : null;
                return (
                  <div key={listing.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{listing.category} · {listing.brand}</div>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5"
                      onClick={() => openModal(listing)}
                    >
                      <Star className="h-3.5 w-3.5" /> Promote
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* My Promotions History */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">My Promotions</h2>
        {promosLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
        ) : !myPromotions?.length ? (
          <div className="p-8 text-center border border-dashed rounded-xl text-slate-400 text-sm">
            No promotions yet. Promote a listing above to get started!
          </div>
        ) : (
          <div className="grid gap-3">
            {myPromotions.map((promo) => (
              <div key={promo.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                <div className={`p-2 rounded-full ${promo.type === 'sponsored' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  {promo.type === 'sponsored'
                    ? <TrendingUp className="h-4 w-4 text-amber-600" />
                    : <Megaphone className="h-4 w-4 text-emerald-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{promo.equipment_title}</div>
                  <div className="text-xs text-slate-500">{promo.plan_name} · {formattedPrice(promo.plan_price)}</div>
                  {promo.status === 'Active' && promo.expires_at && (
                    <div className="text-xs text-emerald-600 font-medium mt-0.5">
                      Expires {new Date(promo.expires_at).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={`flex items-center gap-1.5 text-xs font-semibold ${STATUS_STYLES[promo.status]}`}>
                  {STATUS_ICONS[promo.status]} {promo.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Promote Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-5">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-white" />
                <div>
                  <div className="font-extrabold text-white text-lg">Promote Listing</div>
                  <div className="text-amber-100 text-sm line-clamp-1">{activeListing?.title}</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Plan selection */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Choose a Promotion Plan</h3>
                <div className="space-y-3">
                  {plans?.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-amber-50/30 dark:hover:bg-amber-900/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{plan.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              {plan.type === 'sponsored' ? (
                                <><TrendingUp className="h-3 w-3 text-amber-500" /> Sponsored search placement</>
                              ) : (
                                <><Megaphone className="h-3 w-3 text-emerald-500" /> Homepage carousel slide</>
                              )}
                              <span className="mx-1">·</span>
                              <CalendarDays className="h-3 w-3" /> {plan.duration_days} days
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-slate-900 dark:text-white">{formattedPrice(plan.price)}</div>
                            {isSelected && <ChevronRight className="h-4 w-4 text-amber-500 ml-auto mt-0.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mock payment notice */}
              {selectedPlan && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  <strong>💳 Payment:</strong> You will be charged <strong>{formattedPrice(selectedPlan.price)}</strong>.
                  Our team will contact you to complete the payment and activate the promotion within 24 hours.
                </div>
              )}

              {/* Success / Error messages */}
              {successMsg && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setSuccessMsg(""); }}>
                  {successMsg ? "Close" : "Cancel"}
                </Button>
                {!successMsg && (
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold"
                    disabled={!selectedPlan || requestPromotion.isPending}
                    onClick={handleSubmit}
                  >
                    {requestPromotion.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Submit Request</>
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
