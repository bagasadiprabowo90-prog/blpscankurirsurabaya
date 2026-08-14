import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan, Upload, AlertTriangle, Camera, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourierCategory, COURIER_CATEGORIES } from '@/lib/courierCategories';
import { CameraScanner } from './CameraScanner';

// Global flag to prevent double-scanning when input is focused
let inputFocused = false;
export const isInputFocused = () => inputFocused;

interface ScanInputProps {
  onScan: (resi: string) => void;
  onBulkUpload: (resiList: string[]) => void;
  disabled?: boolean;
  lastResult?: { success: boolean; isDuplicate: boolean } | null;
  activeCategory?: CourierCategory;
  queueLength?: number;
  processedCount?: number;
  onResetCount?: () => void;
}

export function ScanInput({ onScan, onBulkUpload, disabled, lastResult, activeCategory, queueLength = 0, processedCount = 0, onResetCount }: ScanInputProps) {
  const [value, setValue] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkValue, setBulkValue] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);

  const activeCourierInfo = activeCategory 
    ? COURIER_CATEGORIES.find(c => c.id === activeCategory) 
    : null;

  useEffect(() => {
    if (lastResult?.isDuplicate) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [lastResult]);

  useEffect(() => {
    // Auto-focus input for barcode scanner
    inputRef.current?.focus();
    inputFocused = true;
    
    return () => {
      inputFocused = false;
    };
  }, []);

  const handleFocus = useCallback(() => {
    inputFocused = true;
  }, []);

  const handleBlur = useCallback(() => {
    inputFocused = false;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentValue = inputRef.current?.value || value;
    if (!currentValue.trim()) return;
    onScan(currentValue.trim().toUpperCase());
    setValue('');
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.focus();
  };

  const handleBulkSubmit = () => {
    const lines = bulkValue
      .split(/[\n\r,;]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length > 0) {
      onBulkUpload(lines);
      setBulkValue('');
      setBulkMode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleCameraScan = (code: string) => {
    onScan(code);
    // Don't close scanner - allow continuous scanning
  };

  const accentColor = activeCourierInfo?.color || 'hsl(var(--primary))';

  return (
    <>
      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <CameraScanner
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
          accentColor={accentColor}
        />
      )}

      <div className="work-panel overflow-hidden">
        {/* ── HEADER SECTION ── judul + subtitle + counter */}
        <div
          className="px-4 pt-4 pb-3 border-b-2 border-[hsl(var(--ink)/0.08)]"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)` }}
        >
          <div className="flex items-center gap-2.5">
            {/* Status indicator */}
            {lastResult?.isDuplicate ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-xl border-2 border-[hsl(var(--ink)/0.2)]"
                style={{ backgroundColor: accentColor }}
              />
            )}

            {/* Judul + subtitle */}
            <div className="min-w-0 flex-1">
              <h2 className="font-display uppercase text-base font-bold leading-none">
                {activeCourierInfo ? `Scan ${activeCourierInfo.name}` : 'Scan Resi'}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground leading-none">
                {bulkMode ? 'paste banyak resi sekaligus' : 'scan barcode atau ketik manual'}
              </p>
            </div>

            {/* Counter antrian & terscan */}
            {(queueLength > 0 || processedCount > 0) && (
              <div className="flex items-center gap-1.5 text-xs shrink-0">
                {queueLength > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-warning/50 bg-warning/15 px-2 py-1 font-bold tabular-nums">
                    <Clock className="h-3 w-3" />
                    {queueLength}
                  </span>
                )}
                {processedCount > 0 && (
                  <button
                    onClick={onResetCount}
                    className="inline-flex items-center gap-1 rounded-lg border border-success/40 bg-success/10 px-2 py-1 font-bold text-success transition-colors duration-100 hover:bg-success/20 cursor-pointer tabular-nums"
                    title="Klik untuk reset counter"
                  >
                    <Check className="h-3 w-3" />
                    {processedCount}
                    <X className="h-3 w-3 opacity-50" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── INPUT SECTION ── tombol utilitas + input + scan */}
        <div className="px-4 pb-4 pt-3.5">
          {bulkMode ? (
            <div className="space-y-3">
              <textarea
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Paste nomor resi di sini (pisahkan dengan enter, koma, atau titik koma)..."
                className="w-full h-36 p-3 rounded-xl border-2 border-[hsl(var(--ink)/0.35)] bg-background font-mono text-sm resize-none transition-[border-color,box-shadow] duration-100 focus:outline-none focus:border-[hsl(var(--ink))] focus:ring-2 focus:ring-ring/30"
                disabled={disabled}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {bulkValue.split(/[\n\r,;]+/).filter(l => l.trim()).length} resi terdeteksi
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBulkMode(false)} className="rounded-xl border-[hsl(var(--ink)/0.4)]">
                    Batal
                  </Button>
                  <Button onClick={handleBulkSubmit} disabled={disabled || !bulkValue.trim()} className="gap-2 rounded-xl">
                    <Upload className="w-4 h-4" />
                    Proses Semua
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Tombol utilitas — baris sendiri */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCameraScanner(true)}
                  className="flex-1 gap-1.5 h-9 rounded-xl border-[hsl(var(--ink)/0.4)] font-medium"
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMode(true)}
                  className="flex-1 gap-1.5 h-9 rounded-xl border-[hsl(var(--ink)/0.4)] font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </Button>
              </div>

              {/* Input resi + tombol scan */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={activeCourierInfo ? `Nomor resi ${activeCourierInfo.name}...` : 'Scan atau ketik nomor resi...'}
                    className={cn(
                      "scan-input h-12 rounded-xl border-2 pr-12",
                      "border-[hsl(var(--ink)/0.45)] bg-background",
                      "transition-[border-color,box-shadow] duration-100",
                      "focus:scan-glow focus:border-[hsl(var(--ink))] focus:ring-0",
                      shake && "shake border-destructive",
                      lastResult?.success && !lastResult.isDuplicate && "border-success"
                    )}
                    disabled={disabled}
                    autoComplete="off"
                    autoFocus
                  />
                  <div
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg",
                      "flex items-center justify-center transition-colors duration-100",
                      value ? "pulse-scan" : ""
                    )}
                    style={{ backgroundColor: value ? accentColor : 'hsl(var(--muted))' }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={disabled || !value.trim()}
                  className="h-12 px-5 rounded-xl font-display uppercase text-base font-bold gap-2 shrink-0"
                  style={activeCourierInfo ? { backgroundColor: activeCourierInfo.color } : {}}
                >
                  <Scan className="w-4 h-4" />
                  Scan
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


