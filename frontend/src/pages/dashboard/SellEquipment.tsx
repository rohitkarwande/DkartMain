import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, 
  Grid, ListChecks, Image as ImageIcon, IndianRupee, Eye,
  Activity, FileDigit, Stethoscope, Thermometer,
  ShieldCheck, Wrench, Package, MapPin, X
} from "lucide-react";
import { useCreateEquipment, useSingleEquipment, useUpdateEquipment, EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/hooks/useEquipment";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { WizardStepper } from "@/components/shared/WizardStepper";
import type { WizardStep } from "@/components/shared/WizardStepper";
import { UploadZone } from "@/components/shared/UploadZone";
import { Badge } from "@/components/ui/badge";

const STEPS: WizardStep[] = [
  { id: "category", label: "Category", icon: <Grid className="h-5 w-5" /> },
  { id: "details", label: "Details", icon: <ListChecks className="h-5 w-5" /> },
  { id: "images", label: "Images", icon: <ImageIcon className="h-5 w-5" /> },
  { id: "price", label: "Price & Location", icon: <IndianRupee className="h-5 w-5" /> },
  { id: "review", label: "Preview", icon: <Eye className="h-5 w-5" /> },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'MRI': <Activity className="h-8 w-8" />,
  'X-Ray': <FileDigit className="h-8 w-8" />,
  'Cathlab': <Activity className="h-8 w-8" />,
  'ECG': <Thermometer className="h-8 w-8" />,
  'Ultrasound': <Stethoscope className="h-8 w-8" />,
  'Ventilator': <Activity className="h-8 w-8" />,
  'CT Scan': <FileDigit className="h-8 w-8" />,
  'Patient Monitor': <Stethoscope className="h-8 w-8" />,
  'Defibrillator': <Thermometer className="h-8 w-8" />,
  'Laboratory Equipment': <FileDigit className="h-8 w-8" />,
  'Surgical Equipment': <Activity className="h-8 w-8" />,
  'Other': <Package className="h-8 w-8" />,
};

const CONDITION_INFO: Record<string, { label: string, desc: string, icon: React.ReactNode }> = {
  Used: { label: "Used", desc: "In working condition", icon: <CheckCircle2 className="h-6 w-6 text-blue-500" /> },
  Refurbished: { label: "Refurbished", desc: "Restored to OEM specs", icon: <ShieldCheck className="h-6 w-6 text-emerald-500" /> },
  Spare: { label: "Spare Parts", desc: "Components or parts", icon: <Wrench className="h-6 w-6 text-amber-500" /> },
};

export function SellEquipment() {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  
  const isEditing = !!id;
  const { data: existingData, isLoading: isLoadingExisting } = useSingleEquipment(id || "");

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    brand: "",
    model: "",
    manufacturingYear: "",
    condition: "" as typeof EQUIPMENT_CONDITIONS[number] | "",
    description: "",
    price: "",
    city: "",
    state: "",
    files: [] as File[],
    existingImages: [] as Array<{ id: number, image_url: string }>,
    deletedImages: [] as number[],
  });

  useEffect(() => {
    if (isEditing && existingData) {
      setFormData(prev => ({
        ...prev,
        category: existingData.category || "",
        title: existingData.title || "",
        brand: existingData.brand || "",
        model: existingData.model || "",
        manufacturingYear: existingData.manufacturing_year ? String(existingData.manufacturing_year) : "",
        condition: (existingData.condition as any) || "",
        description: existingData.description || "",
        price: existingData.price ? String(existingData.price) : "",
        city: existingData.city || "",
        state: existingData.state || "",
        existingImages: existingData.images || [],
        deletedImages: [],
      }));
    }
  }, [isEditing, existingData]);

  const update = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const nextStep = () => {
    setError("");
    if (currentStep === 0 && !formData.category) return setError("Please select a category.");
    if (currentStep === 1 && (!formData.title || !formData.brand || !formData.model || !formData.condition)) 
      return setError("Please fill in all required fields (Title, Brand, Model, Condition).");
    if (currentStep === 3 && (!formData.price || !formData.city)) 
      return setError("Price and City are required.");
    
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeExistingImage = (imageId: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter(img => img.id !== imageId),
      deletedImages: [...prev.deletedImages, imageId]
    }));
  };

  const handlePublish = async () => {
    setError("");
    const data = new FormData();
    data.append("title", formData.title);
    data.append("category", formData.category);
    data.append("brand", formData.brand);
    data.append("model", formData.model);
    data.append("condition", formData.condition);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("city", formData.city);
    if (formData.state) data.append("state", formData.state);
    if (formData.manufacturingYear) data.append("manufacturingYear", formData.manufacturingYear);

    formData.files.forEach((file) => {
      data.append(isEditing && id ? "newImages" : "images", file);
    });

    formData.deletedImages.forEach((imgId) => {
      data.append("deletedImages", String(imgId));
    });

    try {
      if (isEditing && id) {
        await updateEquipment.mutateAsync({ id, formData: data });
      } else {
        await createEquipment.mutateAsync(data);
      }
      navigate("/dashboard/listings");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to publish listing. Please try again.");
    }
  };

  if (isEditing && isLoadingExisting) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">List Your Equipment</h1>
          <p className="text-slate-500 mt-3 text-lg">Reach thousands of verified buyers across India.</p>
        </div>

        <div className="mb-12">
          <WizardStepper steps={STEPS} currentStep={currentStep} />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl bg-white p-6 md:p-10 relative overflow-hidden">
          
          {/* Animated Background Blob */}
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-64 h-64 rounded-full bg-emerald-50 opacity-50 pointer-events-none blur-3xl"></div>

          {/* STEP 0: Category */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative z-10">
              <h2 className="text-2xl font-bold text-slate-900">What are you selling?</h2>
              <p className="text-slate-500 mb-6">Select the category that best fits your equipment.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {EQUIPMENT_CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => update("category", cat)}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]"
                          : "border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className={`mb-3 transition-transform duration-200 ${isSelected ? "text-emerald-600 scale-110" : "text-slate-400"}`}>
                        {CATEGORY_ICONS[cat] || <Package className="h-8 w-8" />}
                      </div>
                      <span className={`text-sm font-bold text-center ${isSelected ? "text-emerald-800" : "text-slate-700"}`}>
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 relative z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Equipment Details</h2>
                <p className="text-slate-500 text-sm">Provide accurate details to attract buyers.</p>
              </div>
              
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {/* Title & Year in one row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-sm">Equipment Title <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="e.g. GE Optima MR360 1.5T"
                      className="h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Year of Mfg</Label>
                    <Input
                      type="number"
                      value={formData.manufacturingYear}
                      onChange={(e) => update("manufacturingYear", e.target.value)}
                      placeholder="YYYY"
                      min="1990"
                      max={String(new Date().getFullYear())}
                      className="h-10 bg-white"
                    />
                  </div>
                </div>

                {/* Brand & Model in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Brand <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => update("brand", e.target.value)}
                      placeholder="e.g. GE Healthcare"
                      className="h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Model Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => update("model", e.target.value)}
                      placeholder="e.g. Optima MR360"
                      className="h-10 bg-white"
                    />
                  </div>
                </div>

                {/* Condition Cards */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Equipment Condition <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EQUIPMENT_CONDITIONS.map((cond) => {
                      const isSelected = formData.condition === cond;
                      const info = CONDITION_INFO[cond];
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => update("condition", cond)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-emerald-200"
                          }`}
                        >
                          <div className="shrink-0 scale-90">{info.icon}</div>
                          <div>
                            <div className={`font-bold text-sm ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                              {info.label}
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight">{info.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Describe history, accessories, condition..."
                    className="resize-none bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Images */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Upload Photos</h2>
                <p className="text-slate-500 mt-1">Upload clear, well-lit photos. Listings with photos get 3x more views.</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <UploadZone onUpload={(files) => update("files", files)} />
                
                {(formData.existingImages.length > 0 || formData.files.length > 0) && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Selected Photos ({formData.existingImages.length + formData.files.length}/10)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                      {/* Existing Images */}
                      {formData.existingImages.map((img) => (
                        <div key={`existing-${img.id}`} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-sm hover:border-emerald-500 transition-colors">
                          <img src={`${API_BASE_URL}${img.image_url}`} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeExistingImage(img.id)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* New Files */}
                      {formData.files.map((file, i) => (
                        <div key={`new-${i}`} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-sm hover:border-emerald-500 transition-colors">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-white text-xs truncate w-full">{file.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.existingImages.length === 0 && formData.files.length === 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-800 text-sm">
                    ⚠️ <div><strong>No images selected.</strong> You can continue without images, but your listing will be saved as a Draft and won't be visible to buyers until you add photos.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Price & Location */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Price & Location</h2>
                <p className="text-slate-500 mt-1">Set your asking price and equipment location.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-4 md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <Label className="text-base text-slate-900">Asking Price (₹) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xl">₹</div>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="h-14 pl-10 text-2xl font-bold bg-slate-50 border-slate-200"
                    />
                  </div>
                  {formData.price && (
                    <p className="text-emerald-600 font-medium">
                      Formatted: ₹{Number(formData.price).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      value={formData.city}
                      onChange={(e) => update("city", e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="h-12 pl-10 bg-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="h-12 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review Preview */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Live Preview</h2>
                <p className="text-slate-500 mt-1">This is how buyers will see your listing.</p>
              </div>

              {/* Fake Equipment Card Preview */}
              <div className="max-w-sm mx-auto sm:mx-0">
                <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {formData.files.length > 0 ? (
                      <img 
                        src={URL.createObjectURL(formData.files[0])} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : formData.existingImages.length > 0 ? (
                      <img 
                        src={`${API_BASE_URL}${formData.existingImages[0].image_url}`} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900 hover:bg-white border-0 font-semibold shadow-sm">
                      {formData.category}
                    </Badge>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight">
                        {formData.title || "Untitled Equipment"}
                      </h3>
                    </div>
                    
                    <div className="flex items-center text-slate-500 text-sm mb-4">
                      <span>{formData.brand || "Brand"}</span>
                      <span className="mx-2">•</span>
                      <span className="text-emerald-600 font-medium">{formData.condition || "Condition"}</span>
                    </div>

                    <div className="mt-auto">
                      <div className="text-2xl font-bold text-slate-900 mb-3">
                        {formData.price ? `₹${Number(formData.price).toLocaleString('en-IN')}` : "Price TBD"}
                      </div>
                      
                      <div className="flex items-center text-slate-500 text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{[formData.city, formData.state].filter(Boolean).join(", ") || "Location TBD"}</span>
                      </div>
                      
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold h-11" disabled>
                        Contact Seller
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {!formData.files.length && !formData.existingImages.length && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3 mt-6">
                  ⚠️ <div>Your listing has no images and will be saved as a <strong>Draft</strong>. It won't appear in search results until images are added.</div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 h-12 rounded-xl text-slate-600 hover:bg-slate-50 border-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep} className="px-8 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-900/20">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={createEquipment.isPending || updateEquipment.isPending}
                className="px-8 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 text-lg"
              >
                {createEquipment.isPending || updateEquipment.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isEditing ? "Saving..." : "Publishing..."}</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-5 w-5" /> {isEditing ? "Save Changes" : "Publish Listing"}</>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
