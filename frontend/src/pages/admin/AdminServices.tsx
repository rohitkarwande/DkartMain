import { useState } from "react";
import { useAllServiceRequestsAdmin, useUpdateServiceRequestStatus } from "@/hooks/useServices";
import {
  Wrench,
  Loader2,
  Calendar,
  MapPin,
  Filter,
  RefreshCw,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Completed: "bg-green-500/20 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function AdminServices() {
  const [filterStatus, setFilterStatus] = useState<string>("Pending");
  const { data: requests, isLoading, refetch } = useAllServiceRequestsAdmin();
  const updateStatus = useUpdateServiceRequestStatus();

  const handleStatusChange = (id: number, status: "In Progress" | "Completed" | "Rejected" | "Pending") => {
    updateStatus.mutate({ id, status });
  };

  const filteredRequests = requests?.filter((r) => {
    if (!filterStatus) return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-emerald-500" />
            Service Request Bookings
          </h1>
          <p className="text-slate-400 mt-1">
            Manage, assign, and update statuses of repair and inspection requests.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors w-fit"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["Pending", "In Progress", "Completed", "Rejected", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === s
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/35"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Grid of Bookings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-450" />
          </div>
        ) : !filteredRequests?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-8 text-center">
            <Filter className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-semibold">No service request bookings found matching status</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 flex flex-col lg:flex-row gap-5 hover:bg-slate-850/30 transition-colors"
              >
                {/* Info Area */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`flex items-center gap-1.5 text-xs font-bold ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      {req.equipment_type || "General Equipment"}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">Booking ID: #{req.id}</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-slate-350 text-sm leading-relaxed">
                    <p className="font-bold text-xs text-slate-500 mb-1">ISSUE DESCRIPTION:</p>
                    {req.issue_description}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 pt-2 text-xs text-slate-450 border-t border-slate-800/40">
                    <div>
                      <span className="text-slate-500 block flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-500" /> Contact Name:</span>
                      <span className="text-slate-200 font-medium">{req.contact_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-500" /> Contact Phone:</span>
                      <span className="text-slate-200 font-medium">{req.contact_phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" /> Location / City:</span>
                      <span className="text-slate-200 font-medium">{req.city || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-500" /> Booked On:</span>
                      <span className="text-slate-300">
                        {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Control Area */}
                <div className="w-full lg:w-48 flex lg:flex-col gap-2 shrink-0 justify-end md:justify-start">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden lg:block mb-1">
                    Update Status:
                  </span>
                  <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 w-full">
                    {req.status === "Pending" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusChange(req.id, "In Progress")}
                      >
                        Start Service
                      </Button>
                    )}
                    {req.status === "In Progress" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusChange(req.id, "Completed")}
                      >
                        Complete Service
                      </Button>
                    )}
                    {req.status !== "Completed" && req.status !== "Rejected" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-650 hover:bg-red-700 text-white font-bold"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusChange(req.id, "Rejected")}
                      >
                        Reject Request
                      </Button>
                    )}
                    {(req.status === "Completed" || req.status === "Rejected") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusChange(req.id, "Pending")}
                      >
                        Re-open Request
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
