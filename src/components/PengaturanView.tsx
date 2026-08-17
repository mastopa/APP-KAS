import React, { useState, useEffect } from 'react';
import {
  Settings,
  KeyRound,
  Database,
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  Save,
  RotateCcw,
  UploadCloud,
  DownloadCloud,
  CheckCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Admin, PengaturanItem } from '../types';
import { formatRupiah } from '../utils/formatters';
import { api } from '../services/api';

interface PengaturanViewProps {
  currentAdmin: Admin | null;
  settings: Record<string, string>;
  onUpdateAdminCredentials: (data: { current_username: string; new_username?: string; new_password?: string; new_nama?: string }) => Promise<void>;
  onUpdateSettings: (settings: Record<string, string>) => Promise<void>;
  onInitGoogleSheets: () => Promise<any>;
  onResetData: () => Promise<void>;
  isOnline: boolean;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  currentAdmin,
  settings,
  onUpdateAdminCredentials,
  onUpdateSettings,
  onInitGoogleSheets,
  onResetData,
  isOnline
}) => {
  // Admin form
  const [newUsername, setNewUsername] = useState(currentAdmin?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [newNama, setNewNama] = useState(currentAdmin?.nama_lengkap || '');
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // Settings form
  const [namaRt, setNamaRt] = useState(settings.nama_rt || 'RT 04 / RW 02 Sukamaju');
  const [nominalKas, setNominalKas] = useState(settings.nominal_kas_bulanan || '10000');
  const [namaBendahara, setNamaBendahara] = useState(settings.nama_bendahara || 'Siti Rahmawati');
  const [kontakBendahara, setKontakBendahara] = useState(settings.kontak_bendahara || '0812-9876-5432');
  const [rekeningKas, setRekeningKas] = useState(settings.rekening_kas || 'BCA 8720192819 a.n Kas Remaja RT 04');
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);

  // Google Sheets integration state
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string; details?: any } | null>(null);

  const fetchSheetsStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await api.getSheetsStatus();
      setSheetsStatus(res.data);
    } catch (e) {
      console.warn('Gagal memuat status Google Sheets:', e);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetsStatus();
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    try {
      setIsAdminSubmitting(true);
      setAdminMsg(null);
      await onUpdateAdminCredentials({
        current_username: currentAdmin.username,
        new_username: newUsername !== currentAdmin.username ? newUsername : undefined,
        new_password: newPassword ? newPassword : undefined,
        new_nama: newNama ? newNama : undefined
      });
      setAdminMsg({ type: 'success', text: 'Kredensial admin berhasil diperbarui!' });
      setNewPassword('');
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Gagal mengubah kredensial admin.' });
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSettingsSubmitting(true);
      setSettingsMsg(null);
      await onUpdateSettings({
        nama_rt: namaRt,
        nominal_kas_bulanan: nominalKas,
        nama_bendahara: namaBendahara,
        kontak_bendahara: kontakBendahara,
        rekening_kas: rekeningKas
      });
      setSettingsMsg({ type: 'success', text: 'Pengaturan RT & Keuangan berhasil disimpan!' });
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setIsSettingsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestLoading(true);
      setActionResult(null);
      const res = await api.testSheetsConnection();
      if (res.success) {
        setActionResult({
          type: 'success',
          title: 'Pengujian Kredensial Berhasil!',
          message: res.message,
          details: res.sheets
        });
        fetchSheetsStatus();
      } else {
        setActionResult({
          type: 'error',
          title: 'Pengujian Gagal',
          message: res.message
        });
      }
    } catch (err: any) {
      setActionResult({
        type: 'error',
        title: 'Pengujian Gagal',
        message: err.message || 'Terjadi kesalahan saat menguji koneksi Google Sheets.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSyncAllToSheets = async () => {
    try {
      setSyncLoading(true);
      setActionResult(null);
      const res = await api.syncAllToSheets();
      if (res.success) {
        setActionResult({
          type: 'success',
          title: 'Sinkronisasi Data Berhasil!',
          message: res.message,
          details: res.syncedTabs
        });
        fetchSheetsStatus();
      } else {
        setActionResult({
          type: 'error',
          title: 'Sinkronisasi Gagal',
          message: res.message
        });
      }
    } catch (err: any) {
      setActionResult({
        type: 'error',
        title: 'Sinkronisasi Gagal',
        message: err.message || 'Gagal menyinkronkan data ke Google Sheets.'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!confirm('Tarik data dari Google Spreadsheet akan menimpa data transaksi dan anggota di database lokal dengan isi spreadsheet. Lanjutkan?')) {
      return;
    }
    try {
      setPullLoading(true);
      setActionResult(null);
      const res = await api.pullFromSheets();
      if (res.success) {
        setActionResult({
          type: 'success',
          title: 'Data Berhasil Ditarik!',
          message: res.message,
          details: res.stats
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setActionResult({
          type: 'error',
          title: 'Gagal Menarik Data',
          message: res.message
        });
      }
    } catch (err: any) {
      setActionResult({
        type: 'error',
        title: 'Gagal Menarik Data',
        message: err.message || 'Gagal menarik data dari Google Sheets.'
      });
    } finally {
      setPullLoading(false);
    }
  };

  return (
    <div id="pengaturan-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pengaturan Sistem & Database
          </h2>
          <p className="text-xs text-slate-500">
            Kredensial akun, integrasi Google Sheets, preferensi RT, dan sinkronisasi database
          </p>
        </div>
      </div>

      {/* Google Sheets Integration & Testing Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Integrasi Google Sheets & Kredensial
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    sheetsStatus?.configured
                      ? 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${sheetsStatus?.configured ? 'bg-slate-500 animate-pulse' : 'bg-slate-500'}`} />
                  {sheetsStatus?.configured ? 'Terkoneksi ke Google Spreadsheet' : 'Standby / Database Lokal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Otomatisasi Penuh: Seluruh aksi GET, POST, PUT, dan DELETE berjalan otomatis secara realtime ke database & Google Spreadsheet tanpa perlu aksi manual.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSheetsStatus}
            disabled={statusLoading}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
            <span>Perbarui Status</span>
          </button>
        </div>

        {/* Auto Sync Info Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Sistem Otomatisasi Realtime Aktif</p>
            <p className="opacity-90 leading-relaxed">
              Setiap kali Anda menambah data (POST), mengubah data (PUT), atau menghapus data (DELETE), server secara instan menyimpan ke database dan langsung menyinkronkan baris terkait ke Google Spreadsheet. Pengambilan data (GET) juga dilakukan otomatis melalui *background polling* tanpa perlu memuat ulang halaman secara manual.
            </p>
          </div>
        </div>

        {/* Action Controls & Diagnostic Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testLoading || !isOnline}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
            <span>{testLoading ? 'Menguji Koneksi...' : 'Uji Kredensial & Koneksi'}</span>
          </button>

          <button
            onClick={handleSyncAllToSheets}
            disabled={syncLoading || !isOnline}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <UploadCloud className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'Menyinkronkan...' : 'Kirim Semua Data ke Spreadsheet'}</span>
          </button>

          <button
            onClick={handlePullFromSheets}
            disabled={pullLoading || !isOnline}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
          >
            <DownloadCloud className={`w-3.5 h-3.5 ${pullLoading ? 'animate-spin' : ''}`} />
            <span>{pullLoading ? 'Menarik...' : 'Tarik Data dari Spreadsheet'}</span>
          </button>
        </div>

        {/* Action Feedback Result */}
        {actionResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              actionResult.type === 'success'
                ? 'bg-slate-50 border-slate-200 text-emerald-900 dark:bg-slate-800/40 dark:border-slate-700 dark:text-emerald-200'
                : 'bg-slate-50 border-slate-200 text-rose-900 dark:bg-slate-800/40 dark:border-slate-700 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {actionResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-slate-700" /> : <AlertCircle className="w-4 h-4 text-slate-700" />}
              <span>{actionResult.title}</span>
            </div>
            <p className="opacity-90">{actionResult.message}</p>
            {Array.isArray(actionResult.details) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                {actionResult.details.map((sh: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="font-bold text-[11px] truncate">{typeof sh === 'string' ? sh : sh.name}</p>
                    {sh.rowCount !== undefined && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sh.rowCount} baris data</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6 Auto-Generated Tables Matrix */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            6 Skema Tabel Spreadsheet Terstandarisasi:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Admins', cols: 'id, username, password, nama_lengkap, role' },
              { name: 'Anggota', cols: 'id_anggota, nama, status, no_telepon, alamat, created_at' },
              { name: 'Kategori', cols: 'id_kategori, nama_kategori, is_kas_utama, target_nominal, deskripsi, color' },
              { name: 'Transaksi_Kas', cols: 'id_transaksi, id_anggota, periode_bulan, jumlah, jenis, tanggal, keterangan' },
              { name: 'Transaksi_Lain', cols: 'id_transaksi, id_kategori, id_anggota, jumlah, jenis, tanggal, keterangan' },
              { name: 'Pengaturan', cols: 'key, value' }
            ].map(tab => (
              <div
                key={tab.name}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center"
              >
                <div className="w-2 h-2 rounded-full bg-slate-500 mx-auto mb-1.5" />
                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {tab.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1 line-clamp-2" title={tab.cols}>
                  {tab.cols}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Ubah Kredensial Admin */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Kredensial Akun Admin
            </h3>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {adminMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  adminMsg.type === 'success'
                    ? 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300'
                    : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300'
                }`}
              >
                {adminMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{adminMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap / Jabatan
              </label>
              <input
                type="text"
                value={newNama}
                onChange={e => setNewNama(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username Login
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password Baru (Kosongkan jika tidak ingin mengubah)
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isAdminSubmitting || !isOnline}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAdminSubmitting ? 'Menyimpan...' : 'Perbarui Kredensial Admin'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Preferensi RT & Keuangan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Preferensi RT & Keuangan
            </h3>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            {settingsMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  settingsMsg.type === 'success'
                    ? 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300'
                    : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300'
                }`}
              >
                {settingsMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{settingsMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama RT & Wilayah
              </label>
              <input
                type="text"
                value={namaRt}
                onChange={e => setNamaRt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nominal Iuran Kas Bulanan Default (Rp)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={nominalKas}
                onChange={e => setNominalKas(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Bendahara
                </label>
                <input
                  type="text"
                  value={namaBendahara}
                  onChange={e => setNamaBendahara(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. Kontak / WA
                </label>
                <input
                  type="text"
                  value={kontakBendahara}
                  onChange={e => setKontakBendahara(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                No. Rekening / QRIS Kas RT
              </label>
              <input
                type="text"
                value={rekeningKas}
                onChange={e => setRekeningKas(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSettingsSubmitting || !isOnline}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSettingsSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan RT'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. Reset Demo Data */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
            Reset Data Simulasi RT 04
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Mengembalikan seluruh data transaksi dan anggota ke kondisi default awal.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Yakin ingin mereset seluruh data kembali ke kondisi default awal?')) {
              onResetData();
            }
          }}
          disabled={!isOnline}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data Default</span>
        </button>
      </div>
    </div>
  );
};
