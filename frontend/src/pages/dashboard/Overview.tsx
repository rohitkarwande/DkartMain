import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { 
  Package, MessageSquare, TrendingUp, PlusCircle, 
  ShieldCheck, Loader2, ArrowRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

function useUserDashboard() {
  return useQuery({
    queryKey: ['user', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/user/dashboard');
      return res.data;
    },
    retry: false,
  });
}

export function DashboardOverview() {
  const { data: user, isLoading: isUserLoading } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useUserDashboard();

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  if (isUserLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-50 dark:bg-emerald-950/20 opacity-60 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Your healthcare marketplace command center • 
              <span className="ml-2 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md uppercase tracking-wider text-xs">
                {user?.role} Account
              </span>
            </p>
          </div>
          {isSeller ? (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 rounded-xl text-md font-semibold text-white">
              <Link to="/sell">
                <PlusCircle className="mr-2 h-5 w-5" />
                List Equipment
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-12 px-6 rounded-xl text-md font-semibold">
              <Link to="/kyc">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Become a Seller
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl">
              <Package className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Listings</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white relative z-10">
            {isStatsLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : (stats?.stats?.totalPosts ?? 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-950/20 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-xl">
              <MessageSquare className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inquiries</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white relative z-10">
            {isStatsLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : (stats?.stats?.totalInquiries ?? 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-950/20 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-orange-100 dark:bg-orange-950/50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-orange-700 dark:text-orange-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize relative z-10 mt-2">{user?.role}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-950/20 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/50 rounded-xl">
              <Star className="h-6 w-6 text-purple-700 dark:text-purple-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10 mt-2">Active</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/search" className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:border-emerald-250 dark:hover:border-emerald-800 block">
          <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
            <Package className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Browse Marketplace</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">Discover medical equipment from verified sellers nationwide. Find exactly what your clinic needs.</p>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            Start browsing <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link to="/dashboard/inquiries" className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:border-emerald-250 dark:hover:border-emerald-800 block">
          <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
            <MessageSquare className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Manage Inquiries</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">Track leads, respond to messages, negotiate prices, and close deals securely on the platform.</p>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            View inquiries <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {isSeller ? (
          <Link to="/dashboard/listings" className="group bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900 shadow-sm hover:shadow-xl transition-all hover:border-emerald-300 dark:hover:border-emerald-700 block">
            <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">My Inventory</h3>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-400 mb-4 line-clamp-2">Manage your current equipment listings, update prices, and track performance metrics.</p>
            <div className="flex items-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              Manage inventory <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ) : (
          <Link to="/kyc" className="group bg-amber-50/50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-900 border-dashed shadow-sm hover:shadow-xl hover:border-amber-400 hover:border-solid transition-all block">
            <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">Start Selling</h3>
            <p className="text-sm text-amber-700/80 dark:text-amber-400 mb-4 line-clamp-2">Upgrade your account for free to list and sell medical equipment to thousands of buyers.</p>
            <div className="flex items-center text-amber-700 dark:text-amber-300 font-bold text-sm">
              Upgrade account <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        )}
      </div>

    </div>
  );
}
