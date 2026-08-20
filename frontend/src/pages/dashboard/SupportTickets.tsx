import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, LifeBuoy, PlusCircle, CheckCircle2,
  ChevronDown, ChevronUp, AlertCircle, HelpCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ticket {
  id: number;
  user_id: number;
  subject: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  created_at: string;
  updated_at: string;
}

// ─── API Hooks ────────────────────────────────────────────────────────────────

function useMyTickets() {
  return useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const res = await api.get("/tickets/mine");
      return res.data.tickets as Ticket[];
    },
  });
}

function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      subject: string;
      description: string;
      category: string;
      priority: string;
    }) => {
      const res = await api.post("/tickets", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

// ─── Status & Priority Styles ─────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
  Closed: "bg-slate-100 text-slate-650 border-slate-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-50 text-slate-600 border-slate-200",
  Medium: "bg-orange-50 text-orange-700 border-orange-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SupportTickets() {
  const { data: tickets, isLoading } = useMyTickets();
  const createTicket = useCreateTicket();

  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technical");
  const [priority, setPriority] = useState("Medium");

  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const result = await createTicket.mutateAsync({
        subject,
        description,
        category,
        priority,
      });
      setSuccessMsg(result.message || "Support ticket raised successfully!");
      // Reset form
      setSubject("");
      setDescription("");
      setCategory("Technical");
      setPriority("Medium");
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to raise support ticket.");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedTicket(expandedTicket === id ? null : id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <LifeBuoy className="h-5 w-5 text-emerald-650" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1 ml-12">
            Raise a ticket for billing, account issues, or technical assistance.
          </p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="sm:ml-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl h-11"
        >
          <PlusCircle className="h-4 w-4" /> Raise a Ticket
        </Button>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Tickets</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : !tickets?.length ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400">
            <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-sm">No support tickets found.</p>
            <p className="text-xs text-slate-400 mt-1">If you have any queries, click the button above to get help.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tickets.map((ticket) => {
              const isExpanded = expandedTicket === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                >
                  <div
                    onClick={() => toggleExpand(ticket.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <Badge variant="outline" className={`text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline" className={`text-xs font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>
                          {ticket.priority} Priority
                        </Badge>
                        <span className="text-xs text-slate-500 font-bold">#{ticket.id}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">{ticket.subject}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Category: {ticket.category}</p>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-slate-100 bg-slate-50/50 pt-4 text-sm text-slate-700 leading-relaxed">
                      <div className="font-bold text-slate-800 mb-1">Ticket Details:</div>
                      <p className="whitespace-pre-wrap">{ticket.description}</p>

                      {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                        <div className="text-xs text-slate-400 mt-4">
                          Last activity: {new Date(ticket.updated_at).toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Raise Ticket Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 flex items-center gap-3">
              <LifeBuoy className="h-6 w-6 text-white" />
              <div>
                <div className="font-extrabold text-white text-lg">Raise Support Ticket</div>
                <div className="text-emerald-100 text-xs mt-0.5">Tell us how we can help you today</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-slate-700 font-bold text-xs">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Technical">Technical Issue</option>
                    <option value="Billing">Billing / Payment</option>
                    <option value="KYC">Seller verification</option>
                    <option value="General">General Query</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-slate-700 font-bold text-xs">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-slate-700 font-bold text-xs">Subject / Brief Description</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Cannot edit equipment price"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-slate-700 font-bold text-xs">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue or query in detail so our support team can assist you better..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl resize-none"
                />
              </div>

              {/* Error / Success Feedback */}
              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex gap-2 items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2 items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl h-11"
                  onClick={() => { setShowModal(false); setSuccessMsg(""); }}
                >
                  Cancel
                </Button>
                {!successMsg && (
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11"
                    disabled={createTicket.isPending}
                  >
                    {createTicket.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      "Submit Ticket"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
