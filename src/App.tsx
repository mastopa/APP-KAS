import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { NetworkToast } from './components/NetworkToast';
import { DashboardView } from './components/DashboardView';
import { KasView } from './components/KasView';
import { KategoriView } from './components/KategoriView';
import { AnggotaView } from './components/AnggotaView';
import { RekapView } from './components/RekapView';
import { PengaturanView } from './components/PengaturanView';
import { AndroidGuideView } from './components/AndroidGuideView';
import { MultiSelectKasModal } from './components/MultiSelectKasModal';
import { MultiSelectIuranLainModal } from './components/MultiSelectIuranLainModal';
import { PengeluaranModal } from './components/PengeluaranModal';
import { KategoriModal } from './components/KategoriModal';
import { LoginModal } from './components/LoginModal';

import { api } from './services/api';
import { Kategori, TransaksiKas, TransaksiLain, Anggota, Admin, ActiveTab } from './types';
import { getCurrentPeriodeBulan } from './utils/formatters';

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isNetworkToastDismissed, setIsNetworkToastDismissed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Authentication State
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(() => {
    const saved = localStorage.getItem('admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Data Store with offline cache initial fallback
  const [kategoriList, setKategoriList] = useState<Kategori[]>(() => {
    try {
      const cached = localStorage.getItem('rt04_cache_kategori');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [transaksiKasList, setTransaksiKasList] = useState<(TransaksiKas & { nama_anggota?: string })[]>(() => {
    try {
      const cached = localStorage.getItem('rt04_cache_kas');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [transaksiLainList, setTransaksiLainList] = useState<(TransaksiLain & { nama_anggota?: string; nama_kategori?: string })[]>(() => {
    try {
      const cached = localStorage.getItem('rt04_cache_lain');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [anggotaList, setAnggotaList] = useState<Anggota[]>(() => {
    try {
      const cached = localStorage.getItem('rt04_cache_anggota');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const defaultSet = {
      nama_organisasi: 'Karang Taruna / Remaja RT 04',
      nama_rt: 'RT 04 / RW 02',
      nominal_kas_bulanan: '10000',
      nama_bendahara: 'Bendahara RT 04',
      kontak_bendahara: '',
      rekening_kas: ''
    };
    try {
      const cached = localStorage.getItem('rt04_cache_settings');
      return cached ? { ...defaultSet, ...JSON.parse(cached) } : defaultSet;
    } catch {
      return defaultSet;
    }
  });

  // Modal Control States
  const [isMultiSelectKasOpen, setIsMultiSelectKasOpen] = useState(false);
  const [multiSelectKasPeriode, setMultiSelectKasPeriode] = useState<string>(getCurrentPeriodeBulan());

  const [isMultiSelectIuranLainOpen, setIsMultiSelectIuranLainOpen] = useState(false);
  const [selectedKategoriForIuranLain, setSelectedKategoriForIuranLain] = useState<Kategori | null>(null);

  const [isPengeluaranOpen, setIsPengeluaranOpen] = useState(false);
  const [pengeluaranPreselectKategoriId, setPengeluaranPreselectKategoriId] = useState<string | undefined>(undefined);
  const [pengeluaranPreselectMonth, setPengeluaranPreselectMonth] = useState<string | undefined>(undefined);

  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [kategoriToEdit, setKategoriToEdit] = useState<Kategori | null>(null);

  // Apply dark mode class to html/body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Online / offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsNetworkToastDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsNetworkToastDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show temporary toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Fetch all data from backend (supports silent auto-refresh without layout flicker)
  const loadAllData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const [kategoriRes, kasRes, lainRes, anggotaRes, settingsRes] = await Promise.all([
        api.getKategori(),
        api.getTransaksiKas(),
        api.getTransaksiLain(),
        api.getAnggota(),
        api.getPengaturan()
      ]);

      const katData = kategoriRes.data || [];
      const kasData = kasRes.data || [];
      const lainData = lainRes.data || [];
      const anggotaData = anggotaRes.data || [];

      setKategoriList(katData);
      setTransaksiKasList(kasData);
      setTransaksiLainList(lainData);
      setAnggotaList(anggotaData);

      // Save to offline cache
      try {
        localStorage.setItem('rt04_cache_kategori', JSON.stringify(katData));
        localStorage.setItem('rt04_cache_kas', JSON.stringify(kasData));
        localStorage.setItem('rt04_cache_lain', JSON.stringify(lainData));
        localStorage.setItem('rt04_cache_anggota', JSON.stringify(anggotaData));
      } catch (storageErr) {
        console.warn('Cache write warning:', storageErr);
      }

      if (settingsRes.data) {
        setSettings(prev => {
          const updated = { ...prev, ...settingsRes.data };
          try {
            localStorage.setItem('rt04_cache_settings', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      setIsOnline(true);
    } catch (err: any) {
      console.warn('Info loadAllData:', err.message || err);
      // If offline or connection issue, try to recover from cached state
      const hasLocalData = kategoriList.length > 0 || anggotaList.length > 0;
      if (!silent && !hasLocalData) {
        // Retry once after 1 second if initial load fails
        setTimeout(() => {
          loadAllData(true);
        }, 1200);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [kategoriList.length, anggotaList.length]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Automated Real-time Background Polling (GET is 100% automatic without manual interaction)
  useEffect(() => {
    // 1. Periodic background polling every 10 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        loadAllData(true);
      }
    }, 10000);

    // 2. Auto-fetch when user refocuses browser window or tab
    const handleFocus = () => {
      if (navigator.onLine) {
        loadAllData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadAllData]);

  // Sync to Google Sheets
  const handleQuickSyncSheets = async () => {
    try {
      setIsSyncingSheets(true);
      const res = await api.syncToGoogleSheets();
      if (res.success) {
        showToast('Sinkronisasi ke Google Spreadsheet sukses!');
      } else {
        showToast(res.message || 'Sinkronisasi selesai dengan peringatan', 'info');
      }
    } catch (e: any) {
      showToast(e.message || 'Gagal menyinkronkan data ke Google Sheets', 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Login handler
  const handleLogin = async (credentials: { username: string; password: string }) => {
    const res = await api.login(credentials);
    setCurrentAdmin(res.admin);
    localStorage.setItem('admin_user', JSON.stringify(res.admin));
    showToast(`Selamat datang kembali, ${res.admin.nama_lengkap || res.admin.username}!`);
    return res.admin;
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('admin_user');
    showToast('Anda telah keluar dari akun.', 'info');
  };

  // Multi-Select Kas Submit
  const handleAddKasBatch = async (data: {
    anggota_ids: string[];
    periode_bulan: string;
    jumlah: number;
    tanggal: string;
    keterangan?: string;
  }) => {
    await api.addTransaksiKasBatch(data);
    showToast(`Berhasil mencatat kas untuk ${data.anggota_ids.length} anggota! (Tersimpan otomatis)`);
    await loadAllData(true);
  };

  // Multi-Select / Manual Iuran Lain Submit
  const handleAddIuranLainBatch = async (data: {
    id_kategori: string;
    anggota_ids?: string[];
    manual_names?: string[];
    jumlah: number;
    tanggal: string;
    keterangan?: string;
  }) => {
    if (data.manual_names && data.manual_names.length > 0) {
      for (const nama of data.manual_names) {
        if (!nama.trim()) continue;
        await api.addTransaksiLain({
          id_kategori: data.id_kategori,
          nama_anggota: nama.trim(),
          jumlah: data.jumlah,
          jenis: 'masuk',
          tanggal: data.tanggal,
          keterangan: data.keterangan || 'Iuran Pos Khusus'
        });
      }
      showToast(`Berhasil mencatat iuran untuk ${data.manual_names.length} pembayar!`);
    } else if (data.anggota_ids && data.anggota_ids.length > 0) {
      await api.addTransaksiLainBatch({
        id_kategori: data.id_kategori,
        anggota_ids: data.anggota_ids,
        jumlah: data.jumlah,
        tanggal: data.tanggal,
        keterangan: data.keterangan
      });
      showToast(`Berhasil mencatat iuran untuk ${data.anggota_ids.length} anggota!`);
    }
    await loadAllData(true);
  };

  // Pengeluaran Submit (Kas or Category)
  const handleAddPengeluaran = async (data: {
    is_kas_utama: boolean;
    id_kategori?: string;
    periode_bulan?: string;
    jumlah: number;
    tanggal: string;
    keterangan: string;
  }) => {
    if (data.is_kas_utama) {
      await api.addTransaksiKasSingle({
        periode_bulan: data.periode_bulan || getCurrentPeriodeBulan(),
        jumlah: data.jumlah,
        jenis: 'keluar',
        tanggal: data.tanggal,
        keterangan: data.keterangan
      });
      showToast('Pengeluaran Kas Utama berhasil dicatat otomatis!');
    } else {
      await api.addTransaksiLainSingle({
        id_kategori: data.id_kategori!,
        jumlah: data.jumlah,
        jenis: 'keluar',
        tanggal: data.tanggal,
        keterangan: data.keterangan
      });
      showToast('Pengeluaran Kategori berhasil dicatat otomatis!');
    }
    await loadAllData(true);
  };

  // Delete Transaksi Kas
  const handleDeleteTransaksiKas = async (id_transaksi: string) => {
    try {
      await api.deleteTransaksiKas(id_transaksi);
      showToast(`Transaksi ${id_transaksi} berhasil dihapus.`);
      await loadAllData(true);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus transaksi kas.', 'error');
    }
  };

  // Delete Transaksi Lain
  const handleDeleteTransaksiLain = async (id_transaksi: string) => {
    try {
      await api.deleteTransaksiLain(id_transaksi);
      showToast(`Transaksi ${id_transaksi} berhasil dihapus.`);
      await loadAllData(true);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus transaksi iuran.', 'error');
    }
  };

  // Kategori CRUD
  const handleSaveKategori = async (data: {
    id_kategori?: string;
    nama_kategori: string;
    target_nominal?: number;
    deskripsi?: string;
    color?: string;
  }) => {
    if (data.id_kategori) {
      await api.updateKategori(data as any);
      showToast(`Kategori "${data.nama_kategori}" berhasil diperbarui.`);
    } else {
      await api.addKategori(data);
      showToast(`Kategori baru "${data.nama_kategori}" berhasil ditambahkan!`);
    }
    await loadAllData(true);
  };

  const handleDeleteKategori = async (id_kategori: string) => {
    try {
      await api.deleteKategori(id_kategori);
      showToast('Kategori berhasil dihapus.');
      await loadAllData(true);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kategori.', 'error');
    }
  };

  // Anggota CRUD
  const handleAddAnggota = async (payload: {
    nama: string;
    status: 'Aktif' | 'Non-aktif';
    no_telepon?: string;
    alamat?: string;
  }) => {
    await api.addAnggota(payload);
    showToast(`Anggota "${payload.nama}" berhasil ditambahkan.`);
    await loadAllData(true);
  };

  const handleUpdateAnggota = async (payload: Partial<Anggota> & { id_anggota: string }) => {
    await api.updateAnggota(payload);
    showToast(`Data anggota "${payload.nama}" berhasil diperbarui.`);
    await loadAllData(true);
  };

  const handleDeleteAnggota = async (id_anggota: string) => {
    try {
      await api.deleteAnggota(id_anggota);
      showToast('Anggota berhasil dihapus.');
      await loadAllData(true);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus anggota.', 'error');
    }
  };

  // Admin and Settings updates
  const handleUpdateAdminCredentials = async (data: {
    current_username: string;
    new_username?: string;
    new_password?: string;
    new_nama?: string;
  }) => {
    const res = await api.updateAdminCredentials(data);
    if (res.admin) {
      setCurrentAdmin(res.admin);
      localStorage.setItem('admin_user', JSON.stringify(res.admin));
    }
    showToast('Kredensial admin berhasil diperbarui.');
  };

  const handleUpdateSettings = async (newSettings: Record<string, string>) => {
    await api.updatePengaturan(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Pengaturan RT berhasil disimpan.');
  };

  const handleInitGoogleSheets = async () => {
    const res = await api.initGoogleSheets();
    showToast('Pengecekan inisialisasi skema selesai!');
    return res;
  };

  const handleResetData = async () => {
    await api.resetData();
    showToast('Data simulasi berhasil direset ke kondisi default awal!');
    await loadAllData();
  };

  const defaultNominalKas = Number(settings.nominal_kas_bulanan) || 10000;

  // Unpaid count for current month
  const currentMonthTransactions = transaksiKasList.filter(
    t => t.periode_bulan.toLowerCase() === getCurrentPeriodeBulan().toLowerCase() && t.jenis === 'masuk'
  );
  const paidAnggotaIds = new Set(currentMonthTransactions.map(t => t.id_anggota));
  const activeAnggota = anggotaList.filter(a => a.status === 'Aktif');
  const unpaidCount = activeAnggota.filter(a => !paidAnggotaIds.has(a.id_anggota)).length;

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <LoginModal 
          isOpen={true} 
          onClose={() => {}} 
          onLogin={handleLogin} 
        />
        {feedbackToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
                feedbackToast.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-700'
                  : feedbackToast.type === 'info'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'bg-emerald-600 text-white border-emerald-700'
              }`}
            >
              <span>{feedbackToast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Network Offline Toast */}
      {!isOnline && !isNetworkToastDismissed && (
        <NetworkToast onDismiss={() => setIsNetworkToastDismissed(true)} />
      )}

      {/* Floating Action Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
              feedbackToast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : feedbackToast.type === 'info'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        currentAdmin={currentAdmin}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onSelectTab={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOnline={isOnline}
      />

      {/* Main Layout Area - Mobile First Padding with space for Bottom Nav */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6 pb-24 lg:pb-10">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tab => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          unpaidCount={unpaidCount}
          totalAnggota={anggotaList.length}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 w-full overflow-hidden min-w-0">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-500">Memuat data kas & iuran...</p>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'dashboard' && (
            <DashboardView
              kategoriList={kategoriList}
              transaksiKasList={transaksiKasList}
              transaksiLainList={transaksiLainList}
              anggotaList={anggotaList}
              onNavigateTab={tab => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenMultiSelectKas={() => {
                setMultiSelectKasPeriode(getCurrentPeriodeBulan());
                setIsMultiSelectKasOpen(true);
              }}
              onOpenMultiSelectIuranLain={kat => {
                setSelectedKategoriForIuranLain(kat || null);
                setIsMultiSelectIuranLainOpen(true);
              }}
              onOpenPengeluaran={() => {
                setPengeluaranPreselectKategoriId(undefined);
                setIsPengeluaranOpen(true);
              }}
              isOnline={isOnline}
            />
          )}

          {!isLoading && activeTab === 'kas' && (
            <KasView
              transaksiKasList={transaksiKasList}
              anggotaList={anggotaList}
              defaultNominalKas={defaultNominalKas}
              settings={settings}
              onOpenMultiSelectKas={periode => {
                setMultiSelectKasPeriode(periode);
                setIsMultiSelectKasOpen(true);
              }}
              onOpenPengeluaranKas={periode => {
                setPengeluaranPreselectKategoriId('KAT-KAS-01');
                setPengeluaranPreselectMonth(periode);
                setIsPengeluaranOpen(true);
              }}
              onDeleteTransaksiKas={handleDeleteTransaksiKas}
              isOnline={isOnline}
            />
          )}

          {!isLoading && activeTab === 'kategori' && (
            <KategoriView
              kategoriList={kategoriList}
              transaksiLainList={transaksiLainList}
              transaksiKasList={transaksiKasList}
              anggotaList={anggotaList}
              onOpenAddKategori={() => {
                setKategoriToEdit(null);
                setIsKategoriModalOpen(true);
              }}
              onOpenEditKategori={k => {
                setKategoriToEdit(k);
                setIsKategoriModalOpen(true);
              }}
              onOpenDetailKategori={k => {
                if (k.is_kas_utama) {
                  setActiveTab('kas');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onDeleteKategori={handleDeleteKategori}
              onOpenMultiSelectIuranLain={k => {
                setSelectedKategoriForIuranLain(k);
                setIsMultiSelectIuranLainOpen(true);
              }}
              onOpenPengeluaranIuranLain={k => {
                setPengeluaranPreselectKategoriId(k.id_kategori);
                setIsPengeluaranOpen(true);
              }}
              onDeleteTransaksiLain={handleDeleteTransaksiLain}
              isOnline={isOnline}
            />
          )}

          {!isLoading && activeTab === 'anggota' && (
            <AnggotaView
              anggotaList={anggotaList}
              onAddAnggota={handleAddAnggota}
              onUpdateAnggota={handleUpdateAnggota}
              onDeleteAnggota={handleDeleteAnggota}
              isOnline={isOnline}
            />
          )}

          {!isLoading && activeTab === 'rekap' && (
            <RekapView
              kategoriList={kategoriList}
              transaksiKasList={transaksiKasList}
              transaksiLainList={transaksiLainList}
              anggotaList={anggotaList}
              settings={settings}
            />
          )}

          {!isLoading && activeTab === 'pengaturan' && (
            <PengaturanView
              currentAdmin={currentAdmin}
              settings={settings}
              onUpdateAdminCredentials={handleUpdateAdminCredentials}
              onUpdateSettings={handleUpdateSettings}
              onInitGoogleSheets={handleInitGoogleSheets}
              onResetData={handleResetData}
              isOnline={isOnline}
            />
          )}

          {!isLoading && activeTab === 'android' && (
            <AndroidGuideView />
          )}
        </main>
      </div>

      {/* Mobile-First Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdmin={!!currentAdmin}
        adminUser={currentAdmin}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isOnline={isOnline}
        onSyncSheets={handleQuickSyncSheets}
        isSyncing={isSyncingSheets}
      />

      {/* Global Modals */}

      {/* 1. Multi-select Kas Modal */}
      <MultiSelectKasModal
        isOpen={isMultiSelectKasOpen}
        onClose={() => setIsMultiSelectKasOpen(false)}
        anggotaList={anggotaList}
        defaultNominal={defaultNominalKas}
        initialPeriode={multiSelectKasPeriode}
        onSubmit={handleAddKasBatch}
        isOnline={isOnline}
      />

      {/* 2. Multi-select Iuran Lain Modal */}
      <MultiSelectIuranLainModal
        isOpen={isMultiSelectIuranLainOpen}
        onClose={() => setIsMultiSelectIuranLainOpen(false)}
        kategoriList={kategoriList}
        selectedKategori={selectedKategoriForIuranLain}
        anggotaList={anggotaList}
        onSubmit={handleAddIuranLainBatch}
        isOnline={isOnline}
      />

      {/* 3. Catat Pengeluaran Modal */}
      <PengeluaranModal
        isOpen={isPengeluaranOpen}
        onClose={() => setIsPengeluaranOpen(false)}
        kategoriList={kategoriList}
        preselectedKategoriId={pengeluaranPreselectKategoriId}
        preselectedMonth={pengeluaranPreselectMonth}
        onSubmit={handleAddPengeluaran}
        isOnline={isOnline}
      />

      {/* 4. Tambah / Edit Kategori Modal */}
      <KategoriModal
        isOpen={isKategoriModalOpen}
        onClose={() => setIsKategoriModalOpen(false)}
        kategoriToEdit={kategoriToEdit}
        onSubmit={handleSaveKategori}
        isOnline={isOnline}
      />

      {/* 5. Login Admin Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
