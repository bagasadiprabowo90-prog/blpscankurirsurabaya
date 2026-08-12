import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  activeCategory: CourierCategory;
  onCategoryChange: (category: CourierCategory) => void;
  counts: Record<CourierCategory, number>;
}

const DISPLAY_NAMES: Record<string, string> = {
  'shopee': 'Shopee',
  'jnt': 'J&T',
  'goto': 'GoTo',
  'jne': 'JNE',
  'instan-sameday': 'Instan',
  'spare': 'Lainnya',
};

export function CategoryTabs({ activeCategory, onCategoryChange, counts }: CategoryTabsProps) {
  return (
    <div className="border-b">
      <div className="flex overflow-x-auto -mb-px">
        {COURIER_CATEGORIES.map((category) => {
          const count = counts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const displayName = DISPLAY_NAMES[category.id] || category.shortName;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                "border-b-2 -mb-px",
                isActive
                  ? "border-current text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
              style={isActive ? { color: category.color } : undefined}
            >
              <span>{displayName}</span>
              <span
                className={cn(
                  "text-xs tabular-nums min-w-[1.25rem] text-center rounded px-1 py-0.5",
                  isActive
                    ? "bg-current/10 font-semibold"
                    : "bg-muted text-muted-foreground"
                )}
                style={isActive ? { backgroundColor: `color-mix(in srgb, ${category.color} 15%, transparent)`, color: category.color } : undefined}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}