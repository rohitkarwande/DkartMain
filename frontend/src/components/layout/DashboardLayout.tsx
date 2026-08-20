import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, MessageCircle, ShoppingBag, Loader2, User, Activity, Shield, Sparkles, LifeBuoy } from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Listings", href: "/dashboard/listings", icon: Package, sellerOnly: true },
  { label: "Promotions", href: "/dashboard/promotions", icon: Sparkles, sellerOnly: true },
  { label: "Inquiries", href: "/dashboard/inquiries", icon: Activity },
  { label: "Chat", href: "/dashboard/chat", icon: MessageCircle },
  { label: "Support Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
];

export function DashboardLayout() {
  const { data: user, isLoading } = useAuth();
  const location = useLocation();
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>  
    );
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.sellerOnly || isSeller);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
      <div className="flex gap-8 relative">
        
        {/* Left sidebar navigation — desktop only */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden sticky top-20 transition-colors">
            {/* User info */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-850 dark:to-slate-900">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-lg mb-3">
                {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <p className="font-bold text-base text-slate-900 dark:text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'My Account'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || user?.phone}</p>
              <span className={`inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                isSeller ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {user?.role}
              </span>
            </div>
            
            {/* Nav links */}
            <nav className="p-3 space-y-1">
              {visibleItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.href 
                  : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Marketplace quick links */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">Marketplace</p>
                <Link to="/search" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <ShoppingBag className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  Browse Equipment
                </Link>
              </div>

              {/* Admin quick link */}
              {user?.role === 'admin' && (
                <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">Administration</p>
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
                    <Shield className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                    Admin Panel
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {visibleItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


