import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { X, Camera, SwitchCamera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  accentColor?: string;
}

export function CameraScanner({ onScan, onClose, accentColor }: CameraScannerProps) {
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async (deviceId?: string) => {
    setIsStarting(true);
    setError(null);

    try {
      stopScanner();

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
      ]);

      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);

      // Prefer back camera
      let selectedDeviceId = deviceId;
      if (!selectedDeviceId && videoDevices.length > 0) {
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        selectedDeviceId = backCamera?.deviceId || videoDevices[0].deviceId;
        setCurrentCameraIndex(videoDevices.findIndex(d => d.deviceId === selectedDeviceId) || 0);
      }

      if (!videoRef.current) return;

      await reader.decodeFromVideoDevice(
        selectedDeviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const now = Date.now();
            const text = result.getText();
            
            // Prevent duplicate scans within 2 seconds
            if (text === lastScannedRef.current && now - lastScannedTimeRef.current < 2000) {
              return;
            }
            
            lastScannedRef.current = text;
            lastScannedTimeRef.current = now;
            
            // Vibrate for feedback if available
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            
            onScan(text.toUpperCase());
          }
        }
      );

      setIsStarting(false);
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsStarting(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setError('Izinkan akses kamera di browser Anda untuk menggunakan fitur ini.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setError('Gagal mengakses kamera. Pastikan browser mendukung kamera.');
      }
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(cameras[nextIndex].deviceId);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Scan Barcode
        </h2>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwitchCamera}
              className="text-white hover:bg-white/20"
              disabled={isStarting}
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Memulai kamera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-4 bg-black">
            <div className="bg-destructive/90 text-destructive-foreground rounded-lg p-6 max-w-sm text-center">
              <p className="font-medium mb-4">{error}</p>
              <Button onClick={handleClose} variant="secondary">
                Tutup
              </Button>
            </div>
          </div>
        )}

        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan Frame Overlay */}
        {!isStarting && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened edges */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Clear scanning area */}
            <div 
              className="relative w-72 h-28 rounded-lg overflow-hidden"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
            >
              {/* Border */}
              <div 
                className="absolute inset-0 border-2 rounded-lg"
                style={{ borderColor: accentColor || 'hsl(var(--primary))' }}
              />
              
              {/* Corner accents */}
              <div 
                className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg"
                style={{ borderColor: accentColor || 'hsl(var(--primary))' }}
              />
              <div 
                className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg"
                style={{ borderColor: accentColor || 'hsl(var(--primary))' }}
              />
              <div 
                className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg"
                style={{ borderColor: accentColor || 'hsl(var(--primary))' }}
              />
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg"
                style={{ borderColor: accentColor || 'hsl(var(--primary))' }}
              />
              
              {/* Scanning line animation */}
              <div 
                className="absolute left-4 right-4 h-0.5 animate-scan-line"
                style={{ backgroundColor: accentColor || 'hsl(var(--primary))' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black/80 backdrop-blur-sm text-center">
        <p className="text-white/90 text-sm">
          Arahkan kamera ke barcode resi
        </p>
        <p className="text-white/60 text-xs mt-1">
          Scan otomatis saat barcode terdeteksi
        </p>
      </div>
    </div>
  );
}
