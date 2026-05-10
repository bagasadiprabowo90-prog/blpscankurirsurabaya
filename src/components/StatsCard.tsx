import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { Package, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  total: number;
  duplicates: number;
  byCategory: Record<CourierCategory, number>;
}

export function StatsCard({ total, duplicates, byCategory }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-5">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Resi</p>
            <p className="text-2xl font-bold">{total.toLocaleString('id-ID')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Duplikat</p>
            <p className="text-2xl font-bold text-destructive">{duplicates.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Per Courier - Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COURIER_CATEGORIES.map((category) => {
          const count = byCategory[category.id] || 0;
          
          return (
            <div 
              key={category.id} 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
            >
              <div 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-muted-foreground truncate">{category.name}</span>
              <span className="ml-auto text-sm font-bold">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
