import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Layers,
  Users,
  FileSpreadsheet,
  Settings,
  Smartphone,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { ActiveTab, Admin } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unpaidCount?: number;
  totalAnggota?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unpaidCount = 0,
  totalAnggota = 0
}) => {
  const menuItems: Array<{
    key: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      key: 'kas',
      label: 'Kas Utama RT 04',
      icon: Wallet,
      badge: unpaidCount > 0 ? `${unpaidCount} blm bayar` : undefined,
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-amber-900/60 dark:text-slate-300'
    },
    {
      key: 'kategori',
      label: 'Kategori Iuran Lain',
      icon: Layers
    },
    {
      key: 'anggota',
      label: 'Data Anggota',
      icon: Users,
      badge: totalAnggota > 0 ? `${totalAnggota}` : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    },
    {
      key: 'rekap',
      label: 'Rekap & Laporan PDF',
      icon: FileSpreadsheet
    },
    {
      key: 'pengaturan',
      label: 'Pengaturan & Sheets',
      icon: Settings
    },
    {
      key: 'android',
      label: 'Integrasi Android API',
      icon: Smartphone,
      badge: 'REST',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    }
  ];

  return (
    <aside id="main-sidebar" className="hidden lg:block w-64 flex-shrink-0">
      {/* Desktop Vertical Sidebar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm sticky top-20">
        <div className="px-3 py-2 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigasi Utama
          </p>
        </div>

        <nav className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={`sidebar-tab-${item.key}`}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-blue-500/80 text-white'
                        : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Info Box RT 04 */}
        <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Periode Aktif: 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Iuran Kas RT 04 wajib dibayar setiap bulan sebelum tanggal 10.
          </p>
        </div>
      </div>
    </aside>
  );
};
