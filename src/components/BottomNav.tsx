import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Layers,
  Users,
  FileSpreadsheet,
  Settings,
  Smartphone,
  MoreHorizontal,
  X,
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab, Admin } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
  adminUser: Admin | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isOnline: boolean;
  onSyncSheets?: () => void;
  isSyncing?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  adminUser,
  onOpenLogin,
  onLogout,
  isDarkMode,
  onToggleTheme,
  isOnline,
  onSyncSheets,
  isSyncing = false
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Beranda',
      icon: LayoutDashboard
    },
    {
      id: 'kas' as ActiveTab,
      label: 'Kas RT',
      icon: Wallet
    },
    {
      id: 'kategori' as ActiveTab,
      label: 'Iuran Lain',
      icon: Layers
    },
    {
      id: 'anggota' as ActiveTab,
      label: 'Anggota',
      icon: Users
    }
  ];

  const handleTabClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
  };

  const isMoreActive = activeTab === 'rekap' || activeTab === 'pengaturan' || activeTab === 'android';

  return (
    <>
      {/* More Options Bottom Sheet Modal */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          {/* Sheet Body */}
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Menu & Fitur Lainnya
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akses cepat laporan dan pengaturan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="bottom-sheet-rekap-btn"
                onClick={() => handleTabClick('rekap')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all ${
                  activeTab === 'rekap'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950/80 text-slate-700 dark:text-slate-300 mb-2">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs">Rekap & Laporan</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Export PDF & Excel
                </span>
              </button>

              <button
                id="bottom-sheet-pengaturan-btn"
                onClick={() => handleTabClick('pengaturan')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all ${
                  activeTab === 'pengaturan'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 mb-2">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs">Pengaturan RT</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sheets & Akun Admin
                </span>
              </button>

              <button
                id="bottom-sheet-android-btn"
                onClick={() => handleTabClick('android')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all ${
                  activeTab === 'android'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-amber-950/80 text-slate-700 dark:text-slate-300 mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs">App Android</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Panduan API Mobile
                </span>
              </button>

              <button
                id="bottom-sheet-theme-btn"
                onClick={onToggleTheme}
                className="flex flex-col items-start p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all"
              >
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mb-2">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </div>
                <span className="font-bold text-xs">Ganti Tema</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                </span>
              </button>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              {onSyncSheets && (
                <button
                  id="bottom-sheet-sync-sheets-btn"
                  onClick={() => {
                    onSyncSheets();
                    setIsMoreMenuOpen(false);
                  }}
                  disabled={isSyncing || !isOnline}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-600 dark:text-slate-400'}`} />
                  <span>Sync Google Sheets</span>
                </button>
              )}

              {isAdmin ? (
                <button
                  id="bottom-sheet-logout-btn"
                  onClick={() => {
                    onLogout();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  id="bottom-sheet-login-btn"
                  onClick={() => {
                    onOpenLogin();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login Pengurus</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden safe-area-pb"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1 max-w-lg mx-auto">
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`bottom-nav-item-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className="relative flex flex-col items-center justify-center h-full py-1 group active:scale-95 transition-transform"
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                )}

                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`text-[10px] font-medium tracking-tight truncate max-w-full px-1 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: Menu & Rekap */}
          <button
            id="bottom-nav-item-more"
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className="relative flex flex-col items-center justify-center h-full py-1 group active:scale-95 transition-transform"
          >
            {isMoreActive && (
              <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
            )}

            <div
              className={`p-1.5 rounded-xl transition-colors ${
                isMoreActive || isMoreMenuOpen
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>

            <span
              className={`text-[10px] font-medium tracking-tight truncate max-w-full px-1 ${
                isMoreActive || isMoreMenuOpen
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Menu
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
