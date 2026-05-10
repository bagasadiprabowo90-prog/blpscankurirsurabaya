import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan, Upload, AlertTriangle, Camera } from 'lucide-react';
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
    if (!value.trim()) return;
    onScan(value.trim());
    setValue('');
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

      <div 
        className="bg-card rounded-xl border shadow-sm p-4 sm:p-5"
        style={activeCourierInfo ? { borderColor: activeCourierInfo.color, borderWidth: 2 } : {}}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                lastResult?.isDuplicate && "bg-destructive/10"
              )}
              style={{ backgroundColor: activeCourierInfo ? `${activeCourierInfo.color}20` : 'hsl(var(--primary) / 0.1)' }}
            >
              {lastResult?.isDuplicate ? (
                <AlertTriangle className="w-6 h-6 text-destructive" />
              ) : (
                <Scan className="w-6 h-6" style={{ color: activeCourierInfo?.color || 'hsl(var(--primary))' }} />
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {activeCourierInfo ? `Scan ${activeCourierInfo.name}` : 'Scan Resi'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {bulkMode ? 'Paste banyak resi sekaligus' : 'Scan barcode atau ketik manual'}
              </p>
            </div>
            {/* Queue indicator */}
            {(queueLength > 0 || processedCount > 0) && (
              <div className="ml-2 flex items-center gap-2 text-xs">
                {queueLength > 0 && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-600 rounded-full animate-pulse">
                    ⏳ {queueLength} antrian
                  </span>
                )}
                {processedCount > 0 && (
                  <button
                    onClick={onResetCount}
                    className="px-2 py-1 bg-green-500/20 text-green-600 rounded-full hover:bg-green-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    title="Klik untuk reset counter"
                  >
                    ✓ {processedCount} terscan
                    <span className="text-[10px] opacity-60">✕</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCameraScanner(true)}
              className="gap-1.5 h-9"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Kamera</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkMode(!bulkMode)}
              className="gap-1.5 h-9"
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
              className="w-full h-36 p-3 rounded-lg border bg-background font-mono text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={disabled}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {bulkValue.split(/[\n\r,;]+/).filter(l => l.trim()).length} resi terdeteksi
              </span>
              <Button onClick={handleBulkSubmit} disabled={disabled || !bulkValue.trim()} className="gap-2">
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
                  "scan-input h-14 pr-12 transition-all text-base",
                  "focus:scan-glow focus:ring-2 focus:ring-primary",
                  shake && "shake border-destructive",
                  lastResult?.success && !lastResult.isDuplicate && "border-success"
                )}
                disabled={disabled}
                autoComplete="off"
                autoFocus
              />
              <div 
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full",
                  "flex items-center justify-center transition-colors",
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
              className="h-14 px-6 text-base font-semibold gap-2"
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
