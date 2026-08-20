import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search as SearchIcon, Filter, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { API_BASE_URL } from "@/lib/api";

const CATEGORIES = ["MRI", "X-Ray", "Cathlab", "ECG", "Ultrasound", "Refurbished", "Spare_Parts", "Monitoring", "Surgical", "Diagnostic"];
const CONDITIONS = ["New", "Refurbished", "Used", "Spare Parts"];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category") ? [searchParams.get("category")!] : []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    keyword: keyword || undefined,
    category: selectedCategories[0] || undefined,
    condition: selectedConditions[0] || undefined,
  };

  const { data: equipment, isLoading, isError } = useEquipment(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    if (keyword) params.keyword = keyword;
    if (selectedCategories[0]) params.category = selectedCategories[0];
    if (selectedConditions[0]) params.condition = selectedConditions[0];
    setSearchParams(params);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? [] : [cat]);
  };
  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev => prev.includes(cond) ? [] : [cond]);
  };
  const clearAll = () => {
    setKeyword("");
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSearchParams({});
  };

  const hasFilters = keyword || selectedCategories.length > 0 || selectedConditions.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search medical equipment by name, brand, or category..." 
            className="pl-11 h-12 text-base border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <Button type="submit" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm">
          Search
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="h-12 px-4 md:hidden dark:border-slate-700 dark:text-white"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </form>

      <div className="flex gap-8">
        
        {/* Sidebar Filters */}
        <div className={`w-56 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Filters
              </h3>
              {hasFilters && (
                <button onClick={clearAll} className="text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">Category</h4>
                <div className="space-y-2.5">
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center space-x-2.5">
                      <Checkbox 
                        id={`cat-${cat}`}
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                        className="dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <label htmlFor={`cat-${cat}`} className="text-sm font-medium text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none">
                        {cat.replace("_", " ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">Condition</h4>
                <div className="space-y-2.5">
                  {CONDITIONS.map((cond) => (
                    <div key={cond} className="flex items-center space-x-2.5">
                      <Checkbox 
                        id={`cond-${cond}`}
                        checked={selectedConditions.includes(cond)}
                        onCheckedChange={() => toggleCondition(cond)}
                        className="dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <label htmlFor={`cond-${cond}`} className="text-sm font-medium text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none">
                        {cond}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {keyword && (
                <Badge variant="secondary" className="gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold px-2.5 py-1">
                  {keyword} <button onClick={() => setKeyword("")} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {selectedCategories.map(c => (
                <Badge key={c} variant="secondary" className="gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold px-2.5 py-1">
                  {c} <button onClick={() => toggleCategory(c)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {selectedConditions.map(c => (
                <Badge key={c} variant="secondary" className="gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold px-2.5 py-1">
                  {c} <button onClick={() => toggleCondition(c)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {isLoading ? "Searching..." : `${equipment?.length ?? 0} Results Found`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900/50">
              Failed to search equipment. Make sure the backend is running.
            </div>
          ) : !equipment?.length ? (
            <div className="p-16 text-center border rounded-2xl bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800">
              <SearchIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No equipment found</h3>
              <p className="text-slate-400 dark:text-slate-500 mt-1 mb-6">Try adjusting your search terms or removing some filters.</p>
              <Button variant="outline" onClick={clearAll} className="dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.map((item: any) => (
                <EquipmentCard 
                  key={item.id}
                  id={String(item.id)}
                  title={item.title}
                  brand={item.brand}
                  category={item.category}
                  price={item.price}
                  location={[item.city, item.state].filter(Boolean).join(", ") || "India"}
                  condition={item.condition}
                  status={item.status}
                  isSponsored={item.is_sponsored}
                  image={item.images?.[0]?.image_url 
                    ? `${API_BASE_URL}${item.images[0].image_url}` 
                    : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
