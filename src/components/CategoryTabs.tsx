import React, { useRef } from 'react';
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const total = COURIER_CATEGORIES.reduce((sum, c) => sum + (counts[c.id] || 0), 0);

  // Navigasi keyboard: panah kiri/kanan, Home, End (standar WAI-ARIA tabs)
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const lastIndex = COURIER_CATEGORIES.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextCategory = COURIER_CATEGORIES[nextIndex];
    onCategoryChange(nextCategory.id);
    const nextTab = tabRefs.current[nextIndex];
    nextTab?.focus();
    nextTab?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  };

  return (
    <div className="relative">
      <div
        role="tablist"
        aria-label="Kategori Kurir"
        className="flex items-stretch gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-sm no-scrollbar snap-x"
      >
        {COURIER_CATEGORIES.map((category, index) => {
          const count = counts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const displayName = DISPLAY_NAMES[category.id] || category.shortName;

          return (
            <button
              key={category.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onCategoryChange(category.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              title={`${category.name} — ${count.toLocaleString('id-ID')} resi`}
              className={cn(
                // Layout: lebar sama rata di desktop, bisa scroll di mobile
                'group relative flex flex-1 shrink-0 items-center justify-center gap-1.5 sm:gap-2 snap-start',
                'whitespace-nowrap select-none rounded-lg px-2.5 sm:px-4 py-2.5',
                // Tipografi & transisi
                'text-[13px] sm:text-sm transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive
                  ? 'font-bold shadow-sm'
                  : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-[0.98]'
              )}
              style={
                isActive
                  ? {
                      color: category.color,
                      backgroundColor: `color-mix(in srgb, ${category.color} 12%, transparent)`,
                      boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${category.color} 55%, transparent), 0 1px 3px rgb(0 0 0 / 0.08)`,
                    }
                  : undefined
              }
            >
              {/* Titik warna identitas kurir — selalu terlihat */}
              <span
                aria-hidden="true"
                className={cn(
                  'h-2.5 w-2.5 rounded-full shrink-0 transition-transform duration-150',
                  isActive ? 'scale-125' : 'opacity-80 group-hover:opacity-100'
                )}
                style={{ backgroundColor: category.color }}
              />

              {/* Nama kurir */}
              <span className="leading-none">{displayName}</span>

              {/* Badge jumlah resi */}
              <span
                className={cn(
                  'min-w-[1.75rem] rounded-full px-1.5 py-1 text-center text-[11px] leading-none font-bold tabular-nums',
                  !isActive && 'bg-muted text-muted-foreground'
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `color-mix(in srgb, ${category.color} 22%, transparent)`,
                        color: category.color,
                      }
                    : undefined
                }
              >
                {count.toLocaleString('id-ID')}
              </span>
            </button>
          );
        })}

        {/* Total resi — non-scroll, sebagai penutup kanan */}
        <div
          aria-hidden="true"
          className="hidden md:flex items-center gap-1.5 self-center whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground"
        >
          <span>Total</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
            {total.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Petunjuk visual: konten masih bisa di-scroll (mobile) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l from-card to-transparent sm:hidden" />
    </div>
  );
}
