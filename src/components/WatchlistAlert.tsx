import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { soundManager } from '@/lib/soundManager';

interface WatchlistAlertProps {
  resi: string;
  onDismiss: () => void;
}

/**
 * Full-screen overlay alert yang muncul saat resi yang discan cocok dengan watchlist.
 * Dirancang agar TIDAK MUNGKIN dilewatkan — merah besar, animasi pulse, blocking overlay.
 * User harus klik "KONFIRMASI" atau tekan Escape untuk menutup.
 */
export function WatchlistAlert({ resi, onDismiss }: WatchlistAlertProps) {
  const [pulseCount, setPulseCount] = useState(0);

  // Pulse animation counter
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((prev) => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // ESC to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleDismiss = () => {
    soundManager.stopSiren();
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center watchlist-alert-overlay"
      onClick={(e) => {
        // Don't dismiss on backdrop click — force user to consciously dismiss
        e.stopPropagation();
      }}
    >
      {/* Animated red backdrop */}
      <div
        className="absolute inset-0 bg-destructive/90 backdrop-blur-sm"
        style={{
          animation: 'watchlist-flash 1s ease-in-out infinite',
        }}
      />

      {/* Alert card */}
      <div
        className="relative z-10 w-[90vw] max-w-lg mx-auto rounded-2xl bg-card border-4 border-destructive shadow-2xl overflow-hidden"
        style={{
          animation: 'watchlist-bounce 0.5s ease-out',
        }}
      >
        {/* Header red strip */}
        <div className="bg-destructive px-6 py-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
            style={{
              animation: pulseCount % 2 === 0 ? 'none' : 'watchlist-icon-pulse 0.5s ease-in-out',
            }}
          >
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-white text-xl sm:text-2xl font-bold uppercase tracking-wider leading-tight">
              PAKET DITEMUKAN!
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-0.5 font-medium">
              Resi ini ada di Watchlist — dicurigai salah
            </p>
          </div>
          <Volume2
            className="w-5 h-5 text-white/60 shrink-0"
            style={{ animation: 'watchlist-speaker 0.3s ease-in-out infinite alternate' }}
          />
        </div>

        {/* Resi number — huge, unmissable */}
        <div className="px-6 py-8 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">
            Nomor Resi
          </p>
          <p
            className="font-mono text-2xl sm:text-4xl font-bold tracking-widest break-all leading-tight"
            style={{
              color: 'hsl(var(--destructive))',
            }}
          >
            {resi}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Pisahkan paket ini dan periksa lebih lanjut.
          </p>
        </div>

        {/* Action */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button
            onClick={handleDismiss}
            className="w-full h-14 text-lg font-display uppercase font-bold tracking-wider gap-3 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg"
            autoFocus
          >
            <X className="w-5 h-5" />
            KONFIRMASI & TUTUP
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">ESC</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">ENTER</kbd> untuk menutup
          </p>
        </div>
      </div>
    </div>
  );
}
