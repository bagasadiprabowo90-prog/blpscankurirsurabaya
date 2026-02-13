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
    estimateSize: () => 48,
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

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Belum ada data</p>
        <p className="text-sm">Mulai scan resi untuk menampilkan data</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
        <div className="col-span-1">No</div>
        <div className="col-span-4">Nomor Resi</div>
        {showCategory && <div className="col-span-2">Kategori</div>}
        <div className={cn(showCategory ? "col-span-2" : "col-span-4")}>Waktu</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 text-right">Aksi</div>
      </div>

      {/* Virtual List */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: Math.min(500, sortedRecords.length * 48 + 20) }}
      >
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
                  "absolute top-0 left-0 w-full grid grid-cols-12 gap-2 px-4 py-3 items-center",
                  "border-b hover:bg-muted/30 transition-colors table-row-enter",
                  record.isDuplicate && "duplicate-row"
                )}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="col-span-1 text-sm text-muted-foreground">
                  {record.rowNumber}
                </div>
                <div className="col-span-4 font-mono text-sm font-medium truncate">
                  {record.resi}
                </div>
                {showCategory && (
                  <div className="col-span-2">
                    <span className={cn("category-badge", category.bgClass)}>
                      {category.shortName}
                    </span>
                  </div>
                )}
                <div className={cn(
                  "flex items-center gap-1.5 text-sm text-muted-foreground",
                  showCategory ? "col-span-2" : "col-span-4"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(record.timestamp)}
                </div>
                <div className="col-span-2">
                  {record.isDuplicate ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      DUPLIKAT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle className="w-3.5 h-3.5" />
                      OK
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-right">
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
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-muted/30 border-t text-sm text-muted-foreground">
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
