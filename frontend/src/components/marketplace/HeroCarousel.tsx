import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MapPin, 
  ArrowRight, 
  Sparkles,
  Pause,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveHeroBanners, type HeroBanner } from "@/hooks/useHeroBanners";
import { api, API_BASE_URL } from "@/lib/api";

const FALLBACK_SLIDES: HeroBanner[] = [
  {
    id: -1,
    title: "Advanced 1.5T & 3.0T MRI Scanners",
    subtitle: "Connect with verified hospitals and clinics for top-tier GE, Siemens & Philips magnetic resonance imaging systems.",
    badge_text: "High Demand Equipment",
    image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1600",
    link_url: "/search?category=MRI",
    button_text: "Browse MRI Systems",
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: -2,
    title: "Precision 3D & 4D Diagnostic Ultrasound",
    subtitle: "Complete ultrasound workstations with multi-probe packages for Cardiology, OB/GYN, and General Radiology.",
    badge_text: "Verified Dealers",
    image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1600",
    link_url: "/search?category=Ultrasound",
    button_text: "Explore Ultrasounds",
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: -3,
    title: "Digital Radiography & Fixed C-Arm Systems",
    subtitle: "Low-radiation dose surgical imaging engineered for hospitals and multi-specialty surgical centers.",
    badge_text: "Hospital Grade",
    image_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1600",
    link_url: "/search?category=X-Ray",
    button_text: "View Radiography Units",
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export function HeroCarousel() {
  const { data: dbBanners } = useActiveHeroBanners();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const slides = (dbBanners && dbBanners.length > 0) ? dbBanners : FALLBACK_SLIDES;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-slide effect (2 seconds)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, slides.length]);

  // Reset index if slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Track banner impressions/views
  const viewedBannerIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const current = slides[currentIndex];
    if (current && current.id && current.id > 0 && !viewedBannerIds.current.has(current.id)) {
      viewedBannerIds.current.add(current.id);
      api.post(`/banners/${current.id}/view`).catch(() => {
        // Non-blocking view tracking
      });
    }
  }, [currentIndex, slides]);

  const handleBannerClick = (bannerId?: number) => {
    if (!bannerId || bannerId <= 0) return;
    api.post(`/banners/${bannerId}/click`).catch(() => {
      // Non-blocking click tracking
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/search?${params.toString()}`);
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <section 
      className="relative bg-slate-950 text-white overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Background Carousel Images (Normal, No Shadow Filters) ──────────── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={getFullImageUrl(slide.image_url)}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}
      </div>

      {/* ── Content Container ──────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-16 md:pb-20 flex flex-col justify-between min-h-[560px] md:min-h-[620px]">
        
        {/* Top & Hero Text Section */}
        <div className="max-w-2xl bg-emerald-950/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide mb-4 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>{currentSlide?.badge_text || "India's B2B Healthcare Marketplace"}</span>
          </div>

          {/* Slide Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3 tracking-tight min-h-[64px] sm:min-h-[96px] flex items-center">
            <span>
              {currentSlide?.title || "Buy & Sell Medical Equipment Online"}
            </span>
          </h1>

          {/* Slide Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-xl leading-relaxed min-h-[40px] sm:min-h-[48px] line-clamp-2">
            {currentSlide?.subtitle || "Connect with verified hospitals, diagnostic centers, and certified dealers across India."}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {currentSlide?.link_url && (
              <Button
                asChild
                size="lg"
                onClick={() => handleBannerClick(currentSlide?.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white hover:text-slate-950 font-bold px-6 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-600/40 transition-all text-sm group border-0"
              >
                <Link to={currentSlide.link_url}>
                  {currentSlide.button_text || "Explore Equipment"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 font-semibold px-5 rounded-xl backdrop-blur-md transition-all text-sm"
            >
              <Link to="/sell">
                Sell Equipment
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Search Bar Section ───────────────────────────────────────────── */}
        <div className="w-full max-w-4xl mt-4">
          <form
            onSubmit={handleSearch}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-800 flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400 shrink-0" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search equipment (e.g. 1.5T MRI, Ultrasound, CT)"
                className="pl-12 border-0 focus-visible:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base h-12 bg-transparent shadow-none"
              />
            </div>
            <div className="hidden sm:block w-px bg-slate-200 dark:bg-slate-800 my-1.5" />
            <div className="flex-1 relative flex items-center">
              <MapPin className="absolute left-4 h-5 w-5 text-slate-400 shrink-0" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or State (e.g. Mumbai, Delhi)"
                className="pl-12 border-0 focus-visible:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base h-12 bg-transparent shadow-none"
              />
            </div>
            <Button
              type="submit"
              className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold rounded-xl shadow-md whitespace-nowrap transition-transform active:scale-95"
            >
              Search
            </Button>
          </form>

          {/* Slide Navigation Controls */}
          {slides.length > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4 text-xs sm:text-sm text-slate-400">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isPaused ? "Play slide rotation" : "Pause slide rotation"}
                aria-label="Toggle autoplay"
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={prevSlide}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIndex ? "w-6 bg-emerald-400" : "w-2 bg-slate-600 hover:bg-slate-500"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextSlide}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
