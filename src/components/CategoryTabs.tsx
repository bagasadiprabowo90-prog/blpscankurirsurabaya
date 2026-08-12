import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { cn } from '@/lib/utils';
import { Boxes, Package, ShoppingBag, Truck, Zap, Bike, type LucideIcon } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: CourierCategory;
  onCategoryChange: (category: CourierCategory) => void;
  counts: Record<CourierCategory, number>;
}

// Nama pendek yang jelas untuk setiap kurir
const DISPLAY_NAMES: Record<string, string> = {
  'shopee': 'SHOPEE',
  'jnt': 'J&T',
  'goto': 'GOTO',
  'jne': 'JNE',
  'instan-sameday': 'INSTAN',
  'spare': 'LAINNYA',
};

const TAB_ICONS: Record<CourierCategory, LucideIcon> = {
  shopee: ShoppingBag,
  jnt: Truck,
  goto: Bike,
  jne: Package,
  'instan-sameday': Zap,
  spare: Boxes,
};

export function CategoryTabs({ activeCategory, onCategoryChange, counts }: CategoryTabsProps) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-2 sm:p-3">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {COURIER_CATEGORIES.map((category) => {
          const count = counts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const displayName = DISPLAY_NAMES[category.id] || category.shortName;
          const Icon = TAB_ICONS[category.id];
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              style={{
                backgroundColor: isActive ? category.color : undefined,
                borderColor: category.color,
              }}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2.5 sm:py-3 rounded-lg font-bold transition-all border-2 min-w-0",
                "hover:scale-105 active:scale-95",
                isActive 
                  ? "text-white shadow-lg" 
                  : "bg-background hover:opacity-80"
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-full mb-1 flex items-center justify-center",
                  isActive ? "bg-white/25" : "bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="text-xs sm:text-sm font-bold leading-tight">
                {displayName}
              </span>
              <span className={cn(
                "text-xs sm:text-sm mt-1 px-2 py-0.5 rounded-full font-bold",
                isActive 
                  ? "bg-white/30 text-white" 
                  : "bg-muted text-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}