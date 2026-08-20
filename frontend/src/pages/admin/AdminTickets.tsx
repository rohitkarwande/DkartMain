import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, LifeBuoy, RefreshCw, Filter, Eye
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  created_at: string;
  updated_at: string;
  user_email: string;
  user_phone: string | null;
  user_role: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAdminTickets(status?: string) {
  return useQuery({
    queryKey: ["admin-tickets", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await api.get(`/tickets/admin/all${params}`);
      return res.data.tickets as SupportTicket[];
    },
    refetchInterval: 30000,
  });
}

function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, priority }: { id: number; status?: string; priority?: string }) => {
      const res = await api.patch(`/tickets/admin/${id}/status`, { status, priority });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
  });
}

// ─── Styles & Constants ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  Closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminTickets() {
  const [filterStatus, setFilterStatus] = useState<string>("Open");
  const [actionFeedback, setActionFeedback] = useState<Record<number, string>>({});
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

  const { data: tickets, isLoading, refetch } = useAdminTickets(filterStatus || undefined);
  const updateTicket = useUpdateTicket();

  const handleUpdate = async (id: number, fields: { status?: string; priority?: string }) => {
    try {
      const result = await updateTicket.mutateAsync({
        id,
        ...fields,
      });
      setActionFeedback((prev) => ({ ...prev, [id]: result.message }));
      setTimeout(() => {
        setActionFeedback((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }, 3000);
    } catch (err: any) {
      setActionFeedback((prev) => ({
        ...prev,
        [id]: err.response?.data?.error || "Update failed",
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-violet-400" /> Support Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user support issues, query resolutions, and bug reports.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["Open", "In Progress", "Resolved", "Closed", ""].map((s) => (
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

      {/* Content List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : !tickets?.length ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-12 text-center">
          <Filter className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            No {filterStatus ? filterStatus.toLowerCase() : ""} support tickets found.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicket === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Left content info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className={`text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline" className={`text-xs font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>
                        {ticket.priority} Priority
                      </Badge>
                      <span className="text-xs text-slate-500 font-bold">#{ticket.id}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(ticket.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mb-1.5">{ticket.subject}</h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <div>
                        <span className="text-slate-500">Raised By:</span> {ticket.user_email}
                      </div>
                      <div>
                        <span className="text-slate-500">Category:</span> {ticket.category}
                      </div>
                    </div>

                    {/* Expand/Collapse body details */}
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isExpanded ? "Hide Description" : "View Description"}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-slate-350 text-sm whitespace-pre-wrap leading-relaxed">
                          {ticket.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action panel */}
                  <div className="lg:w-60 flex flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-850 pt-4 lg:pt-0 lg:pl-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Change Status</label>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdate(ticket.id, { status: e.target.value })}
                        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      >
                        <option value="Open" className="bg-slate-900 text-white">Open</option>
                        <option value="In Progress" className="bg-slate-900 text-white">In Progress</option>
                        <option value="Resolved" className="bg-slate-900 text-white">Resolved</option>
                        <option value="Closed" className="bg-slate-900 text-white">Closed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Change Priority</label>
                      <select
                        value={ticket.priority}
                        onChange={(e) => handleUpdate(ticket.id, { priority: e.target.value })}
                        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      >
                        <option value="Low" className="bg-slate-900 text-white">Low</option>
                        <option value="Medium" className="bg-slate-900 text-white">Medium</option>
                        <option value="High" className="bg-slate-900 text-white">High</option>
                      </select>
                    </div>

                    {actionFeedback[ticket.id] && (
                      <p className="text-xs text-center text-green-400 font-semibold mt-1">
                        {actionFeedback[ticket.id]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
