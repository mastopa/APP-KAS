import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  CheckCircle,
  XCircle,
  PlusCircle,
  ArrowDownRight,
  Search,
  Users,
  Clock,
  Trash2,
  Check,
  MessageCircle,
  FileDown,
  Download
} from 'lucide-react';
import { Anggota, TransaksiKas } from '../types';
import { formatRupiah, formatDate, getCurrentPeriodeBulan, getPeriodeOptions } from '../utils/formatters';
import { generateLaporanKasAnggotaPDF } from '../utils/pdfExport';

interface KasViewProps {
  anggotaList: Anggota[];
  transaksiKasList: (TransaksiKas & { nama_anggota?: string })[];
  defaultNominalKas: number;
  onOpenMultiSelectKas: (preselectedMonth?: string) => void;
  onOpenPengeluaranKas: (preselectedMonth?: string) => void;
  onDeleteTransaksiKas: (id: string) => void;
  isOnline: boolean;
  settings?: Record<string, string>;
}

export const KasView: React.FC<KasViewProps> = ({
  anggotaList,
  transaksiKasList,
  defaultNominalKas,
  onOpenMultiSelectKas,
  onOpenPengeluaranKas,
  onDeleteTransaksiKas,
  isOnline,
  settings = {} as Record<string, string>
}) => {
  const [selectedPeriode, setSelectedPeriode] = useState<string>(getCurrentPeriodeBulan());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'belum'>('all');
  const [waCopied, setWaCopied] = useState<boolean>(false);

  const periodeOptions = getPeriodeOptions(1, 1);

  // Transactions for the selected period
  const currentMonthTransactions = transaksiKasList.filter(
    t => t.periode_bulan.toLowerCase() === selectedPeriode.toLowerCase()
  );

  const pemasukanKasBulanIni = currentMonthTransactions
    .filter(t => t.jenis === 'masuk')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  const pengeluaranKasBulanIni = currentMonthTransactions
    .filter(t => t.jenis === 'keluar')
    .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

  // Paid member IDs and map for this period
  const paidAnggotaMap = new Map<string, TransaksiKas & { nama_anggota?: string }>();
  for (const t of currentMonthTransactions) {
    if (t.jenis === 'masuk' && t.id_anggota) {
      paidAnggotaMap.set(t.id_anggota, t);
    }
  }

  const activeAnggota = anggotaList.filter(a => a.status === 'Aktif');
  const targetPemasukan = activeAnggota.length * defaultNominalKas;
  const lunasCount = activeAnggota.filter(a => paidAnggotaMap.has(a.id_anggota)).length;
  const belumLunasCount = Math.max(0, activeAnggota.length - lunasCount);
  const percentLunas = targetPemasukan > 0 ? Math.min(100, Math.round((pemasukanKasBulanIni / targetPemasukan) * 100)) : 0;

  // Filtered member list for payment status
  const filteredAnggota = anggotaList.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id_anggota.toLowerCase().includes(searchTerm.toLowerCase());
    const isPaid = paidAnggotaMap.has(a.id_anggota);

    if (!matchesSearch) return false;
    if (statusFilter === 'lunas') return isPaid;
    if (statusFilter === 'belum') return !isPaid;
    return true;
  });

  // Action: Share WhatsApp Announcement
  const handleShareWA = async () => {
    const lunasList = anggotaList.filter(a => paidAnggotaMap.has(a.id_anggota));
    const belumList = anggotaList.filter(a => !paidAnggotaMap.has(a.id_anggota));

    let text = `📢 *LAPORAN IURAN KAS UTAMA REMAJA*\n`;
    text += `🏡 *${settings.nama_organisasi || 'Karang Taruna / Remaja RT 04'}*\n`;
    text += `🗓️ *Periode:* ${selectedPeriode}\n`;
    text += `💵 *Nominal:* ${formatRupiah(defaultNominalKas)} / anggota\n`;
    text += `----------------------------------------\n`;
    text += `📊 *RINGKASAN:* \n`;
    text += `• Total Warga: ${anggotaList.length} Orang\n`;
    text += `• ✅ Sudah Bayar: ${lunasCount} Orang (${formatRupiah(pemasukanKasBulanIni)})\n`;
    text += `• ⏳ Belum Bayar: ${belumLunasCount} Orang\n`;
    text += `• 📈 Capaian: ${percentLunas}%\n`;
    text += `----------------------------------------\n\n`;

    text += `✅ *SUDAH BAYAR (LUNAS):*\n`;
    if (lunasList.length === 0) {
      text += `_(Belum ada yang membayar)_\n`;
    } else {
      lunasList.forEach((a, idx) => {
        const tx = paidAnggotaMap.get(a.id_anggota);
        text += `${idx + 1}. ${a.nama} - ${formatRupiah(tx ? tx.jumlah : defaultNominalKas)}\n`;
      });
    }

    text += `\n⏳ *BELUM BAYAR:*\n`;
    if (belumList.length === 0) {
      text += `🎉 _Alhamdulillah semua warga sudah lunas!_\n`;
    } else {
      belumList.forEach((a, idx) => {
        text += `${idx + 1}. ${a.nama} (Tagihan: ${formatRupiah(defaultNominalKas)})\n`;
      });
    }

    text += `\n----------------------------------------\n`;
    text += `👤 *Bendahara:* ${settings.nama_bendahara || 'Bendahara RT 04'}\n`;
    if (settings.rekening_kas) {
      text += `💳 *Rekening Kas:* ${settings.rekening_kas}\n`;
    }
    text += `_Terima kasih atas kerja sama dan kekompakannya!_`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Laporan Kas ${selectedPeriode}`,
          text: text
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 3000);
    } catch {}

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Action: Download PDF
  const handleDownloadPDF = () => {
    const doc = generateLaporanKasAnggotaPDF({
      judul: `LAPORAN STATUS PEMBAYARAN KAS PERIODE ${selectedPeriode.toUpperCase()}`,
      periode: selectedPeriode,
      namaRT: settings.nama_rt || 'RT 04 / RW 02',
      namaBendahara: settings.nama_bendahara || 'Siti Rahmawati',
      nominalWajib: defaultNominalKas,
      totalAnggota: anggotaList.length,
      totalLunas: lunasCount,
      totalBelum: belumLunasCount,
      totalNominalTerkumpul: pemasukanKasBulanIni,
      totalNominalBelum: belumLunasCount * defaultNominalKas,
      anggotaList: filteredAnggota.map((a, idx) => {
        const tx = paidAnggotaMap.get(a.id_anggota);
        return {
          no: idx + 1,
          nama: a.nama,
          id_anggota: a.id_anggota,
          statusAnggota: a.status,
          statusBayar: tx ? 'LUNAS' : 'BELUM',
          nominal: tx ? tx.jumlah : 0,
          tanggalBayar: tx ? tx.tanggal : '',
          keterangan: tx ? (tx.keterangan || '') : ''
        };
      })
    });

    doc.save(`Laporan_Kas_${selectedPeriode.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div id="kas-view-container" className="space-y-4 sm:space-y-6">
      {/* Header & Periode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Kas Utama RT 04
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Iuran rutin {formatRupiah(defaultNominalKas)} / bulan per anggota
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <select
              id="kas-periode-select"
              value={selectedPeriode}
              onChange={e => setSelectedPeriode(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
            >
              {periodeOptions.map(p => (
                <option key={p} value={p} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <button
            id="open-multiselect-kas-btn"
            onClick={() => onOpenMultiSelectKas(selectedPeriode)}
            disabled={!isOnline}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Bayar Kas Massal</span>
          </button>

          <button
            id="open-pengeluaran-kas-btn"
            onClick={() => onOpenPengeluaranKas(selectedPeriode)}
            disabled={!isOnline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 disabled:opacity-50 font-semibold text-xs transition-all cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4 text-slate-700" />
            <span className="hidden sm:inline">Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Monthly Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Terkumpul Periode Ini</span>
          <p className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
            {formatRupiah(pemasukanKasBulanIni)}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${percentLunas}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {percentLunas}% target ({formatRupiah(targetPemasukan)})
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Pengeluaran Periode Ini</span>
          <p className="text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
            {formatRupiah(pengeluaranKasBulanIni)}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 truncate">
            Operasional {selectedPeriode}
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Sudah Bayar</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300">
              {lunasCount}
            </p>
            <span className="text-xs text-slate-500">Org</span>
            <CheckCircle className="w-4 h-4 text-slate-500 ml-auto hidden sm:block" />
          </div>
          <p className="text-[10px] text-slate-700/80 mt-1 font-medium truncate">
            Total {formatRupiah(pemasukanKasBulanIni)}
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Belum Bayar</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300">
              {belumLunasCount}
            </p>
            <span className="text-xs text-slate-500">Org</span>
            <Clock className="w-4 h-4 text-slate-500 ml-auto hidden sm:block" />
          </div>
          <p className="text-[10px] text-slate-700/80 mt-1 font-medium truncate">
            Tagihan {formatRupiah(belumLunasCount * defaultNominalKas)}
          </p>
        </div>
      </div>

      {/* Member Payment Status Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              Status Pembayaran ({selectedPeriode})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-anggota-kas-input"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nama anggota..."
                className="w-full sm:w-44 pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({anggotaList.length})
              </button>
              <button
                onClick={() => setStatusFilter('lunas')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'lunas'
                    ? 'bg-slate-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Lunas ({lunasCount})
              </button>
              <button
                onClick={() => setStatusFilter('belum')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'belum'
                    ? 'bg-slate-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Belum ({belumLunasCount})
              </button>
            </div>

            {/* Quick Export / Share buttons in KasView */}
            <div className="flex items-center gap-1.5">
              <button
                id="kas-share-wa-btn"
                onClick={handleShareWA}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                title="Salin laporan status iuran ke WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{waCopied ? 'Tersalin!' : 'Laporan WA'}</span>
              </button>

              <button
                id="kas-download-pdf-btn"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                title="Cetak/Unduh PDF status kas"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Card List */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredAnggota.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400 text-xs">
              {anggotaList.length === 0
                ? 'Belum ada anggota terdaftar. Tambahkan anggota terlebih dahulu.'
                : 'Tidak ada data anggota yang sesuai dengan filter.'}
            </div>
          ) : (
            filteredAnggota.map(a => {
              const tx = paidAnggotaMap.get(a.id_anggota);
              const isPaid = !!tx;

              return (
                <div key={a.id_anggota} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {a.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{a.nama}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{a.id_anggota}</p>
                      </div>
                    </div>

                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" /> Belum
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span>
                      {isPaid && tx ? `Dibayar: ${formatDate(tx.tanggal)} (${formatRupiah(tx.jumlah)})` : `Tagihan: ${formatRupiah(defaultNominalKas)}`}
                    </span>

                    {isPaid && tx ? (
                      <button
                        onClick={() => onDeleteTransaksiKas(tx.id_transaksi)}
                        className="text-slate-500 hover:text-slate-700 text-[10px] p-1 cursor-pointer"
                        title="Batalkan pembayaran"
                      >
                        Batal Kas
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenMultiSelectKas(selectedPeriode)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold text-[10px] cursor-pointer"
                      >
                        Bayar Kas
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">ID & Nama Anggota</th>
                <th className="px-4 py-3">Status Anggota</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status Kas</th>
                <th className="px-4 py-3">Tanggal Bayar</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAnggota.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada data anggota yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredAnggota.map(a => {
                  const tx = paidAnggotaMap.get(a.id_anggota);
                  const isPaid = !!tx;

                  return (
                    <tr
                      key={a.id_anggota}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        <div>
                          <p className="font-semibold">{a.nama}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{a.id_anggota}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.status === 'Aktif'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                        {selectedPeriode}
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Belum Lunas
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {isPaid && tx ? formatDate(tx.tanggal) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {isPaid && tx ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-slate-700 dark:text-slate-300">
                              {formatRupiah(tx.jumlah)}
                            </span>
                            <button
                              onClick={() => onDeleteTransaksiKas(tx.id_transaksi)}
                              className="text-slate-500 hover:text-slate-700 text-[10px] ml-1 p-1 hover:bg-slate-100 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                              title="Hapus / Batalkan catatan kas ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            {formatRupiah(0)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
