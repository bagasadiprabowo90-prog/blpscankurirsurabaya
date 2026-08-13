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

  return (
    <>
      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <CameraScanner
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
          accentColor={activeCourierInfo?.color}
        />
      )}

      <div className="work-panel p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Plat identitas kurir / status */}
            {lastResult?.isDuplicate ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border-2 border-destructive bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="h-5 w-5 shrink-0 rounded-[3px] border-2 border-[hsl(var(--ink)/0.35)]"
                style={{ backgroundColor: activeCourierInfo?.color || 'hsl(var(--primary))' }}
              />
            )}
            <div className="min-w-0">
              <h2 className="font-display uppercase tracking-wide text-xl font-bold leading-none">
                {activeCourierInfo ? `Scan ${activeCourierInfo.name}` : 'Scan Resi'}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {bulkMode ? 'paste banyak resi sekaligus' : 'scan barcode atau ketik manual'}
              </p>
            </div>
            {/* Indikator antrian & counter — ikon Lucide, tanpa emoji */}
            {(queueLength > 0 || processedCount > 0) && (
              <div className="ml-1 flex shrink-0 items-center gap-1.5 text-xs">
                {queueLength > 0 && (
                  <span className="tabular inline-flex items-center gap-1 rounded-[3px] border border-warning/50 bg-warning/15 px-2 py-1 font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    {queueLength} antrian
                  </span>
                )}
                {processedCount > 0 && (
                  <button
                    onClick={onResetCount}
                    className="tabular inline-flex items-center gap-1 rounded-[3px] border border-success/40 bg-success/10 px-2 py-1 font-bold text-success transition-colors duration-100 hover:bg-success/20 cursor-pointer"
                    title="Klik untuk reset counter"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {processedCount} terscan
                    <X className="h-3 w-3 opacity-60" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCameraScanner(true)}
              className="gap-1.5 h-9 rounded-sm border-[hsl(var(--ink)/0.4)]"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Kamera</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkMode(!bulkMode)}
              className="gap-1.5 h-9 rounded-sm border-[hsl(var(--ink)/0.4)]"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{bulkMode ? 'Satuan' : 'Bulk'}</span>
            </Button>
          </div>
        </div>

        {bulkMode ? (
          <div className="space-y-3">
            <textarea
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Paste nomor resi di sini (pisahkan dengan enter, koma, atau titik koma)..."
              className="w-full h-36 p-3 rounded-sm border-2 border-[hsl(var(--ink)/0.35)] bg-background font-mono text-sm resize-none transition-[border-color,box-shadow] duration-100 focus:outline-none focus:border-[hsl(var(--ink))] focus:ring-2 focus:ring-ring/30"
              disabled={disabled}
            />
            <div className="flex items-center justify-between">
              <span className="tabular text-sm font-medium text-muted-foreground">
                {bulkValue.split(/[\n\r,;]+/).filter(l => l.trim()).length} resi terdeteksi
              </span>
              <Button onClick={handleBulkSubmit} disabled={disabled || !bulkValue.trim()} className="gap-2 rounded-sm">
                <Upload className="w-4 h-4" />
                Proses Semua
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={activeCourierInfo ? `Scan resi ${activeCourierInfo.name}...` : 'Scan atau ketik nomor resi...'}
                className={cn(
                  "scan-input h-14 rounded-sm border-2 pr-12",
                  "border-[hsl(var(--ink)/0.55)] bg-background",
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
                  "absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-[3px]",
                  "flex items-center justify-center transition-colors duration-100",
                  value ? "pulse-scan" : ""
                )}
                style={{ backgroundColor: value ? (activeCourierInfo?.color || 'hsl(var(--primary))') : 'hsl(var(--muted))' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={disabled || !value.trim()} 
              className="h-14 px-6 rounded-sm font-display uppercase tracking-wider text-lg font-bold gap-2"
              style={activeCourierInfo ? { backgroundColor: activeCourierInfo.color } : {}}
            >
              <Scan className="w-5 h-5" />
              Scan
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
