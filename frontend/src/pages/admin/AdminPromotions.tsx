import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFeatureFlags, useUpdateFeatureFlag } from "@/hooks/useFeatureFlags";
import {
  Loader2, CheckCircle2, XCircle, Clock, TrendingUp,
  Megaphone, CalendarDays, RefreshCw, Filter,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Promotion {
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
  seller_email: string;
  seller_company: string | null;
  payment_reference: string | null;
  admin_note: string | null;
  created_at: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAdminPromotions(status?: string) {
  return useQuery({
    queryKey: ["admin-promotions", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await api.get(`/promotions/admin${params}`);
      return res.data.promotions as Promotion[];
    },
    refetchInterval: 30000,
  });
}

function useUpdatePromotionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: number; status: string; admin_note?: string }) => {
      const res = await api.patch(`/promotions/${id}/status`, { status, admin_note });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
  });
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Active: "bg-green-500/20 text-green-400 border-green-500/30",
  Expired: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending: <Clock className="h-3.5 w-3.5" />,
  Active: <CheckCircle2 className="h-3.5 w-3.5" />,
  Expired: <CalendarDays className="h-3.5 w-3.5" />,
  Rejected: <XCircle className="h-3.5 w-3.5" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminPromotions() {
  const [filterStatus, setFilterStatus] = useState<string>("Pending");
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [actionFeedback, setActionFeedback] = useState<Record<number, string>>({});

  const { data: promotions, isLoading, refetch } = useAdminPromotions(filterStatus || undefined);
  const updateStatus = useUpdatePromotionStatus();
  
  const { data: featureFlags } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();
  const isPaidPromotionsEnabled = featureFlags?.flags?.enable_paid_promotions ?? false;

  const handleToggleGlobalFlag = () => {
    updateFlag.mutate({ key: "enable_paid_promotions", is_enabled: !isPaidPromotionsEnabled });
  };

  const handleAction = async (id: number, status: "Active" | "Rejected") => {
    try {
      const result = await updateStatus.mutateAsync({
        id,
        status,
        admin_note: adminNote[id] || undefined,
      });
      setActionFeedback((prev) => ({ ...prev, [id]: result.message }));
      setAdminNote((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err: any) {
      setActionFeedback((prev) => ({
        ...prev,
        [id]: err.response?.data?.error || "Action failed",
      }));
    }
  };

  const formattedPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promotion Requests</h1>
          <p className="text-slate-400 text-sm mt-1">
            Approve or reject seller promotion requests. Carousel approvals auto-create hero banners.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Global Feature Flag Toggle */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${isPaidPromotionsEnabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              Paid Promotions Feature
              <Badge className={`font-semibold text-xs px-2 py-0.5 ${isPaidPromotionsEnabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                {isPaidPromotionsEnabled ? 'Globally Enabled' : 'Globally Disabled'}
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Toggle this to enable or disable all paid promotions across the platform for all users.
            </p>
          </div>
        </div>
        <Button
          onClick={handleToggleGlobalFlag}
          disabled={updateFlag.isPending}
          className={`font-bold transition-all px-5 py-2.5 rounded-xl text-sm ${
            isPaidPromotionsEnabled
              ? "bg-red-650 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
          }`}
        >
          {updateFlag.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPaidPromotionsEnabled ? (
            "Disable Promotions"
          ) : (
            "Enable Promotions"
          )}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["Pending", "Active", "Rejected", "Expired", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === s
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : !promotions?.length ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center">
          <Filter className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            No {filterStatus ? filterStatus.toLowerCase() : ""} promotion requests found.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className={`flex items-center gap-1.5 text-xs font-bold ${STATUS_STYLES[promo.status]}`}>
                      {STATUS_ICONS[promo.status]} {promo.status}
                    </Badge>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      promo.type === "sponsored"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {promo.type === "sponsored"
                        ? <><TrendingUp className="h-3 w-3" /> Sponsored Listing</>
                        : <><Megaphone className="h-3 w-3" /> Hero Carousel</>
                      }
                    </span>
                    <span className="text-xs text-slate-500">#{promo.id}</span>
                  </div>

                  <h3 className="font-bold text-white text-base line-clamp-1 mb-1">
                    {promo.equipment_title}
                  </h3>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                    <div><span className="text-slate-500">Seller:</span> {promo.seller_email}</div>
                    <div><span className="text-slate-500">Plan:</span> {promo.plan_name}</div>
                    <div><span className="text-slate-500">Price:</span> {formattedPrice(promo.plan_price)}</div>
                    <div><span className="text-slate-500">Duration:</span> {promo.duration_days} days</div>
                    <div><span className="text-slate-500">Category:</span> {promo.equipment_category}</div>
                    <div><span className="text-slate-500">Ref:</span> {promo.payment_reference || "N/A"}</div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Requested:</span>{" "}
                      {new Date(promo.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </div>
                    {promo.status === "Active" && promo.expires_at && (
                      <div className="col-span-2 text-green-400">
                        <span className="text-slate-500">Expires:</span>{" "}
                        {new Date(promo.expires_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </div>
                    )}
                    {promo.admin_note && (
                      <div className="col-span-2 text-slate-300">
                        <span className="text-slate-500">Admin note:</span> {promo.admin_note}
                      </div>
                    )}
                  </div>

                  {promo.type === "carousel" && promo.status === "Pending" && (
                    <div className="mt-3 p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-xs text-emerald-400">
                      ✨ Approving this will <strong>auto-create a Hero Carousel banner</strong> from the listing's image.
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                {promo.status === "Pending" && (
                  <div className="sm:w-56 flex flex-col gap-2 shrink-0">
                    <textarea
                      placeholder="Optional admin note..."
                      value={adminNote[promo.id] || ""}
                      onChange={(e) => setAdminNote((prev) => ({ ...prev, [promo.id]: e.target.value }))}
                      rows={2}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm gap-2"
                      disabled={updateStatus.isPending}
                      onClick={() => handleAction(promo.id, "Active")}
                    >
                      {updateStatus.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Approve & Activate
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 font-bold text-sm gap-2"
                      disabled={updateStatus.isPending}
                      onClick={() => handleAction(promo.id, "Rejected")}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    {actionFeedback[promo.id] && (
                      <p className="text-xs text-center text-green-400 mt-1">{actionFeedback[promo.id]}</p>
                    )}
                  </div>
                )}

                {promo.status !== "Pending" && actionFeedback[promo.id] && (
                  <p className="text-xs text-green-400">{actionFeedback[promo.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
