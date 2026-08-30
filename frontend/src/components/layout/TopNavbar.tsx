import { Link, useNavigate } from "react-router-dom";
import { Search, PlusCircle, LayoutDashboard, MessageSquare, Package, LogOut, ShieldCheck, Shield, Sun, Moon, User as UserIcon, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logoImg from "@/assets/logo.jpg";
import { useState } from "react";
import { UserLocation } from "./UserLocation";

interface TopNavbarProps {
  onSearch?: (query: string) => void;
}

export function TopNavbar({ onSearch }: TopNavbarProps) {
  const { data: user, isLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    if (onSearch) {
      onSearch(query);
    } else if (query) {
      navigate(`/search?keyword=${encodeURIComponent(query)}`);
    }
    setMobileSearchOpen(false);
  };

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const initials = user?.first_name 
    ? user.first_name.charAt(0).toUpperCase() 
    : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between gap-2 md:gap-6">
          
          <div className="flex items-center gap-1">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={logoImg} alt="Dr's Kart Logo" className="h-16 md:h-16 w-auto object-contain" />
            </Link>

            {/* User Location */}
            {user && <UserLocation />}
          </div>

          {/* Global Search — desktop */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                type="search"
                placeholder="Search MRI machines, X-Ray, ultrasound, ECG..."
                className="w-full pl-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-transparent focus-visible:bg-white dark:focus-visible:bg-slate-800 focus-visible:border-slate-300 dark:focus-visible:border-slate-700 focus-visible:ring-emerald-500 h-10 transition-all"
              />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Mobile search button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Quick Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600 transition-transform rotate-0 hover:-rotate-12" />
              )}
            </Button>

            {/* Sell Equipment CTA */}
            <Button 
              onClick={() => navigate(isSeller ? '/sell' : user ? '/kyc' : '/signup')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hidden sm:flex"
              size="sm"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              <span className="hidden md:inline">Sell Equipment</span>
              <span className="md:hidden">Sell</span>
            </Button>

            {/* Auth Controls */}
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-emerald-600/20">
                      <AvatarFallback className="bg-emerald-600 text-white font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {user.first_name || 'My Account'}
                        </p>
                        <Badge variant="outline" className={`text-xs capitalize ${isSeller ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50' : 'text-slate-500 dark:text-slate-400'}`}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email || user.phone}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem asChild className="cursor-pointer py-2 focus:bg-slate-100 dark:focus:bg-slate-800">
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer py-2 focus:bg-slate-100 dark:focus:bg-slate-800">
                    <Link to="/dashboard/profile">
                      <UserIcon className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Profile & Appearance</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild className="cursor-pointer py-2 text-violet-600 dark:text-violet-400 focus:text-violet-700 dark:focus:text-violet-300 focus:bg-violet-50 dark:focus:bg-violet-950/50">
                      <Link to="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isSeller && (
                    <DropdownMenuItem asChild className="cursor-pointer py-2 focus:bg-slate-100 dark:focus:bg-slate-800">
                      <Link to="/dashboard/listings">
                        <Package className="mr-2 h-4 w-4 text-slate-400" />
                        <span>My Listings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer py-2 focus:bg-slate-100 dark:focus:bg-slate-800">
                    <Link to="/dashboard/inquiries">
                      <MessageSquare className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Inquiries & Chat</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer py-2 focus:bg-slate-100 dark:focus:bg-slate-800">
                    <Link to="/dashboard/tickets">
                      <LifeBuoy className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Support Tickets</span>
                    </Link>
                  </DropdownMenuItem>
                  {!isSeller && (
                    <>
                      <DropdownMenuSeparator className="dark:bg-slate-800" />
                      <DropdownMenuItem asChild className="cursor-pointer py-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300 focus:bg-emerald-50 dark:focus:bg-emerald-950/50">
                        <Link to="/kyc">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Become a Seller</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" asChild size="sm" className="hidden sm:flex text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar — slides in below the navbar */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                type="search"
                autoFocus
                placeholder="Search equipment..."
                className="w-full pl-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-transparent focus-visible:bg-white dark:focus-visible:bg-slate-800"
              />
            </form>
          </div>
        )}
      </div>
    </header>
  );
}


