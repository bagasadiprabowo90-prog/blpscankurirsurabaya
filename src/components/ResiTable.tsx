import React, { useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ResiRecord } from '@/lib/db';
import { getCategoryConfig } from '@/lib/courierCategories';
import { cn } from '@/lib/utils';
import { Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResiTableProps {
  records: ResiRecord[];
  onDelete: (id: string) => void;
  showCategory?: boolean;
}

export function ResiTable({ records, onDelete, showCategory = true }: ResiTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.timestamp - a.timestamp);
  }, [records]);

  const rowVirtualizer = useVirtualizer({
    count: sortedRecords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 20,
  });

  const formatDateTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${day} ${month} ${year}, ${time}`;
  }, []);

  return (
    <div className="work-panel flex flex-col h-full min-h-0">
      {/* Header - Desktop (plat gelap ala mesin kasir/ledger) */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[hsl(var(--ink))] font-display uppercase tracking-wider text-xs font-semibold text-[hsl(var(--ink-foreground))] shrink-0">
        <div className="col-span-1">No</div>
        <div className="col-span-4">Nomor Resi</div>
        {showCategory && <div className="col-span-2">Kategori</div>}
        <div className={cn(showCategory ? "col-span-2" : "col-span-4")}>Waktu</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 text-right">Aksi</div>
      </div>

      {/* Virtual List or Empty State */}
      <div
        ref={parentRef}
        className="overflow-y-auto flex-1 min-h-0 relative"
      >
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center text-muted-foreground">
            <Package className="w-16 h-16 mb-4 opacity-40" />
            <p className="font-display uppercase tracking-wide text-2xl font-bold text-foreground">Belum ada data</p>
            <p className="mt-1 font-mono text-sm">Mulai scan resi untuk menampilkan data</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const record = sortedRecords[virtualItem.index];
            const category = getCategoryConfig(record.category);
            
            return (
              <div
                key={record.id}
                data-index={virtualItem.index}
                className={cn(
                  "absolute top-0 left-0 w-full px-4 py-3",
                  "border-b transition-colors table-row-enter",
                  record.isDuplicate ? "duplicate-row" : "hover:bg-muted/30",
                  // Desktop: grid layout
                  "sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center",
                  // Mobile: card layout
                  "flex flex-col gap-1.5 sm:flex-none"
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {/* Mobile Layout */}
                <div className="flex items-center justify-between sm:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">#{record.rowNumber}</span>
                    <span className="font-mono text-sm font-semibold truncate max-w-[200px]">{record.resi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.isDuplicate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        DUPLIKAT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        OK
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(record.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(record.timestamp)}
                </div>

                {/* Desktop Layout */}
                <div className="tabular hidden sm:block col-span-1 text-sm text-muted-foreground">
                  {record.rowNumber}
                </div>
                <div className="hidden sm:block col-span-4 font-mono text-sm font-semibold truncate">
                  {record.resi}
                </div>
                {showCategory && (
                  <div className="hidden sm:block col-span-2">
                    <span className={cn("category-badge", category.bgClass)}>
                      {category.shortName}
                    </span>
                  </div>
                )}
                <div className={cn(
                  "tabular hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground",
                  showCategory ? "col-span-2" : "col-span-4"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(record.timestamp)}
                </div>
                <div className="hidden sm:block col-span-2">
                  {record.isDuplicate ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-xs font-semibold bg-destructive/10 text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      DUPLIKAT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-xs font-semibold bg-success/10 text-success">
                      <CheckCircle className="w-3.5 h-3.5" />
                      OK
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex col-span-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(record.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Footer — plat penutup gelap */}
      <div className="tabular px-4 py-2 bg-[hsl(var(--ink))] font-display uppercase tracking-wider text-xs font-semibold text-[hsl(var(--ink-foreground))]">
        Total: {records.length} resi
      </div>
    </div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
