import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ArrowRight, Trash2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResiRecord } from '@/lib/db';
import { getCategoryConfig, COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';

interface SearchResiProps {
  records: ResiRecord[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchScope: 'current' | 'all';
  onScopeChange: (scope: 'current' | 'all') => void;
  activeCategory: CourierCategory;
  onJumpToCategory?: (category: CourierCategory) => void;
  onDeleteSingle?: (id: string) => void;
}

export function SearchResi({
  records,
  searchQuery,
  onSearchChange,
  searchScope,
  onScopeChange,
  activeCategory,
  onJumpToCategory,
  onDeleteSingle,
}: SearchResiProps) {
  // Local input state allows typing before committing, or immediate live search
  const [localInput, setLocalInput] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external searchQuery changes
  useEffect(() => {
    setLocalInput(searchQuery);
  }, [searchQuery]);

  // Execute search
  const triggerSearch = useCallback((value: string) => {
    onSearchChange(value.trim().toUpperCase());
  }, [onSearchChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setLocalInput(val);
    // Live search as user types for fast responsive experience
    onSearchChange(val.trim());
  };

  const handleSearchButtonClick = () => {
    triggerSearch(localInput);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setLocalInput('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  // Keyboard navigation & shortcut
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch(localInput);
    } else if (e.key === 'Escape') {
      handleClear();
    }
    // Prevent global barcode scanner capture from intercepting typing
    e.stopPropagation();
  };

  // Global Ctrl+F / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Filtered matches calculation
  const activeQuery = searchQuery.trim().toUpperCase();
  const matchedRecords = useMemo(() => {
    if (!activeQuery) return [];
    return records.filter((r) => {
      const match = r.resi.toUpperCase().includes(activeQuery);
      if (searchScope === 'current') {
        return match && r.category === activeCategory;
      }
      return match;
    });
  }, [records, activeQuery, searchScope, activeCategory]);

  // Matches across all categories for summary / jump
  const crossCategoryMatches = useMemo(() => {
    if (!activeQuery) return [];
    const results: { category: CourierCategory; count: number; firstRecord: ResiRecord }[] = [];
    for (const cat of COURIER_CATEGORIES) {
      const catRecords = records.filter((r) => r.category === cat.id);
      const matches = catRecords.filter((r) => r.resi.toUpperCase().includes(activeQuery));
      if (matches.length > 0) {
        results.push({ category: cat.id, count: matches.length, firstRecord: matches[0] });
      }
    }
    return results;
  }, [records, activeQuery]);

  const totalMatchesAcrossAll = crossCategoryMatches.reduce((acc, curr) => acc + curr.count, 0);
  const activeConfig = getCategoryConfig(activeCategory);

  // Single exact match found (great for quick delete)
  const singleMatch = matchedRecords.length === 1 ? matchedRecords[0] : null;

  return (
    <div className="bg-card border rounded-lg p-2.5 sm:p-3 shadow-xs space-y-2">
      {/* Search Bar Input & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Cari 1 resi untuk dihapus / dicek... (Ctrl+F)"
            className="h-9 pl-8 pr-8 rounded-md font-mono text-sm uppercase tracking-wider bg-background border-input focus-visible:ring-1"
            autoComplete="off"
            spellCheck={false}
          />
          {localInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Bersihkan pencarian (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons: Tombol Cari & Scope */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tombol CARI Utama */}
          <Button
            type="button"
            onClick={handleSearchButtonClick}
            size="sm"
            className="h-9 px-3.5 gap-1.5 font-medium shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari</span>
          </Button>

          {/* Scope Toggle: Tab Ini vs Semua Tab */}
          <div className="inline-flex rounded-md border border-input p-0.5 bg-muted/40 text-xs shrink-0">
            <button
              type="button"
              onClick={() => onScopeChange('current')}
              className={cn(
                'px-2.5 py-1 rounded-sm font-medium transition-all text-xs',
                searchScope === 'current'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={`Hanya cari di tab ${activeConfig.name}`}
            >
              Tab {activeConfig.shortName}
            </button>
            <button
              type="button"
              onClick={() => onScopeChange('all')}
              className={cn(
                'px-2.5 py-1 rounded-sm font-medium transition-all text-xs',
                searchScope === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Cari di semua kategori kurir"
            >
              Semua Tab
            </button>
          </div>

          {activeQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Reset pencarian"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Feedback & Results Banner */}
      {activeQuery && (
        <div className="pt-1 border-t text-xs flex flex-wrap items-center justify-between gap-2">
          {/* Status info */}
          <div className="flex items-center gap-2 flex-wrap">
            {matchedRecords.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ditemukan <strong className="font-mono text-primary font-bold">{matchedRecords.length}</strong> resi
                {searchScope === 'current' ? ` di tab ${activeConfig.shortName}` : ' di semua tab'}:
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Tidak ditemukan resi yang cocok dengan "{activeQuery}" di tab {activeConfig.shortName}.
              </span>
            )}

            {/* If 0 in current tab but found in other tabs */}
            {searchScope === 'current' && matchedRecords.length === 0 && totalMatchesAcrossAll > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onScopeChange('all')}
                className="h-6 px-2 text-[11px] gap-1 text-primary border-primary/40 hover:bg-primary/10"
              >
                Cari di Semua Tab ({totalMatchesAcrossAll} ditemukan)
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}

            {/* Jump to specific tab badges if matches across categories */}
            {searchScope === 'all' && crossCategoryMatches.length > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-muted-foreground text-[11px]">Kategori:</span>
                {crossCategoryMatches.map(({ category, count }) => {
                  const config = getCategoryConfig(category);
                  const isCurrent = category === activeCategory;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => onJumpToCategory?.(category)}
                      className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors border',
                        isCurrent
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/60 hover:bg-muted text-foreground border-border'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                      {config.shortName} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick 1-Click Delete Button when exactly 1 match found! */}
          {singleMatch && onDeleteSingle && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-muted-foreground text-[11px] hidden sm:inline">
                Mau hapus resi ini?
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDeleteSingle(singleMatch.id)}
                className="h-7 px-2.5 text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Resi Ini
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Utility: Highlight substring match dalam nomor resi.
 */
export function HighlightedResi({ resi, query }: { resi: string; query: string }) {
  if (!query.trim()) return <>{resi}</>;

  const normalizedQuery = query.trim().toUpperCase();
  const index = resi.toUpperCase().indexOf(normalizedQuery);

  if (index === -1) return <>{resi}</>;

  const before = resi.slice(0, index);
  const match = resi.slice(index, index + normalizedQuery.length);
  const after = resi.slice(index + normalizedQuery.length);

  return (
    <>
      {before}
      <mark className="bg-amber-300 dark:bg-amber-500/40 text-foreground rounded-xs px-0.5 font-bold">
        {match}
      </mark>
      {after}
    </>
  );
}
