import { COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';
import { Package, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  total: number;
  duplicates: number;
  byCategory: Record<CourierCategory, number>;
}

export function StatsCard({ total, duplicates, byCategory }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-4">
      {/* Main Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-xl font-bold">{total.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span className="text-sm text-muted-foreground">Duplikat:</span>
          <span className="text-xl font-bold text-destructive">{duplicates.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Per Courier - Compact */}
      <div className="flex flex-wrap gap-3">
        {COURIER_CATEGORIES.map((category) => {
          const count = byCategory[category.id] || 0;
          
          return (
            <div 
              key={category.id} 
              className="flex items-center gap-1.5 text-sm"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <span className="text-muted-foreground">{category.name}:</span>
              <span className="font-semibold">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
