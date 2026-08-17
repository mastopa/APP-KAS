import React from 'react';
import {
  Wallet,
  LogOut,
  Moon,
  Sun,
  Smartphone,
  Wifi,
  WifiOff,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';
import { Admin, ActiveTab } from '../types';

interface NavbarProps {
  currentAdmin: Admin | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  isOnline: boolean;
  onToggleSimulatedOffline?: () => void;
  isSimulatedOffline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAdmin,
  onOpenLoginModal,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  onSelectTab,
  isOnline,
  onToggleSimulatedOffline,
  isSimulatedOffline = false
}) => {
  return (
    <header
      id="main-navbar"
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
              <img src="https://res.cloudinary.com/unv48/image/upload/v1786763340/logo1_nj3krq.jpg" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                  Kas Remaja
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Sistem Keuangan & Iuran Pemuda
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Realtime Auto-Sync Indicator */}
            <div
              id="auto-sync-status-indicator"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
              title="Aksi GET, POST, PUT, DELETE tersinkronisasi otomatis tanpa aksi manual"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              <span>Auto-Sync Realtime</span>
            </div>

            {/* Network Indicator */}
            {onToggleSimulatedOffline ? (
              <button
                id="toggle-network-status-btn"
                onClick={onToggleSimulatedOffline}
                title={isOnline ? 'Jaringan Online' : 'Jaringan Offline'}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isOnline
                    ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                    <span className="hidden md:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 animate-pulse" />
                    <span>Offline</span>
                  </>
                )}
              </button>
            ) : (
              <div
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
                  isOnline
                    ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                    <span className="hidden md:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 animate-pulse" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            )}

            {/* Android API Quick Link */}
            <button
              id="open-android-docs-nav-btn"
              onClick={() => onSelectTab('android')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Dokumentasi & API Android"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Android API</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Ganti Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Badge & Actions */}
            {currentAdmin ? (
              <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                    {currentAdmin.nama_lengkap || currentAdmin.username}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentAdmin.role || 'Pengurus'}
                  </p>
                </div>

                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-rose-900/40 border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="Keluar dari sesi admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
