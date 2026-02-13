import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { cn } from '@/lib/utils';

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
  'jne-zalora': 'JNE',
  'zalora-sap': 'ZALORA',
  'lazada': 'LAZADA',
  'ninja': 'NINJA',
  'instan-sameday': 'INSTAN',
  'spx-central': 'SPX CTR',
  'spare': 'LAINNYA',
};

export function CategoryTabs({ activeCategory, onCategoryChange, counts }: CategoryTabsProps) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-2">
      <div className="grid grid-cols-5 gap-1.5">
        {COURIER_CATEGORIES.map((category) => {
          const count = counts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const displayName = DISPLAY_NAMES[category.id] || category.shortName;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              style={{
                backgroundColor: isActive ? category.color : undefined,
                borderColor: category.color,
              }}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 rounded-lg font-bold transition-all border-2 min-w-0",
                "hover:scale-105",
                isActive 
                  ? "text-white shadow-lg" 
                  : "bg-background hover:opacity-80"
              )}
            >
              <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold leading-tight">
                {displayName}
              </span>
              <span className={cn(
                "text-[9px] sm:text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-bold",
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