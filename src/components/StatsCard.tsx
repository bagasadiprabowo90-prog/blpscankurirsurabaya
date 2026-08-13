import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  total: number;
  duplicates: number;
  byCategory: Record<CourierCategory, number>;
}

export function StatsCard({ total, duplicates, byCategory }: StatsCardProps) {
  return (
    <section className="work-panel" aria-label="Ringkasan scan">
      {/* Counter mesin — dua angka besar dipisahkan garis, bukan kartu */}
      <div className="grid grid-cols-2 divide-x-2 divide-[hsl(var(--ink)/0.1)]">
        <div className="px-4 py-3.5">
          <p className="panel-label">Total Resi</p>
          <p className="tabular font-display text-[2.75rem] leading-none font-bold mt-1.5">
            {total.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="px-4 py-3.5">
          <p className="panel-label flex items-center gap-1.5">
            <AlertTriangle className={cn('h-3.5 w-3.5', duplicates > 0 ? 'text-destructive' : 'opacity-40')} />
            Duplikat
          </p>
          <p className={cn(
            'tabular font-display text-[2.75rem] leading-none font-bold mt-1.5',
            duplicates > 0 ? 'text-destructive' : 'text-muted-foreground/40'
          )}>
            {duplicates.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Ledger kategori — baris rapat: dot + nama + angka kanan */}
      <div className="border-t-2 border-[hsl(var(--ink)/0.1)] px-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {COURIER_CATEGORIES.map((category) => {
            const count = byCategory[category.id] || 0;
            return (
              <div
                key={category.id}
                className="flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="tabular font-mono text-sm font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
