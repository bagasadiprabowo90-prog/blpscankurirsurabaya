import React, { useState, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Trash2, Upload, X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface WatchlistItem {
  resi: string;
  addedAt: number;
  found: boolean;       // true saat resi ditemukan selama scan
  foundAt?: number;     // timestamp saat ditemukan
}

interface WatchlistPanelProps {
  watchlist: WatchlistItem[];
  onAddToWatchlist: (resiList: string[]) => void;
  onRemoveFromWatchlist: (resi: string) => void;
  onClearWatchlist: () => void;
  onToggleWatchlist: () => void;
  isActive: boolean;    // watchlist mode aktif/mati
}

const WATCHLIST_STORAGE_KEY = 'blp-scan-watchlist';
const WATCHLIST_ACTIVE_KEY = 'blp-scan-watchlist-active';

/**
 * Load watchlist from localStorage.
 */
export function loadWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save watchlist to localStorage.
 */
export function saveWatchlist(items: WatchlistItem[]): void {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Load watchlist active state.
 */
export function loadWatchlistActive(): boolean {
  return localStorage.getItem(WATCHLIST_ACTIVE_KEY) === 'true';
}

/**
 * Save watchlist active state.
 */
export function saveWatchlistActive(active: boolean): void {
  localStorage.setItem(WATCHLIST_ACTIVE_KEY, active ? 'true' : 'false');
}

/**
 * Check if a resi is in the watchlist. Returns the matching item or null.
 */
export function checkWatchlist(resi: string, watchlist: WatchlistItem[]): WatchlistItem | null {
  const normalized = resi.trim().toUpperCase();
  return watchlist.find((item) => item.resi === normalized) || null;
}

export function WatchlistPanel({
  watchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onClearWatchlist,
  onToggleWatchlist,
  isActive,
}: WatchlistPanelProps) {
  const [bulkInput, setBulkInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleBulkAdd = useCallback(() => {
    const lines = bulkInput
      .split(/[\n\r,;]+/)
      .map((line) => line.trim().toUpperCase())
      .filter((line) => line.length > 0);

    if (lines.length > 0) {
      onAddToWatchlist(lines);
      setBulkInput('');
      setShowInput(false);
    }
  }, [bulkInput, onAddToWatchlist]);

  const foundCount = useMemo(() => watchlist.filter((item) => item.found).length, [watchlist]);
  const pendingCount = watchlist.length - foundCount;

  return (
    <div
      className={cn(
        'work-panel overflow-hidden transition-all',
        isActive && 'ring-2 ring-destructive/50'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2.5 px-4 py-3 border-b-2',
          isActive
            ? 'bg-destructive/8 border-destructive/20'
            : 'border-[hsl(var(--ink)/0.08)]'
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2',
            isActive
              ? 'border-destructive bg-destructive/15'
              : 'border-[hsl(var(--ink)/0.2)] bg-muted'
          )}
        >
          <ShieldAlert
            className={cn(
              'h-4 w-4',
              isActive ? 'text-destructive' : 'text-muted-foreground'
            )}
          />
        </span>

        <div className="flex-1 min-w-0">
          <h2 className="font-display uppercase text-sm font-bold leading-none truncate flex items-center gap-2">
            Watchlist
            {watchlist.length > 0 && (
              <span className="tabular text-xs font-mono font-normal text-muted-foreground">
                {foundCount}/{watchlist.length}
              </span>
            )}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground leading-none">
            {isActive ? 'mode aktif — scanning akan dicocokkan' : 'klik untuk mengaktifkan'}
          </p>
        </div>

        {/* Toggle On/Off */}
        <button
          onClick={onToggleWatchlist}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
            isActive
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          {isActive ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              ON
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              OFF
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Add resi button or input */}
        {showInput ? (
          <div className="space-y-2">
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Paste resi yang dicurigai salah di sini...&#10;(pisahkan dengan enter, koma, atau titik koma)"
              className="w-full h-24 p-2.5 rounded-lg border-2 border-destructive/30 bg-background font-mono text-xs resize-none transition-[border-color,box-shadow] focus:outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tabular-nums font-medium">
                {bulkInput.split(/[\n\r,;]+/).filter((l) => l.trim()).length} resi
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowInput(false);
                    setBulkInput('');
                  }}
                  className="h-7 text-xs rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkAdd}
                  disabled={!bulkInput.trim()}
                  className="h-7 text-xs rounded-lg gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Upload className="w-3 h-3" />
                  Tambahkan
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInput(true)}
            className="w-full h-8 text-xs gap-1.5 rounded-lg border-dashed border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            <Upload className="w-3.5 h-3.5" />
            Tambah Resi ke Watchlist
          </Button>
        )}

        {/* Watchlist items */}
        {watchlist.length > 0 && (
          <div className="space-y-1">
            {/* Summary badges */}
            <div className="flex items-center gap-2 mb-2">
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-warning/15 text-warning border border-warning/30">
                  <AlertTriangle className="w-3 h-3" />
                  {pendingCount} belum ditemukan
                </span>
              )}
              {foundCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/30">
                  <ShieldAlert className="w-3 h-3" />
                  {foundCount} DITEMUKAN!
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-[140px] overflow-y-auto space-y-0.5 pr-1">
              {watchlist.map((item) => (
                <div
                  key={item.resi}
                  className={cn(
                    'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors',
                    item.found
                      ? 'bg-destructive/10 border border-destructive/30 watchlist-found-pulse'
                      : 'bg-muted/50 border border-transparent hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.found ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-destructive shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                      </span>
                    )}
                    <span
                      className={cn(
                        'font-mono truncate',
                        item.found ? 'font-bold text-destructive' : 'text-foreground'
                      )}
                    >
                      {item.resi}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.found && (
                      <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">
                        FOUND
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveFromWatchlist(item.resi)}
                      className="p-0.5 rounded hover:bg-destructive/10"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear all */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearWatchlist}
              className="w-full h-7 text-[10px] text-muted-foreground hover:text-destructive gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Hapus Semua Watchlist
            </Button>
          </div>
        )}

        {/* Empty state */}
        {watchlist.length === 0 && !showInput && (
          <p className="text-[11px] text-muted-foreground text-center py-2 leading-relaxed">
            Paste resi yang dicurigai salah ke sini.
            <br />
            Saat scan, jika ada yang cocok akan muncul <strong>alarm siren</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
