import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Activity, Stethoscope, Thermometer, FileDigit, Loader2, ArrowRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { useEquipment } from "@/hooks/useEquipment";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { useState } from "react";

import { API_BASE_URL } from "@/lib/api";

const CATEGORIES = [
  { name: "MRI Machines", icon: Activity, slug: "MRI", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50" },
  { name: "X-Ray Machines", icon: FileDigit, slug: "X-Ray", color: "bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800" },
  { name: "Ultrasound", icon: Stethoscope, slug: "Ultrasound", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" },
  { name: "ECG Machines", icon: Thermometer, slug: "ECG", color: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50" },
  { name: "Cathlab Equipment", icon: Activity, slug: "Cathlab", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50" },
  { name: "Patient Monitoring", icon: Stethoscope, slug: "Monitoring", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50" },
  { name: "Refurbished", icon: FileDigit, slug: "Refurbished", color: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50" },
  { name: "Spare Parts", icon: Thermometer, slug: "Spare_Parts", color: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50" },
];

export function Home() {
  const { data: featuredEquipment, isLoading, isError } = useEquipment();
  const { data: user } = useAuth();
  const { isEnabled: isCarouselEnabled } = useFeatureFlag("enable_hero_carousel", true);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Dynamic Hero Carousel (Feature Flagged) or Static Hero */}
      {isCarouselEnabled ? (
        <HeroCarousel />
      ) : (
        <section className="relative bg-slate-900 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')", backgroundSize: "cover", backgroundPosition: "center" }}
          ></div>
          <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-4xl">
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/50 mb-4 px-3 py-1 bg-emerald-400/10">
                India's B2B Healthcare Marketplace
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
                Buy & Sell Medical<br />
                <span className="text-emerald-400">Equipment Online</span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 max-w-2xl leading-relaxed">
                Connect with verified hospitals, clinics, and equipment dealers. 
                MRI, X-Ray, Ultrasound, ECG, Cathlab and more — all in one trusted platform.
              </p>
              
              {/* Main Search Bar */}
              <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-slate-400 shrink-0" />
                  <Input 
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="Search equipment (e.g. MRI Machine, X-Ray)" 
                    className="pl-12 border-0 focus-visible:ring-0 text-base h-12 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <div className="hidden sm:block w-px bg-slate-200 dark:bg-slate-800 my-1"></div>
                <div className="flex-1 relative flex items-center">
                  <MapPin className="absolute left-4 h-5 w-5 text-slate-400 shrink-0" />
                  <Input 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City or State" 
                    className="pl-12 border-0 focus-visible:ring-0 text-base h-12 bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <Button type="submit" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold rounded-lg shadow-sm whitespace-nowrap">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Browse by Category</h2>
          <Button asChild variant="ghost" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-900">
            <Link to="/search">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link 
              to={`/search?category=${cat.slug}`} 
              key={cat.name}
              className={`flex flex-col items-center text-center p-4 rounded-xl border ${cat.color} hover:shadow-md hover:scale-[1.02] transition-all group`}
            >
              <div className="mb-2 group-hover:scale-110 transition-transform">
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Listings */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Latest Equipment Listings</h2>
          <Button asChild variant="ghost" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-900">
            <Link to="/search">Browse All <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900/50">
            Failed to load equipment listings. Make sure the backend is running.
          </div>
        ) : !featuredEquipment?.length ? (
          <div className="p-16 text-center border rounded-xl bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800">
            <Package className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No listings yet</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-6">Be the first to list medical equipment on Dr's Kart.</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/sell">List Equipment</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredEquipment.slice(0, 8).map((equipment: any) => (
              <EquipmentCard 
                key={equipment.id}
                id={String(equipment.id)}
                title={equipment.title}
                brand={equipment.brand}
                category={equipment.category}
                price={equipment.price}
                location={[equipment.city, equipment.state].filter(Boolean).join(", ") || "India"}
                condition={equipment.condition}
                status={equipment.status}
                isSponsored={equipment.is_sponsored}
                image={equipment.images?.[0]?.image_url 
                  ? `${API_BASE_URL}${equipment.images[0].image_url}` 
                  : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-emerald-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to sell your medical equipment?</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Join thousands of hospitals, clinics, and dealers who trust Dr's Kart to reach the right buyers across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Button asChild size="lg" className="bg-emerald-800 text-white hover:bg-emerald-900 font-semibold px-8 border-0">
                <Link to="/signup">Create Free Account</Link>
              </Button>
            )}
            <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-slate-50 border-0 font-semibold px-8">
              <Link to="/search">Browse Equipment</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


