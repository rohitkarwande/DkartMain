import { useAdminStats } from "@/hooks/useAdminKyc";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Package,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div
      className={`relative overflow-hidden bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group hover:bg-slate-800`}
    >
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} bg-opacity-20 mb-4`}>
        <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {href && (
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-violet-400 transition-colors mt-3">
          View all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );

  return href ? <Link to={href}>{inner}</Link> : inner;
}

export function AdminOverview() {
  const { data: stats, isLoading, error } = useAdminStats();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-slate-400 mt-1 text-sm">Real-time marketplace stats and pending actions</p>
        </div>
        {stats?.pendingKyc != null && stats.pendingKyc > 0 && (
          <Link
            to="/admin/kyc"
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            {stats.pendingKyc} KYC application{stats.pendingKyc > 1 ? "s" : ""} pending review
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm">Failed to load stats.</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Buyers"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="bg-blue-500"
            sub="Registered user accounts"
            href="/admin/users"
          />
          <StatCard
            label="Active Sellers"
            value={stats?.totalSellers ?? 0}
            icon={TrendingUp}
            color="bg-emerald-500"
            sub="Approved seller accounts"
          />
          <StatCard
            label="Pending KYC"
            value={stats?.pendingKyc ?? 0}
            icon={Clock}
            color="bg-amber-500"
            sub="Awaiting admin review"
            href="/admin/kyc"
          />
          <StatCard
            label="Total Listings"
            value={stats?.totalListings ?? 0}
            icon={Package}
            color="bg-violet-500"
            sub="Equipment posts on platform"
          />
          <StatCard
            label="Active Inquiries"
            value={stats?.activeInquiries ?? 0}
            icon={MessageSquare}
            color="bg-pink-500"
            sub="Open buyer-seller conversations"
          />
          <StatCard
            label="Approved KYC"
            value={stats?.approvedKyc ?? 0}
            icon={CheckCircle2}
            color="bg-teal-500"
            sub="Verified seller applications"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/kyc?status=Pending"
            className="group bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 rounded-2xl p-6 transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <ShieldCheck className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-amber-300 transition-colors">
                  Review KYC Applications
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  Approve or reject pending seller applications
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="group bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/40 rounded-2xl p-6 transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Users className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-violet-300 transition-colors">
                  Manage Users
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  View, suspend, or reactivate user accounts
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
