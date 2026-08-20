import React, { useState } from "react";
import {
  useAllHeroBanners,
  useCreateHeroBanner,
  useUpdateHeroBanner,
  useDeleteHeroBanner,
  useReorderHeroBanners,
  type HeroBanner,
} from "@/hooks/useHeroBanners";
import {
  useFeatureFlags,
  useUpdateFeatureFlag,
} from "@/hooks/useFeatureFlags";
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";

export function HeroBanners() {
  const { data: banners, isLoading: isLoadingBanners } = useAllHeroBanners();
  const { data: featureFlags, isLoading: isLoadingFlags } = useFeatureFlags();

  const { mutate: updateFlag, isPending: isUpdatingFlag } = useUpdateFeatureFlag();
  const { mutate: createBanner, isPending: isCreating } = useCreateHeroBanner();
  const { mutate: updateBanner, isPending: isUpdating } = useUpdateHeroBanner();
  const { mutate: deleteBanner } = useDeleteHeroBanner();
  const { mutate: reorderBanners, isPending: isReordering } = useReorderHeroBanners();

  const isCarouselEnabled = featureFlags?.flags?.enable_hero_carousel ?? true;

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("Featured Equipment");
  const [linkUrl, setLinkUrl] = useState("/search");
  const [buttonText, setButtonText] = useState("Explore Equipment");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>("");

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleFeatureFlag = () => {
    updateFlag(
      { key: "enable_hero_carousel", is_enabled: !isCarouselEnabled },
      {
        onSuccess: () => {
          showToast(
            `Hero Carousel is now ${!isCarouselEnabled ? "ENABLED" : "DISABLED"} on landing page!`
          );
        },
        onError: () => {
          showToast("Failed to update feature flag.", "error");
        },
      }
    );
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setBadgeText("Featured Equipment");
    setLinkUrl("/search");
    setButtonText("Explore Equipment");
    setDisplayOrder((banners?.length || 0) + 1);
    setIsActive(true);
    setImageUrl("");
    setImageFile(null);
    setPreviewSrc("");
    setIsModalOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setBadgeText(banner.badge_text || "Featured Equipment");
    setLinkUrl(banner.link_url || "/search");
    setButtonText(banner.button_text || "Explore Now");
    setDisplayOrder(banner.display_order || 0);
    setIsActive(banner.is_active);
    setImageUrl(banner.image_url.startsWith("http") ? banner.image_url : "");
    setImageFile(null);
    setPreviewSrc(getFullImageUrl(banner.image_url));
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl(""); // prioritize file
      setPreviewSrc(URL.createObjectURL(file));
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (!imageFile) {
      setPreviewSrc(url);
    }
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Please provide a title for the banner.", "error");
      return;
    }

    if (!imageFile && !imageUrl.trim() && !editingBanner) {
      showToast("Please provide an image file or URL.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("subtitle", subtitle.trim());
    formData.append("badge_text", badgeText.trim());
    formData.append("link_url", linkUrl.trim());
    formData.append("button_text", buttonText.trim());
    formData.append("display_order", String(displayOrder));
    formData.append("is_active", String(isActive));

    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imageUrl.trim()) {
      formData.append("image_url", imageUrl.trim());
    }

    if (editingBanner) {
      updateBanner(
        { id: editingBanner.id, formData },
        {
          onSuccess: () => {
            showToast("Banner updated successfully!");
            setIsModalOpen(false);
          },
          onError: () => {
            showToast("Failed to update banner.", "error");
          },
        }
      );
    } else {
      createBanner(formData, {
        onSuccess: () => {
          showToast("New banner created successfully!");
          setIsModalOpen(false);
        },
        onError: () => {
          showToast("Failed to create banner.", "error");
        },
      });
    }
  };

  const handleDeleteBanner = (id: number) => {
    if (window.confirm("Are you sure you want to delete this banner slide?")) {
      deleteBanner(id, {
        onSuccess: () => showToast("Banner deleted successfully!"),
        onError: () => showToast("Failed to delete banner.", "error"),
      });
    }
  };

  const handleToggleActive = (banner: HeroBanner) => {
    const formData = new FormData();
    formData.append("is_active", String(!banner.is_active));

    updateBanner(
      { id: banner.id, formData },
      {
        onSuccess: () =>
          showToast(`Banner marked ${!banner.is_active ? "Active" : "Inactive"}`),
        onError: () => showToast("Failed to update banner status.", "error"),
      }
    );
  };

  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    if (!banners) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newOrder = [...banners];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const bannerIds = newOrder.map((b) => b.id);
    reorderBanners(bannerIds, {
      onSuccess: () => showToast("Banner order updated!"),
      onError: () => showToast("Failed to update order.", "error"),
    });
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Toast Alert ────────────────────────────────────────────────────── */}
      {feedback && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-950 border-emerald-600 text-emerald-200"
              : "bg-red-950 border-red-600 text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl">
              <Sliders className="h-6 w-6" />
            </div>
            Landing Page Hero Carousel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage sliding equipment banners and toggle carousel visibility on the marketplace homepage.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-600/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload New Slide
        </Button>
      </div>

      {/* ── Feature Flag Control Card ───────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl border transition-colors ${
              isCarouselEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                Landing Page Carousel Feature Flag
              </h3>
              <Badge
                className={
                  isCarouselEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }
              >
                {isCarouselEnabled ? "ACTIVE (SLIDING CAROUSEL)" : "DISABLED (STATIC HERO)"}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Toggle this flag to instantly enable or disable the interactive dynamic equipment carousel for all landing page visitors. When disabled, the marketplace falls back to the classic static hero.
            </p>
          </div>
        </div>

        <Button
          onClick={handleToggleFeatureFlag}
          disabled={isUpdatingFlag || isLoadingFlags}
          variant="outline"
          className={`shrink-0 font-semibold px-6 py-2.5 rounded-xl transition-all border ${
            isCarouselEnabled
              ? "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
        >
          {isUpdatingFlag ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isCarouselEnabled ? (
            <ToggleRight className="h-5 w-5 mr-2 text-emerald-400" />
          ) : (
            <ToggleLeft className="h-5 w-5 mr-2 text-slate-500" />
          )}
          {isCarouselEnabled ? "Disable Carousel" : "Enable Carousel"}
        </Button>
      </div>

      {/* ── Banners List ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Configured Carousel Slides</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {banners?.length || 0} Slides
            </span>
          </h2>
        </div>

        {isLoadingBanners ? (
          <div className="flex h-48 items-center justify-center bg-slate-900 rounded-2xl border border-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : !banners || banners.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
            <ImageIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No custom banner slides yet</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">
              The landing page is currently displaying built-in curated medical equipment fallback slides.
            </p>
            <Button
              onClick={openCreateModal}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 rounded-xl"
            >
              Upload First Slide
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col md:flex-row items-start md:items-center gap-5 justify-between ${
                  banner.is_active
                    ? "border-slate-800 hover:border-slate-700"
                    : "border-slate-800/60 opacity-65"
                }`}
              >
                {/* Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0 || isReordering}
                      onClick={() => handleMoveOrder(index, "up")}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === banners.length - 1 || isReordering}
                      onClick={() => handleMoveOrder(index, "down")}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Image Thumbnail */}
                  <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative group">
                    <img
                      src={getFullImageUrl(banner.image_url)}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white">
                      #{banner.display_order}
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        {banner.badge_text || "Featured"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          banner.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {banner.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white truncate">
                      {banner.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-xl mt-0.5">
                      {banner.subtitle || "No subtitle provided"}
                    </p>

                    {banner.link_url && (
                      <div className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2 font-mono">
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate">{banner.link_url}</span>
                        {banner.button_text && (
                          <span className="text-slate-500 font-sans">
                            ({banner.button_text})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(banner)}
                    className={`h-9 px-3 rounded-lg text-xs font-medium border ${
                      banner.is_active
                        ? "text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                        : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    }`}
                  >
                    {banner.is_active ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Activate
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(banner)}
                    className="h-9 px-3 rounded-lg text-xs font-medium bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="h-9 px-3 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-violet-400" />
                {editingBanner ? "Edit Carousel Slide" : "Upload New Hero Banner"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBanner} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Slide Title *
                </label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced 1.5T & 3.0T MRI Scanners"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Subtitle / Description
                </label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={2}
                  placeholder="e.g. Verified high-performance imaging systems from GE, Siemens & Philips with complete service history."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {/* Badge & Order Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Badge Text
                  </label>
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. Premium Imaging / New Arrivals"
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Display Order
                  </label>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    placeholder="1, 2, 3..."
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-violet-500"
                  />
                </div>
              </div>

              {/* CTA Link & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Button Text
                  </label>
                  <Input
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Browse MRI Systems"
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Destination URL / Path
                  </label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. /search?category=MRI"
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-violet-500"
                  />
                </div>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Equipment Banner Image *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload */}
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-violet-500 rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-colors">
                    <Upload className="h-6 w-6 text-violet-400 mb-2" />
                    <span className="text-xs font-semibold text-white">
                      {imageFile ? imageFile.name : "Upload Image File"}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* Direct URL */}
                  <div>
                    <Input
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="Or enter direct Image URL (https://...)"
                      className="h-full bg-slate-950 border-slate-800 text-white text-xs placeholder:text-slate-500 focus-visible:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Preview Thumbnail */}
                {previewSrc && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-4">
                    <img
                      src={previewSrc}
                      alt="Preview"
                      className="w-24 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-white">Image Preview</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                        {imageFile ? `Local file: ${imageFile.name}` : previewSrc}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 bg-slate-950 border-slate-700 focus:ring-violet-500"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-200 cursor-pointer">
                  Activate this banner immediately on landing page
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 rounded-xl"
                >
                  {isCreating || isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingBanner ? "Update Slide" : "Save Slide"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
