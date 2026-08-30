import { useState } from "react";
import { useAdminReports, useUpdateReportStatus, useDeleteEquipmentAdmin } from "@/hooks/useAdminKyc";
import {
  AlertOctagon,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Reviewed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending: <Clock className="h-3.5 w-3.5" />,
  Reviewed: <Eye className="h-3.5 w-3.5" />,
  Resolved: <CheckCircle2 className="h-3.5 w-3.5" />,
};

export function AdminReports() {
  const [filterStatus, setFilterStatus] = useState<string>("Pending");
  const { data: reports, isLoading, refetch } = useAdminReports();
  const updateStatus = useUpdateReportStatus();
  const deleteListing = useDeleteEquipmentAdmin();

  const handleStatusChange = (id: number, status: "Reviewed" | "Resolved") => {
    updateStatus.mutate({ id, status });
  };

  const filteredReports = reports?.filter((r) => {
    if (!filterStatus) return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="h-6 w-6 text-red-500" />
            Fraud & Listing Reports
          </h1>
          <p className="text-slate-400 mt-1">
            Review and resolve complaints reported by users against equipment listings.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors w-fit"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["Pending", "Reviewed", "Resolved", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === s
                ? "bg-red-500/20 text-red-400 border border-red-500/35"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-red-400" />
          </div>
        ) : !filteredReports?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-8 text-center">
            <Filter className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-semibold">No reports found matching status</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-5 flex flex-col lg:flex-row gap-5 hover:bg-slate-850/30 transition-colors"
              >
                {/* Info Area */}
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`flex items-center gap-1.5 text-xs font-bold ${STATUS_STYLES[report.status]}`}>
                      {STATUS_ICONS[report.status]} {report.status}
                    </Badge>
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      {report.reason}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">ID: #{report.id}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {report.equipment_title || <span className="text-slate-500 italic">Deleted Product</span>}
                    </h3>
                    {report.equipment_post_id && (
                      <a
                        href={`/equipment/${report.equipment_post_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold mt-1"
                      >
                        View Listing Page <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 pt-2 text-xs text-slate-400 border-t border-slate-800/40">
                    <div>
                      <span className="text-slate-500 block">Reporter:</span>
                      <span className="text-slate-200 font-medium">{report.reporter_email || "Anonymous"}</span>
                      {report.reporter_first_name && (
                        <span className="text-slate-400 block mt-0.5">({report.reporter_first_name} {report.reporter_last_name})</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Seller:</span>
                      <span className="text-slate-200 font-medium">{report.seller_email || "N/A"}</span>
                      {report.seller_company && (
                        <span className="text-slate-400 block mt-0.5">({report.seller_company})</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Reported On:</span>
                      <span className="text-slate-300">
                        {format(new Date(report.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>

                  {report.description && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-slate-300 text-sm mt-3 leading-relaxed">
                      <p className="font-semibold text-xs text-slate-500 mb-1">REPORTER COMMENT:</p>
                      {report.description}
                    </div>
                  )}
                </div>

                {/* Action Area */}
                <div className="w-full lg:w-44 flex lg:flex-col gap-2 shrink-0 justify-end md:justify-start">
                  {report.status !== "Resolved" && (
                    <>
                      {report.status === "Pending" && (
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          disabled={updateStatus.isPending}
                          onClick={() => handleStatusChange(report.id, "Reviewed")}
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          Mark Reviewed
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusChange(report.id, "Resolved")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Resolve Report
                      </Button>
                    </>
                  )}

                  {report.equipment_post_id && report.equipment_status !== "Archived" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                      disabled={deleteListing.isPending}
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete/archive listing "${report.equipment_title}"?`)) {
                          deleteListing.mutate(report.equipment_post_id);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Delete Listing
                    </Button>
                  ) : report.equipment_post_id && (
                    <Badge variant="outline" className="border-slate-800 text-slate-500 justify-center py-1 text-xs">
                      Already Deleted
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
