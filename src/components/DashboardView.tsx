import React from 'react';
import {
  Wallet,
  Coins,
  TrendingDown,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileDown,
  Layers,
  Sparkles,
  UserPlus,
  Receipt,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { Kategori, TransaksiKas, TransaksiLain, Anggota, ActiveTab } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface DashboardViewProps {
  kategoriList: Kategori[];
  transaksiKasList: (TransaksiKas & { nama_anggota?: string })[];
  transaksiLainList: (TransaksiLain & { nama_anggota?: string; nama_kategori?: string })[];
  anggotaList: Anggota[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenMultiSelectKas: () => void;
  onOpenMultiSelectIuranLain: (kategori?: Kategori) => void;
  onOpenPengeluaran: () => void;
  isOnline: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kategoriList,
  transaksiKasList,
  transaksiLainList,
  anggotaList,
  onNavigateTab,
  onOpenMultiSelectKas,
  onOpenMultiSelectIuranLain,
  onOpenPengeluaran,
  isOnline
}) => {
  // Calculations
  const kasMasuk = transaksiKasList
    .filter(t => t.jenis === 'masuk')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  const kasKeluar = transaksiKasList
    .filter(t => t.jenis === 'keluar')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  const lainMasuk = transaksiLainList
    .filter(t => t.jenis === 'masuk')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  const lainKeluar = transaksiLainList
    .filter(t => t.jenis === 'keluar')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  const saldoKas = kasMasuk - kasKeluar;
  const saldoLain = lainMasuk - lainKeluar;
  const totalSaldoBersih = saldoKas + saldoLain;

  const totalAnggota = anggotaList.length;
  const totalAktif = anggotaList.filter(a => a.status === 'Aktif').length;
  const totalNonaktif = anggotaList.filter(a => a.status === 'Non-aktif').length;

  // Recent transactions list
  const mappedKas = transaksiKasList.map(t => ({
    id: t.id_transaksi,
    type: 'kas' as const,
    title: t.keterangan || `Iuran Kas - ${t.nama_anggota || 'Anggota'}`,
    kategori: 'Kas Utama RT 04',
    periode: t.periode_bulan,
    jumlah: Number(t.jumlah),
    jenis: t.jenis,
    tanggal: t.tanggal
  }));

  const mappedLain = transaksiLainList.map(t => {
    const kat = kategoriList.find(k => k.id_kategori === t.id_kategori);
    return {
      id: t.id_transaksi,
      type: 'lain' as const,
      title: t.keterangan || (t.jenis === 'masuk' ? `Iuran ${kat?.nama_kategori || ''} - ${t.nama_anggota || 'Anggota'}` : 'Pengeluaran'),
      kategori: kat?.nama_kategori || t.nama_kategori || 'Iuran Lain',
      periode: undefined,
      jumlah: Number(t.jumlah),
      jenis: t.jenis,
      tanggal: t.tanggal
    };
  });

  const recentTransactions = [...mappedKas, ...mappedLain]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 12);

  const indicatorCards = [
    {
      id: 'card-total-kas',
      title: 'Kas Utama Masuk',
      value: formatRupiah(kasMasuk),
      subtitle: `Saldo: ${formatRupiah(saldoKas)}`,
      icon: Wallet,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      iconBg: 'bg-blue-600 text-white'
    },
    {
      id: 'card-total-iuran-lain',
      title: 'Iuran Lain Masuk',
      value: formatRupiah(lainMasuk),
      subtitle: `Saldo: ${formatRupiah(saldoLain)}`,
      icon: Coins,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'card-pengeluaran-kas',
      title: 'Pengeluaran Kas',
      value: formatRupiah(kasKeluar),
      subtitle: 'Operasional Kas Utama',
      icon: TrendingDown,
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      iconBg: 'bg-rose-600 text-white'
    },
    {
      id: 'card-pengeluaran-lain',
      title: 'Pengeluaran Lain',
      value: formatRupiah(lainKeluar),
      subtitle: 'Kegiatan & Acara',
      icon: TrendingDown,
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      iconBg: 'bg-amber-600 text-white'
    },
    {
      id: 'card-total-anggota',
      title: 'Jumlah Anggota',
      value: `${totalAnggota} Orang`,
      subtitle: `${totalAktif} Aktif · ${totalNonaktif} Non-aktif`,
      icon: Users,
      color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      iconBg: 'bg-slate-600 text-white'
    }
  ];

  return (
    <div id="dashboard-view-container" className="space-y-4 sm:space-y-6">
      {/* 1. Saldo Bersih Hero Banner - Mobile Ergonomic */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-hero-gradient text-white p-5 sm:p-7 shadow-hero">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Kas & Keuangan Remaja RT 04
            </div>
            <span className="text-[11px] font-mono bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-400/20 text-blue-200">
              Realtime
            </span>
          </div>

          <div>
            <p className="text-xs text-blue-100/90 font-medium">Total Akumulasi Saldo Bersih</p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-1 text-white">
              {formatRupiah(totalSaldoBersih)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200/90 mt-2 font-medium">
              <span>Kas Utama: {formatRupiah(saldoKas)}</span>
              <span>•</span>
              <span>Iuran Lain: {formatRupiah(saldoLain)}</span>
            </div>
          </div>

          {/* Quick Action Touch Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              id="dashboard-quick-kas-btn"
              onClick={onOpenMultiSelectKas}
              disabled={!isOnline}
              className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-sm hover:bg-blue-50 active:scale-95 transition-transform disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>Bayar Kas</span>
            </button>

            <button
              id="dashboard-quick-pengeluaran-btn"
              onClick={onOpenPengeluaran}
              disabled={!isOnline}
              className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-blue-600/70 hover:bg-blue-600 border border-blue-400/40 text-white font-semibold text-xs active:scale-95 transition-transform disabled:opacity-50"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-300" />
              <span>Pengeluaran</span>
            </button>

            <button
              id="dashboard-quick-anggota-btn"
              onClick={() => onNavigateTab('anggota')}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Kelola Anggota</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Lima (5) Indikator Utama - Responsive Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ringkasan 5 Indikator
          </h2>
          <span className="text-[11px] text-slate-400">{totalAnggota} Anggota Terdaftar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {indicatorCards.map((card, idx) => {
            const Icon = card.icon;
            const isLastOnMobile = idx === 4;

            return (
              <div
                key={card.id}
                id={card.id}
                className={`p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all ${card.color} ${
                  isLastOnMobile ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                    {card.title}
                  </span>
                  <div className={`p-1.5 sm:p-2 rounded-xl ${card.iconBg} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {card.value}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Pos Saldo Kategori & Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Kategori Card List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Saldo Tiap Pos Iuran
              </h3>
              <p className="text-[11px] text-slate-500">Perincian kategori keuangan</p>
            </div>
            <button
              onClick={() => onNavigateTab('kategori')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
            >
              Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {kategoriList.map(kat => {
              let masuk = 0;
              let keluar = 0;
              if (kat.is_kas_utama) {
                masuk = kasMasuk;
                keluar = kasKeluar;
              } else {
                masuk = transaksiLainList
                  .filter(t => t.id_kategori === kat.id_kategori && t.jenis === 'masuk')
                  .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);
                keluar = transaksiLainList
                  .filter(t => t.id_kategori === kat.id_kategori && t.jenis === 'keluar')
                  .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);
              }
              const saldoPos = masuk - keluar;

              return (
                <div
                  key={kat.id_kategori}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {kat.nama_kategori}
                      </span>
                      {kat.is_kas_utama && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          Utama
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatRupiah(saldoPos)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-700 dark:text-slate-300">
                      Masuk: {formatRupiah(masuk)}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      Keluar: {formatRupiah(keluar)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaksi Terkini */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Transaksi Terkini
              </h3>
              <p className="text-[11px] text-slate-500">Mutasi kas & iuran terbaru</p>
            </div>
            <button
              onClick={() => onNavigateTab('rekap')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
            >
              Lihat Rekap <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Belum ada transaksi
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Catat pembayaran kas pertama atau mutasi pengeluaran.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={onOpenMultiSelectKas}
                    disabled={!isOnline}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700"
                  >
                    Bayar Kas Sekarang
                  </button>
                </div>
              </div>
            ) : (
              recentTransactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        tx.jenis === 'masuk'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                      }`}
                    >
                      {tx.jenis === 'masuk' ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span>{formatDate(tx.tanggal)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                          {tx.kategori}
                        </span>
                        {tx.periode && <span className="hidden sm:inline">({tx.periode})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <p
                      className={`text-xs sm:text-sm font-bold ${
                        tx.jenis === 'masuk'
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tx.jenis === 'masuk' ? '+' : '-'} {formatRupiah(tx.jumlah)}
                    </p>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                      {tx.id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
