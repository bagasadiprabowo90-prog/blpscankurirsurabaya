import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResiRecord } from '@/lib/db';
import { getCategoryConfig, COURIER_CATEGORIES, CourierCategory } from '@/lib/courierCategories';

interface SearchResiProps {
  records: ResiRecord[];
  onSearchResults: (results: ResiRecord[] | null) => void;
  onJumpToCategory?: (category: CourierCategory) => void;
  activeCategory: CourierCategory;
  searchAllCategories?: boolean;
}

export function SearchResi({
  records,
  onSearchResults,
  onJumpToCategory,
  activeCategory,
  searchAllCategories = false,
}: SearchResiProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchScope, setSearchScope] = useState<'current' | 'all'>(searchAllCategories ? 'all' : 'current');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        onSearchResults(null);
        return;
      }

      const normalizedQuery = searchQuery.trim().toUpperCase();
      const filtered = records.filter((r) => {
        const matchesQuery = r.resi.includes(normalizedQuery);
        if (searchScope === 'current') {
          return matchesQuery && r.category === activeCategory;
        }
        return matchesQuery;
      });

      onSearchResults(filtered);
    },
    [records, activeCategory, searchScope, onSearchResults]
  );

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  const handleClear = () => {
    setQuery('');
    onSearchResults(null);
    inputRef.current?.focus();
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    if (!query) {
      setIsExpanded(false);
      onSearchResults(null);
    }
  };

  // ESC to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setIsExpanded(false);
      onSearchResults(null);
    }
    // Prevent global scan capture from intercepting when search is focused
    e.stopPropagation();
  };

  // Count results by category for the summary
  const resultSummary = query.trim()
    ? (() => {
        const normalizedQuery = query.trim().toUpperCase();
        const results: { category: CourierCategory; count: number; total: number }[] = [];
        for (const cat of COURIER_CATEGORIES) {
          const catRecords = records.filter((r) => r.category === cat.id);
          const matches = catRecords.filter((r) => r.resi.includes(normalizedQuery));
          if (matches.length > 0) {
            results.push({ category: cat.id, count: matches.length, total: catRecords.length });
          }
        }
        return results;
      })()
    : [];

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[hsl(var(--ink)/0.2)] bg-background/60 text-muted-foreground text-sm hover:bg-muted hover:text-foreground transition-colors"
        title="Cari resi (Ctrl+F)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs font-medium">Cari</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="search-resi-container flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onBlur={handleCollapse}
            placeholder="Cari nomor resi..."
            className="h-8 pl-8 pr-8 rounded-lg border-[hsl(var(--ink)/0.3)] bg-background font-mono text-sm tracking-wider uppercase focus:border-[hsl(var(--ink))] focus:ring-1 focus:ring-ring/30"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Scope toggle */}
        <div className="flex items-center rounded-lg border border-[hsl(var(--ink)/0.2)] overflow-hidden text-xs shrink-0">
          <button
            onClick={() => setSearchScope('current')}
            className={cn(
              'px-2 py-1.5 font-medium transition-colors',
              searchScope === 'current'
                ? 'bg-[hsl(var(--ink))] text-[hsl(var(--ink-foreground))]'
                : 'bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            Tab Ini
          </button>
          <button
            onClick={() => setSearchScope('all')}
            className={cn(
              'px-2 py-1.5 font-medium transition-colors',
              searchScope === 'all'
                ? 'bg-[hsl(var(--ink))] text-[hsl(var(--ink-foreground))]'
                : 'bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Result summary per category */}
      {query.trim() && resultSummary.length > 0 && searchScope === 'all' && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          <span className="text-muted-foreground font-medium">Ditemukan di:</span>
          {resultSummary.map(({ category, count }) => {
            const config = getCategoryConfig(category);
            const isCurrentTab = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => onJumpToCategory?.(category)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors',
                  isCurrentTab
                    ? 'bg-[hsl(var(--ink))] text-[hsl(var(--ink-foreground))]'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                {config.shortName}
                <span className="tabular font-bold">{count}</span>
                {!isCurrentTab && <ArrowRight className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </div>
      )}

      {query.trim() && resultSummary.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">
          Tidak ditemukan resi yang cocok dengan "{query}"
        </p>
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
      <mark className="bg-warning/40 text-foreground rounded-sm px-0.5 font-bold">{match}</mark>
      {after}
    </>
  );
}
