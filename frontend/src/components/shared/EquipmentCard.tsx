import { MapPin, Verified, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EquipmentCardProps {
  id: string;
  title: string;
  brand: string;
  category?: string;
  price: number;
  location: string;
  condition: string;
  image: string;
  isVerified?: boolean;
  status?: string;
  isSponsored?: boolean;
}

export function EquipmentCard({
  id,
  title,
  brand,
  category,
  price,
  location,
  condition,
  image,
  isVerified = true,
  status,
  isSponsored = false,
}: EquipmentCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link to={`/equipment/${id}`} className="block h-full group">
      <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${status === 'Sold' ? 'opacity-75' : ''} ${isSponsored ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/50' : ''}`}>
        <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={image}
            alt={title}
            className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ${status === 'Sold' ? 'grayscale' : ''}`}
          />
          {/* Condition badge — top left */}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-bold text-slate-800 dark:text-white border border-slate-200/50 dark:border-slate-700 shadow-sm">
              {condition}
            </Badge>
          </div>
          {/* Sponsored badge — top right */}
          {isSponsored && (
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wide">
                <Sparkles className="h-2.5 w-2.5" /> Sponsored
              </span>
            </div>
          )}
          {status === 'Sold' && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-white/95 dark:bg-slate-900/95 px-4 py-1.5 rounded-lg font-extrabold text-slate-900 dark:text-white tracking-wider shadow-lg transform -rotate-12 border-2 border-slate-800 dark:border-slate-600">
                SOLD OUT
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{brand}</div>
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug mb-3 line-clamp-2">
            {title}
          </h3>
          
          <div className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-100">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {category && (
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-slate-400 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">Category: <span className="font-bold text-slate-700 dark:text-slate-300">{category}</span></span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
          <div>
            <div className="font-extrabold text-lg text-slate-900 dark:text-white">{formattedPrice}</div>
            {isVerified && (
              <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                <Verified className="h-3.5 w-3.5 mr-1" /> Verified Seller
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="hidden group-hover:flex font-bold dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 dark:hover:text-white">
            Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
