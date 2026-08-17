import React, { useState } from 'react';
import {
  ArrowLeft,
  PlusCircle,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Trash2,
  Users,
  Search,
  FolderKanban,
  Target,
  Edit2,
  Calendar,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Kategori, TransaksiLain, Anggota } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface KategoriDetailViewProps {
  kategori: Kategori;
  transaksiList: (TransaksiLain & { nama_anggota?: string })[];
  anggotaList: Anggota[];
  onBack: () => void;
  onOpenMultiSelectIuranLain: (kat: Kategori) => void;
  onOpenPengeluaranIuranLain: (kat: Kategori) => void;
  onOpenEditKategori?: (kat: Kategori) => void;
  onDeleteKategori?: (id_kategori: string) => void;
  onDeleteTransaksiLain: (id: string) => void;
  isOnline: boolean;
}

export const KategoriDetailView: React.FC<KategoriDetailViewProps> = ({
  kategori,
  transaksiList,
  anggotaList,
  onBack,
  onOpenMultiSelectIuranLain,
  onOpenPengeluaranIuranLain,
  onOpenEditKategori,
  onDeleteKategori,
  onDeleteTransaksiLain,
  isOnline
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'sudah' | 'belum'>('all');

  const currentKatTransactions = transaksiList
    .filter(t => t.id_kategori === kategori.id_kategori)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const totalMasuk = currentKatTransactions
    .filter(t => t.jenis === 'masuk')
    .reduce((s, t) => s + Number(t.jumlah || 0), 0);

  const totalKeluar = currentKatTransactions
    .filter(t => t.jenis === 'keluar')
    .reduce((s, t) => s + Number(t.jumlah || 0), 0);

  const saldo = totalMasuk - totalKeluar;

  // Set of member IDs who paid for this category
  const paidTransactionsMap = new Map<string, TransaksiLain>();
  currentKatTransactions
    .filter(t => t.jenis === 'masuk' && t.id_anggota)
    .forEach(t => {
      if (t.id_anggota && !paidTransactionsMap.has(t.id_anggota)) {
        paidTransactionsMap.set(t.id_anggota, t);
      }
    });

  const activeAnggota = anggotaList.filter(a => a.status === 'Aktif');
  const totalAnggotaAktif = activeAnggota.length;
  const sudahBayarCount = activeAnggota.filter(a => paidTransactionsMap.has(a.id_anggota)).length;
  const belumBayarCount = Math.max(0, totalAnggotaAktif - sudahBayarCount);
  const persentaseBayar = totalAnggotaAktif > 0 ? Math.round((sudahBayarCount / totalAnggotaAktif) * 100) : 0;

  const targetNominalTotal = (kategori.target_nominal || 0) * totalAnggotaAktif;
  const persentaseNominal = targetNominalTotal > 0 ? Math.min(100, Math.round((totalMasuk / targetNominalTotal) * 100)) : persentaseBayar;

  const filteredAnggota = anggotaList.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id_anggota.toLowerCase().includes(searchTerm.toLowerCase());
    const isPaid = paidTransactionsMap.has(a.id_anggota);

    if (!matchesSearch) return false;
    if (filterTab === 'sudah') return isPaid;
    if (filterTab === 'belum') return !isPaid;
    return true;
  });

  return (
    <div id="kategori-detail-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            id="back-to-kategori-list-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            title="Kembali ke Daftar Kategori"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Kembali ke</span> Kategori
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: kategori.color || '#3b82f6' }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {kategori.nama_kategori}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {kategori.id_kategori}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {kategori.deskripsi || 'Pos Iuran Khusus RT 04'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls for Category */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onOpenEditKategori && (
            <button
              id="edit-current-kategori-btn"
              onClick={() => onOpenEditKategori(kategori)}
              disabled={!isOnline}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}

          {onDeleteKategori && (
            <button
              id="delete-current-kategori-btn"
              onClick={() => {
                if (confirm(`Hapus kategori "${kategori.nama_kategori}" beserta seluruh mutasi transaksinya?`)) {
                  onDeleteKategori(kategori.id_kategori);
                  onBack();
                }
              }}
              disabled={!isOnline}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-slate-200 dark:hover:border-rose-900 transition-all"
              title="Hapus Kategori"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Masuk */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pemasukan Iuran</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700 dark:bg-emerald-950/50 dark:text-slate-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-2 tracking-tight">
            {formatRupiah(totalMasuk)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{sudahBayarCount} dari {totalAnggotaAktif} anggota lunas ({persentaseBayar}%)</span>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pengeluaran Pos</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-2 tracking-tight">
            {formatRupiah(totalKeluar)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentKatTransactions.filter(t => t.jenis === 'keluar').length} kali transaksi pengeluaran</span>
          </div>
        </div>

        {/* Saldo Kas Tersedia */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sisa Saldo Kas Pos</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 tracking-tight">
            {formatRupiah(saldo)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Sisa dana siap dialokasikan</span>
          </div>
        </div>
      </div>

      {/* Target Progress Bar (if target_nominal > 0) */}
      {(kategori.target_nominal || 0) > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Target Nominal per Warga: {formatRupiah(kategori.target_nominal)}
              </span>
            </div>
            <span className="text-slate-500 font-medium">
              Terkumpul {formatRupiah(totalMasuk)} dari total target {formatRupiah(targetNominalTotal)} ({persentaseNominal}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${persentaseNominal}%`,
                backgroundColor: kategori.color || '#3b82f6'
              }}
            />
          </div>
        </div>
      )}

      {/* Main Action Bar for Inputting Payments / Expenses */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <button
          id="open-mass-payment-btn"
          onClick={() => onOpenMultiSelectIuranLain(kategori)}
          disabled={!isOnline}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Input Pembayaran Iuran Pos</span>
        </button>

        <button
          id="open-expense-btn"
          onClick={() => onOpenPengeluaranIuranLain(kategori)}
          disabled={!isOnline}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-rose-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 disabled:opacity-50 font-semibold text-xs transition-all cursor-pointer"
        >
          <ArrowDownRight className="w-4 h-4 text-slate-700" />
          <span>Catat Pengeluaran Kategori</span>
        </button>

        <div className="ml-auto text-xs text-slate-500 hidden md:block">
          💡 Input pembayar bebas (warga, alumni, donatur, atau peserta umum)
        </div>
      </div>

      {/* Status Iuran Anggota */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Header / Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Status Pembayaran Iuran Warga
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {filteredAnggota.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nama anggota / ID..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-700/60 p-1 text-xs">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Semua ({anggotaList.length})
              </button>
              <button
                onClick={() => setFilterTab('sudah')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterTab === 'sudah'
                    ? 'bg-slate-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-emerald-400'
                }`}
              >
                Sudah Bayar ({sudahBayarCount})
              </button>
              <button
                onClick={() => setFilterTab('belum')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterTab === 'belum'
                    ? 'bg-slate-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-amber-400'
                }`}
              >
                Belum Bayar ({belumBayarCount})
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Responsive Cards */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
          {filteredAnggota.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada data anggota yang sesuai dengan filter
            </div>
          ) : (
            filteredAnggota.map(a => {
              const tx = paidTransactionsMap.get(a.id_anggota);
              const isPaid = !!tx;

              return (
                <div key={a.id_anggota} className="p-3.5 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{a.nama}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{a.id_anggota} • Status: {a.status}</p>
                    </div>
                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Sudah Bayar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          <XCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Belum Bayar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60 text-slate-500">
                    <span>{isPaid ? `Tgl: ${formatDate(tx.tanggal)}` : 'Tarif: '}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isPaid ? formatRupiah(tx.jumlah) : formatRupiah(kategori.target_nominal || 0)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Nama Anggota</th>
                <th className="px-4 py-3">ID Anggota</th>
                <th className="px-4 py-3">Status Iuran</th>
                <th className="px-4 py-3">Tanggal Bayar</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAnggota.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Tidak ada data anggota yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredAnggota.map(a => {
                  const tx = paidTransactionsMap.get(a.id_anggota);
                  const isPaid = !!tx;

                  return (
                    <tr key={a.id_anggota} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {a.nama}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {a.id_anggota}
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Sudah Bayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          <XCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {isPaid ? formatDate(tx.tanggal) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {isPaid ? formatRupiah(tx.jumlah) : formatRupiah(kategori.target_nominal || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mutasi Transaksi Kategori */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Riwayat Mutasi Kas Kategori
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {currentKatTransactions.length}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {currentKatTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-medium text-slate-600 dark:text-slate-400">Belum ada transaksi di pos ini</p>
              <p>Gunakan tombol di atas untuk mencatat pembayaran iuran atau pengeluaran</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {currentKatTransactions.map(tx => (
                <div
                  key={tx.id_transaksi}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.jenis === 'masuk'
                            ? 'bg-slate-100 text-slate-800 dark:bg-emerald-950 dark:text-slate-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-rose-950 dark:text-slate-300'
                        }`}
                      >
                        {tx.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {tx.keterangan || (tx.jenis === 'masuk' ? `Iuran ${tx.nama_anggota || 'Anggota'}` : 'Pengeluaran Kategori')}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(tx.tanggal)} • ID: <span className="font-mono">{tx.id_transaksi}</span>
                      {tx.id_anggota && ` • Warga: ${tx.nama_anggota || tx.id_anggota}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-black ${
                        tx.jenis === 'masuk' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.jenis === 'masuk' ? '+' : '-'} {formatRupiah(tx.jumlah)}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus transaksi "${tx.keterangan || tx.id_transaksi}" senilai ${formatRupiah(tx.jumlah)}?`)) {
                          onDeleteTransaksiLain(tx.id_transaksi);
                        }
                      }}
                      disabled={!isOnline}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
