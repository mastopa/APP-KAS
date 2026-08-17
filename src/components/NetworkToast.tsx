import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkToastProps {
  isSimulatedOffline?: boolean;
  onToggleSimulatedOffline?: () => void;
}

export const NetworkToast: React.FC<NetworkToastProps> = ({
  isSimulatedOffline = false,
  onToggleSimulatedOffline
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine && !isSimulatedOffline);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'offline' | 'online'>('online');

  useEffect(() => {
    const handleOnline = () => {
      if (!isSimulatedOffline) {
        setIsOnline(true);
        setToastType('online');
        setToastMessage('Koneksi terhubung kembali.');
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 3500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastType('offline');
      setToastMessage('Koneksi terputus. Aplikasi membutuhkan internet.');
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Handle simulated offline toggle
  useEffect(() => {
    if (isSimulatedOffline) {
      setIsOnline(false);
      setToastType('offline');
      setToastMessage('Koneksi terputus. Aplikasi membutuhkan internet. (Mode Simulasi Offline)');
      setShowToast(true);
    } else {
      setIsOnline(navigator.onLine);
      if (!isOnline && navigator.onLine) {
        setToastType('online');
        setToastMessage('Koneksi terhubung kembali.');
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [isSimulatedOffline]);

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div
            id="network-toast-container"
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 sm:w-auto shadow-xl rounded-xl overflow-hidden pointer-events-auto"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 border ${
                toastType === 'offline'
                  ? 'bg-rose-900/95 text-rose-50 border-rose-700 shadow-rose-950/40'
                  : 'bg-emerald-900/95 text-emerald-50 border-emerald-700 shadow-emerald-950/40'
              }`}
            >
              {toastType === 'offline' ? (
                <div className="p-2 bg-rose-800 rounded-lg flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-rose-200 animate-pulse" />
                </div>
              ) : (
                <div className="p-2 bg-emerald-800 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">{toastMessage}</p>
                {toastType === 'offline' && (
                  <p className="text-xs text-rose-200/80 mt-0.5">
                    Fitur input & mutasi data dinonaktifkan sementara hingga terhubung.
                  </p>
                )}
              </div>
              <button
                id="close-network-toast-btn"
                onClick={() => setShowToast(false)}
                className="text-xs opacity-70 hover:opacity-100 px-2 py-1 bg-black/20 rounded transition-opacity"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Offline Banner when offline */}
      {!isOnline && (
        <div
          id="offline-sticky-banner"
          className="bg-slate-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          <span>Status Jaringan: <strong>Offline</strong>. Menggunakan cache lokal readonly.</span>
          {onToggleSimulatedOffline && isSimulatedOffline && (
            <button
              onClick={onToggleSimulatedOffline}
              className="underline font-bold hover:text-slate-700 dark:hover:text-amber-100 ml-2"
            >
              Kembalikan ke Online
            </button>
          )}
        </div>
      )}
    </>
  );
};
