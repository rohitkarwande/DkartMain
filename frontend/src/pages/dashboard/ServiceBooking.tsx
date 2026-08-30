import { useState } from "react";
import { useMyServiceRequests, useCreateServiceRequest } from "@/hooks/useServices";
import {
  Wrench,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  History,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  Completed: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900/50",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/50",
};

export function ServiceBooking() {
  const { data: requests, isLoading, refetch } = useMyServiceRequests();
  const createRequest = useCreateServiceRequest();

  // Form states
  const [equipmentType, setEquipmentType] = useState("MRI Machine");
  const [issueDescription, setIssueDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [city, setCity] = useState("");

  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!issueDescription.trim()) {
      setFormError("Please describe the issue you are experiencing.");
      return;
    }

    try {
      await createRequest.mutateAsync({
        equipment_type: equipmentType,
        issue_description: issueDescription,
        contact_name: contactName,
        contact_phone: contactPhone,
        city,
      });

      setFormSuccess("Your service request has been successfully booked! Our team will contact you shortly.");
      setIssueDescription("");
      setContactName("");
      setContactPhone("");
      setCity("");
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to book service request.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Request Equipment Service
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Book certified engineers for repair, maintenance, calibration, or inspections of your medical equipment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form (Left / Col-Span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-400 dark:text-emerald-400" />
              Service Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Equipment Type
                  </label>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="MRI Machine">MRI Machine</option>
                    <option value="CT Scanner">CT Scanner</option>
                    <option value="Ultrasound Machine">Ultrasound Machine</option>
                    <option value="X-Ray Machine">X-Ray Machine</option>
                    <option value="Patient Monitor">Patient Monitor</option>
                    <option value="Ventilator">Ventilator</option>
                    <option value="Infusion Pump">Infusion Pump</option>
                    <option value="Other Medical Equipment">Other Medical Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Describe the Issue <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what repair or service you need in detail..."
                  className="text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Name of contact person"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Active mobile number"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {formSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-sm text-green-700 dark:text-green-400 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-400 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-650 dark:text-red-405" />
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                disabled={createRequest.isPending}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {createRequest.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking Request...</>
                ) : (
                  "Book Service Request"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Requests History (Right Sidebar / Col-Span-1) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400 dark:text-emerald-400" />
              Request History
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : !requests?.length ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">
                You haven't requested any services yet.
              </p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 hover:border-slate-200 dark:hover:border-slate-750 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {request.equipment_type}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-bold ${STATUS_STYLES[request.status]}`}>
                        {request.status}
                      </Badge>
                    </div>

                    <p className="text-slate-600 dark:text-slate-350 text-xs line-clamp-2 leading-relaxed">
                      {request.issue_description}
                    </p>

                    <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/50 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0 text-slate-500" />
                        {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                      </div>
                      {request.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                          {request.city}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
