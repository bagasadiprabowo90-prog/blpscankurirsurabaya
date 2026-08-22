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
  'anteraja': 'Anteraja',
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
        className="flex items-stretch gap-1 overflow-x-auto border-2 border-[hsl(var(--ink))] bg-card p-1 shadow-[3px_3px_0_0_hsl(var(--ink)/0.12)] no-scrollbar snap-x"
        style={{ borderRadius: 'var(--radius)' }}
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
                'whitespace-nowrap select-none px-2.5 sm:px-4 py-2',
                // radius inner = outer - gap (formula iOS proportional corners)
                '[border-radius:calc(var(--radius)-4px)]',
                // Tipografi plat mesin: condensed, uppercase
                'font-display uppercase tracking-wide text-sm sm:text-base transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive
                  ? 'font-bold bg-[hsl(var(--ink))] text-[hsl(var(--ink-foreground))]'
                  : 'font-semibold text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98]'
              )}
            >
              {/* Titik warna identitas kurir — selalu terlihat, bahkan di plat aktif */}
              <span
                aria-hidden="true"
                className={cn(
                  'h-2.5 w-2.5 rounded-full shrink-0',
                  !isActive && 'opacity-80 group-hover:opacity-100'
                )}
                style={{ backgroundColor: category.color }}
              />

              {/* Nama kurir */}
              <span className="leading-none">{displayName}</span>

              {/* Badge jumlah resi */}
              <span
                className={cn(
                  'tabular min-w-[1.75rem] border px-1.5 py-1 text-center text-[11px] leading-none font-bold',
                  '[border-radius:calc(var(--radius)-6px)]',
                  isActive
                    ? 'border-[hsl(var(--ink-foreground)/0.35)] text-[hsl(var(--ink-foreground))]'
                    : 'border-border bg-background text-muted-foreground'
                )}
              >
                {count.toLocaleString('id-ID')}
              </span>
            </button>
          );
        })}

        {/* Total resi — non-scroll, sebagai penutup kanan */}
        <div
          aria-hidden="true"
          className="hidden md:flex items-center gap-1.5 self-center whitespace-nowrap px-3 py-2"
        >
          <span className="panel-label">Total</span>
          <span className="tabular [border-radius:calc(var(--radius)-6px)] border border-[hsl(var(--ink)/0.4)] bg-background px-2 py-0.5 text-[11px] font-bold text-foreground">
            {total.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Petunjuk visual: konten masih bisa di-scroll (mobile) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-md bg-gradient-to-l from-card to-transparent sm:hidden" />
    </div>
  );
}
