import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Share2,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MessageCircle,
  Copy,
  BookOpen
} from 'lucide-react';
import { Kategori, TransaksiKas, TransaksiLain, Anggota } from '../types';
import { formatRupiah, formatDate, getPeriodeOptions, getCurrentPeriodeBulan } from '../utils/formatters';
import { generateRekapPDF, generateLaporanKasAnggotaPDF } from '../utils/pdfExport';

interface RekapViewProps {
  kategoriList: Kategori[];
  transaksiKasList: (TransaksiKas & { nama_anggota?: string })[];
  transaksiLainList: (TransaksiLain & { nama_anggota?: string; nama_kategori?: string })[];
  anggotaList: Anggota[];
  settings: Record<string, string>;
}

export const RekapView: React.FC<RekapViewProps> = ({
  kategoriList,
  transaksiKasList,
  transaksiLainList,
  anggotaList,
  settings
}) => {
  // Mode: 'kas_anggota' (Laporan Pembayaran Kas per Anggota) or 'buku_kas' (Buku Kas & Riwayat Mutasi)
  const [activeReportMode, setActiveReportMode] = useState<'kas_anggota' | 'buku_kas'>('kas_anggota');

  // State for Laporan Pembayaran Kas per Anggota
  const [selectedKasPeriode, setSelectedKasPeriode] = useState<string>(getCurrentPeriodeBulan());
  const [kasStatusFilter, setKasStatusFilter] = useState<'all' | 'lunas' | 'belum'>('all');
  const [kasSearchTerm, setKasSearchTerm] = useState<string>('');
  const [waReportCopied, setWaReportCopied] = useState<boolean>(false);

  // State for Buku Kas & Mutasi
  const [selectedKategoriId, setSelectedKategoriId] = useState<string>('all');
  const [selectedMutasiPeriode, setSelectedMutasiPeriode] = useState<string>('all');
  const [tanggalMulai, setTanggalMulai] = useState<string>('');
  const [tanggalSelesai, setTanggalSelesai] = useState<string>('');
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const periodeOptions = getPeriodeOptions(1, 1);
  const nominalKasDefault = Number(settings.nominal_kas_bulanan) || 10000;

  // =========================================================================
  // 1. DATA PROCESSING: LAPORAN PEMBAYARAN KAS PER ANGGOTA
  // =========================================================================
  const kasTransactionsForPeriod = useMemo(() => {
    return transaksiKasList.filter(
      t => t.periode_bulan.toLowerCase() === selectedKasPeriode.toLowerCase() && t.jenis === 'masuk'
    );
  }, [transaksiKasList, selectedKasPeriode]);

  const paidKasMap = useMemo(() => {
    const map = new Map<string, TransaksiKas & { nama_anggota?: string }>();
    for (const t of kasTransactionsForPeriod) {
      if (t.id_anggota) {
        map.set(t.id_anggota, t);
      }
    }
    return map;
  }, [kasTransactionsForPeriod]);

  const anggotaStatusList = useMemo(() => {
    return anggotaList.map(a => {
      const tx = paidKasMap.get(a.id_anggota);
      const isLunas = !!tx;
      const nominal = tx ? Number(tx.jumlah || 0) : 0;
      const tanggalBayar = tx?.tanggal || '';
      const keterangan = tx?.keterangan || '';

      return {
        id_anggota: a.id_anggota,
        nama: a.nama,
        statusAnggota: a.status,
        no_telepon: a.no_telepon,
        alamat: a.alamat,
        isLunas,
        nominal,
        tanggalBayar,
        keterangan,
        txId: tx?.id_transaksi
      };
    });
  }, [anggotaList, paidKasMap]);

  // Statistics for Kas Anggota in selected period
  const totalAnggota = anggotaStatusList.length;
  const lunasAnggotaList = anggotaStatusList.filter(a => a.isLunas);
  const belumLunasAnggotaList = anggotaStatusList.filter(a => !a.isLunas);

  const totalLunasCount = lunasAnggotaList.length;
  const totalBelumCount = belumLunasAnggotaList.length;

  const totalNominalTerkumpul = lunasAnggotaList.reduce((sum, a) => sum + a.nominal, 0);
  const totalNominalBelum = totalBelumCount * nominalKasDefault;
  const targetTotalKas = totalAnggota * nominalKasDefault;
  const percentCapaian = targetTotalKas > 0 ? Math.min(100, Math.round((totalNominalTerkumpul / targetTotalKas) * 100)) : 0;

  // Filtered member list for display
  const filteredAnggotaStatus = useMemo(() => {
    return anggotaStatusList.filter(a => {
      const matchesSearch =
        a.nama.toLowerCase().includes(kasSearchTerm.toLowerCase()) ||
        a.id_anggota.toLowerCase().includes(kasSearchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (kasStatusFilter === 'lunas') return a.isLunas;
      if (kasStatusFilter === 'belum') return !a.isLunas;
      return true;
    });
  }, [anggotaStatusList, kasSearchTerm, kasStatusFilter]);

  // =========================================================================
  // 2. DATA PROCESSING: BUKU KAS & MUTASI UMUM
  // =========================================================================
  const combinedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      source: 'kas' | 'lain';
      id_kategori: string;
      kategori_nama: string;
      id_anggota?: string;
      nama_anggota?: string;
      periode?: string;
      jumlah: number;
      jenis: 'masuk' | 'keluar';
      tanggal: string;
      keterangan?: string;
    }> = [];

    // Kas transactions
    for (const t of transaksiKasList) {
      list.push({
        id: t.id_transaksi,
        source: 'kas',
        id_kategori: 'KAT-KAS-01',
        kategori_nama: 'Kas Utama RT 04',
        id_anggota: t.id_anggota,
        nama_anggota: t.nama_anggota || (t.jenis === 'keluar' ? 'Pengeluaran Kas RT' : 'Umum'),
        periode: t.periode_bulan,
        jumlah: t.jumlah,
        jenis: t.jenis,
        tanggal: t.tanggal,
        keterangan: t.keterangan
      });
    }

    // Lain transactions
    for (const t of transaksiLainList) {
      list.push({
        id: t.id_transaksi,
        source: 'lain',
        id_kategori: t.id_kategori,
        kategori_nama: t.nama_kategori || 'Iuran Lain',
        id_anggota: t.id_anggota,
        nama_anggota: t.nama_anggota || (t.jenis === 'keluar' ? 'Pengeluaran Pos Kegiatan' : 'Umum'),
        periode: undefined,
        jumlah: t.jumlah,
        jenis: t.jenis,
        tanggal: t.tanggal,
        keterangan: t.keterangan
      });
    }

    // Apply filters
    return list.filter(t => {
      // Filter Kategori
      if (selectedKategoriId !== 'all') {
        if (selectedKategoriId === 'kas_utama' && t.source !== 'kas') return false;
        if (selectedKategoriId !== 'kas_utama' && t.id_kategori !== selectedKategoriId) return false;
      }

      // Filter Periode (specifically for kas)
      if (selectedMutasiPeriode !== 'all') {
        if (t.periode && t.periode.toLowerCase() !== selectedMutasiPeriode.toLowerCase()) return false;
      }

      // Filter Tanggal
      if (tanggalMulai && t.tanggal < tanggalMulai) return false;
      if (tanggalSelesai && t.tanggal > tanggalSelesai) return false;

      return true;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [transaksiKasList, transaksiLainList, selectedKategoriId, selectedMutasiPeriode, tanggalMulai, tanggalSelesai]);

  const totalPemasukan = combinedTransactions
    .filter(t => t.jenis === 'masuk')
    .reduce((s, t) => s + t.jumlah, 0);

  const totalPengeluaran = combinedTransactions
    .filter(t => t.jenis === 'keluar')
    .reduce((s, t) => s + t.jumlah, 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  const currentKategoriName = selectedKategoriId === 'all'
    ? 'Semua Pos Keuangan'
    : selectedKategoriId === 'kas_utama'
    ? 'Kas Utama RT 04'
    : kategoriList.find(k => k.id_kategori === selectedKategoriId)?.nama_kategori || 'Kategori';

  // =========================================================================
  // ACTIONS: EXPORT & SHARE LAPORAN KAS ANGGOTA
  // =========================================================================

  // 1. WhatsApp Report Format for Members
  const handleShareKasAnggotaWA = async () => {
    let reportText = `📢 *LAPORAN PEMBAYARAN IURAN KAS UTAMA*\n`;
    reportText += `🏡 *${settings.nama_organisasi || 'Karang Taruna / Remaja RT 04'}*\n`;
    reportText += `📍 *${settings.nama_rt || 'RT 04 / RW 02'}*\n`;
    reportText += `🗓️ *Periode:* ${selectedKasPeriode}\n`;
    reportText += `💵 *Iuran Wajib:* ${formatRupiah(nominalKasDefault)} / orang\n`;
    reportText += `----------------------------------------\n`;
    reportText += `📊 *RINGKASAN:* \n`;
    reportText += `• Total Anggota: ${totalAnggota} Orang\n`;
    reportText += `• ✅ Sudah Bayar (Lunas): ${totalLunasCount} Orang (${formatRupiah(totalNominalTerkumpul)})\n`;
    reportText += `• ⏳ Belum Bayar: ${totalBelumCount} Orang (${formatRupiah(totalNominalBelum)})\n`;
    reportText += `• 📈 Capaian: ${percentCapaian}% (${formatRupiah(totalNominalTerkumpul)} / ${formatRupiah(targetTotalKas)})\n`;
    reportText += `----------------------------------------\n\n`;

    reportText += `✅ *DAFTAR SUDAH BAYAR (LUNAS):*\n`;
    if (lunasAnggotaList.length === 0) {
      reportText += `_(Belum ada yang membayar)_\n`;
    } else {
      lunasAnggotaList.forEach((a, idx) => {
        reportText += `${idx + 1}. ${a.nama} - ${formatRupiah(a.nominal)} (${a.tanggalBayar ? formatDate(a.tanggalBayar) : 'Lunas'})\n`;
      });
    }

    reportText += `\n⏳ *DAFTAR BELUM BAYAR:*\n`;
    if (belumLunasAnggotaList.length === 0) {
      reportText += `🎉 _Alhamdulillah semua anggota sudah lunas!_\n`;
    } else {
      belumLunasAnggotaList.forEach((a, idx) => {
        reportText += `${idx + 1}. ${a.nama} (Tagihan: ${formatRupiah(nominalKasDefault)})\n`;
      });
    }

    reportText += `\n----------------------------------------\n`;
    reportText += `👤 *Bendahara:* ${settings.nama_bendahara || 'Bendahara RT 04'}\n`;
    if (settings.rekening_kas) {
      reportText += `💳 *Rekening Kas:* ${settings.rekening_kas}\n`;
    }
    reportText += `_Terima kasih atas partisipasi dan kebersamaan seluruh rekan remaja RT 04!_`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Laporan Kas Utama - ${selectedKasPeriode}`,
          text: reportText
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(reportText);
      setWaReportCopied(true);
      setTimeout(() => setWaReportCopied(false), 3000);
    } catch {}

    const waUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(waUrl, '_blank');
  };

  // 2. Download PDF Laporan Kas Anggota
  const handleDownloadPDFKasAnggota = () => {
    const doc = generateLaporanKasAnggotaPDF({
      judul: `LAPORAN STATUS PEMBAYARAN KAS PERIODE ${selectedKasPeriode.toUpperCase()}`,
      periode: selectedKasPeriode,
      namaRT: settings.nama_rt || 'RT 04 / RW 02',
      namaBendahara: settings.nama_bendahara || 'Siti Rahmawati',
      nominalWajib: nominalKasDefault,
      totalAnggota,
      totalLunas: totalLunasCount,
      totalBelum: totalBelumCount,
      totalNominalTerkumpul,
      totalNominalBelum,
      anggotaList: filteredAnggotaStatus.map((a, idx) => ({
        no: idx + 1,
        nama: a.nama,
        id_anggota: a.id_anggota,
        statusAnggota: a.statusAnggota,
        statusBayar: a.isLunas ? 'LUNAS' : 'BELUM',
        nominal: a.nominal,
        tanggalBayar: a.tanggalBayar,
        keterangan: a.keterangan
      }))
    });

    doc.save(`Laporan_Kas_Anggota_${selectedKasPeriode.replace(/\s+/g, '_')}.pdf`);
  };

  // 3. Download CSV Laporan Kas Anggota
  const handleDownloadCSVKasAnggota = () => {
    const headers = ['No', 'ID Anggota', 'Nama Anggota', 'Status Anggota', 'Periode', 'Status Bayar', 'Nominal Bayar (Rp)', 'Tanggal Bayar', 'Keterangan'];
    const rows = filteredAnggotaStatus.map((a, idx) => [
      idx + 1,
      a.id_anggota,
      `"${a.nama}"`,
      a.statusAnggota,
      `"${selectedKasPeriode}"`,
      a.isLunas ? 'Lunas' : 'Belum Bayar',
      a.nominal,
      a.tanggalBayar ? `"${a.tanggalBayar}"` : '-',
      `"${(a.keterangan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kas_Anggota_${selectedKasPeriode.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // ACTIONS: EXPORT & SHARE BUKU KAS / MUTASI
  // =========================================================================
  const handleDownloadPDFMutasi = () => {
    const doc = generateRekapPDF({
      judul: `LAPORAN REKAP KEUANGAN ${currentKategoriName.toUpperCase()}`,
      periodeInfo: selectedMutasiPeriode !== 'all' ? selectedMutasiPeriode : (tanggalMulai ? `${tanggalMulai} s/d ${tanggalSelesai || 'Sekarang'}` : 'Semua Periode'),
      kategoriNama: currentKategoriName,
      totalMasuk: totalPemasukan,
      totalKeluar: totalPengeluaran,
      saldoBersih: saldoBersih,
      namaRT: settings.nama_rt || 'RT 04 / RW 02 Sukamaju',
      namaBendahara: settings.nama_bendahara || 'Siti Rahmawati',
      transaksi: combinedTransactions.map((t, idx) => ({
        no: idx + 1,
        tanggal: t.tanggal,
        kategori: t.kategori_nama,
        anggota: t.nama_anggota || '-',
        keterangan: t.keterangan || '-',
        jenis: t.jenis,
        jumlah: t.jumlah
      }))
    });

    doc.save(`Rekap_Keuangan_RT04_${currentKategoriName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadCSVMutasi = () => {
    const headers = ['No', 'ID Transaksi', 'Tanggal', 'Kategori', 'Nama Anggota', 'Periode', 'Jenis', 'Nominal', 'Keterangan'];
    const rows = combinedTransactions.map((t, idx) => [
      idx + 1,
      t.id,
      t.tanggal,
      `"${t.kategori_nama}"`,
      `"${t.nama_anggota || '-'}"`,
      `"${t.periode || '-'}"`,
      t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
      t.jumlah,
      `"${(t.keterangan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Keuangan_RT04_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareMutasiWA = async () => {
    const text = `📊 *REKAP KEUANGAN REMAJA ${settings.nama_rt || 'RT 04 / RW 02'}*\n` +
      `📅 *Kategori:* ${currentKategoriName}\n` +
      `----------------------------------------\n` +
      `🟢 *Total Pemasukan:* ${formatRupiah(totalPemasukan)}\n` +
      `🔴 *Total Pengeluaran:* ${formatRupiah(totalPengeluaran)}\n` +
      `💰 *Saldo Akhir:* ${formatRupiah(saldoBersih)}\n` +
      `----------------------------------------\n` +
      `📝 *Jumlah Transaksi:* ${combinedTransactions.length} mutasi\n` +
      `👤 *Bendahara:* ${settings.nama_bendahara || 'Bendahara RT 04'}\n` +
      `_Laporan resmi dibuat otomatis via Sistem Kas Remaja RT 04_`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rekap Keuangan Remaja RT 04`,
          text: text
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {}

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div id="rekap-view-container" className="space-y-4 sm:space-y-6">
      {/* Header & Mode Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Laporan & Rekapitulasi Kas
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Pantau status pembayaran kas tiap anggota per periode dan mutasi keuangan RT 04
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Laporan Kas Anggota vs Buku Kas & Mutasi */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-md">
          <button
            id="tab-laporan-kas-anggota-btn"
            onClick={() => setActiveReportMode('kas_anggota')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeReportMode === 'kas_anggota'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Status Pembayaran Anggota</span>
          </button>

          <button
            id="tab-laporan-buku-kas-btn"
            onClick={() => setActiveReportMode('buku_kas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeReportMode === 'buku_kas'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Buku Kas & Mutasi</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: LAPORAN PEMBAYARAN KAS PER ANGGOTA                          */}
      {/* ========================================================================= */}
      {activeReportMode === 'kas_anggota' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Filter & Action Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Periode Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Periode Kas:</span>
                  <select
                    id="laporan-kas-periode-select"
                    value={selectedKasPeriode}
                    onChange={e => setSelectedKasPeriode(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {periodeOptions.map(p => (
                      <option key={p} value={p} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Iuran Wajib: <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(nominalKasDefault)}</span> / warga
                </div>
              </div>

              {/* Export and Announcement Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="share-wa-laporan-anggota-btn"
                  onClick={handleShareKasAnggotaWA}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                  title="Salin dan kirim format laporan status iuran ke grup WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{waReportCopied ? 'Teks Tersalin!' : 'Format Laporan WA'}</span>
                </button>

                <button
                  id="pdf-laporan-anggota-btn"
                  onClick={handleDownloadPDFKasAnggota}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                  title="Unduh laporan status kas per anggota dalam format PDF resmi"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  id="csv-laporan-anggota-btn"
                  onClick={handleDownloadCSVKasAnggota}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-all cursor-pointer"
                  title="Ekspor data status pembayaran ke spreadsheet Excel/CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel/CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Statistics Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Terkumpul Periode Ini</span>
              <p className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                {formatRupiah(totalNominalTerkumpul)}
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${percentCapaian}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {percentCapaian}% dari target {formatRupiah(targetTotalKas)}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Sudah Membayar</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300">
                  {totalLunasCount}
                </p>
                <span className="text-xs text-slate-500">/ {totalAnggota} Warga</span>
                <CheckCircle2 className="w-4 h-4 text-slate-500 ml-auto hidden sm:block" />
              </div>
              <p className="text-[10px] text-slate-700/80 mt-1 font-medium truncate">
                Total {formatRupiah(totalNominalTerkumpul)}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Belum Membayar</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300">
                  {totalBelumCount}
                </p>
                <span className="text-xs text-slate-500">Warga</span>
                <Clock className="w-4 h-4 text-slate-500 ml-auto hidden sm:block" />
              </div>
              <p className="text-[10px] text-slate-700/80 mt-1 font-medium truncate">
                Tagihan {formatRupiah(totalNominalBelum)}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">Iuran per Anggota</span>
              <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {formatRupiah(nominalKasDefault)}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 truncate">
                Rutin bulanan RT 04
              </p>
            </div>
          </div>

          {/* Member Payment Status Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Search & Status Filter Controls */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Daftar Warga & Status Iuran ({selectedKasPeriode})
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="search-laporan-anggota-input"
                    type="text"
                    value={kasSearchTerm}
                    onChange={e => setKasSearchTerm(e.target.value)}
                    placeholder="Cari nama anggota..."
                    className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start sm:self-auto">
                  <button
                    onClick={() => setKasStatusFilter('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      kasStatusFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua ({totalAnggota})
                  </button>
                  <button
                    onClick={() => setKasStatusFilter('lunas')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      kasStatusFilter === 'lunas'
                        ? 'bg-slate-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Lunas ({totalLunasCount})
                  </button>
                  <button
                    onClick={() => setKasStatusFilter('belum')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      kasStatusFilter === 'belum'
                        ? 'bg-slate-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Belum ({totalBelumCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile View: Card List */}
            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAnggotaStatus.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400 text-xs">
                  {totalAnggota === 0
                    ? 'Belum ada anggota terdaftar.'
                    : 'Tidak ada data anggota yang sesuai dengan filter.'}
                </div>
              ) : (
                filteredAnggotaStatus.map((a, idx) => (
                  <div key={a.id_anggota} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">{a.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{a.id_anggota}</p>
                        </div>
                      </div>

                      <div>
                        {a.isLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> Belum Bayar
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">
                        {a.isLunas
                          ? `Tgl: ${formatDate(a.tanggalBayar)}`
                          : `Tagihan: ${formatRupiah(nominalKasDefault)}`}
                      </span>
                      <span className={`font-bold ${a.isLunas ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                        {formatRupiah(a.nominal)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama Anggota</th>
                    <th className="px-4 py-3">Status Anggota</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Status Pembayaran</th>
                    <th className="px-4 py-3 text-right">Nominal Bayar</th>
                    <th className="px-4 py-3">Tanggal Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAnggotaStatus.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Tidak ada data anggota yang sesuai dengan filter
                      </td>
                    </tr>
                  ) : (
                    filteredAnggotaStatus.map((a, idx) => (
                      <tr
                        key={a.id_anggota}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                              {a.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{a.nama}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{a.id_anggota}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.statusAnggota === 'Aktif'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {a.statusAnggota}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {selectedKasPeriode}
                        </td>
                        <td className="px-4 py-3">
                          {a.isLunas ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Belum Bayar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span className={a.isLunas ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                            {formatRupiah(a.nominal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {a.tanggalBayar ? formatDate(a.tanggalBayar) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: BUKU KAS & MUTASI KEUANGAN UMUM                            */}
      {/* ========================================================================= */}
      {activeReportMode === 'buku_kas' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Filter Section Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Buku Kas</span>
              </div>

              {/* Mutasi Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="rekap-mutasi-download-pdf-btn"
                  onClick={handleDownloadPDFMutasi}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  id="rekap-mutasi-download-csv-btn"
                  onClick={handleDownloadCSVMutasi}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel/CSV</span>
                </button>

                <button
                  id="rekap-mutasi-share-whatsapp-btn"
                  onClick={handleShareMutasiWA}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{shareCopied ? 'Tersalin!' : 'Bagikan WA'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Dropdown Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Pos
                </label>
                <select
                  id="rekap-filter-kategori"
                  value={selectedKategoriId}
                  onChange={e => setSelectedKategoriId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Pos Keuangan</option>
                  <option value="kas_utama">Kas Utama RT 04 Saja</option>
                  {kategoriList
                    .filter(k => !k.is_kas_utama)
                    .map(k => (
                      <option key={k.id_kategori} value={k.id_kategori}>
                        {k.nama_kategori}
                      </option>
                    ))}
                </select>
              </div>

              {/* Periode Bulan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Periode Bulan (Kas)
                </label>
                <select
                  id="rekap-filter-periode"
                  value={selectedMutasiPeriode}
                  onChange={e => setSelectedMutasiPeriode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Periode</option>
                  {periodeOptions.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Mulai */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={e => setTanggalMulai(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Tanggal Selesai */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={e => setTanggalSelesai(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reset filter button */}
            {(selectedKategoriId !== 'all' || selectedMutasiPeriode !== 'all' || tanggalMulai || tanggalSelesai) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSelectedKategoriId('all');
                    setSelectedMutasiPeriode('all');
                    setTanggalMulai('');
                    setTanggalSelesai('');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>

          {/* Financial Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Total Pemasukan</span>
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">
                {formatRupiah(totalPemasukan)}
              </p>
              <p className="text-xs text-slate-700/80 mt-1">Hasil filter mutasi</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Total Pengeluaran</span>
                <div className="p-2 rounded-xl bg-slate-800 text-white">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">
                {formatRupiah(totalPengeluaran)}
              </p>
              <p className="text-xs text-slate-700/80 mt-1">Biaya & belanja tercatat</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Saldo Bersih Tersisa</span>
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">
                {formatRupiah(saldoBersih)}
              </p>
              <p className="text-xs text-blue-600/80 mt-1">Surplus / Sisa Kas</p>
            </div>
          </div>

          {/* Transaction Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Rincian Transaksi ({combinedTransactions.length} Mutasi)
              </h3>
              <span className="text-xs text-slate-400">Arsip pembukuan RT 04</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Anggota / Keterangan</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {combinedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        Tidak ada transaksi pada filter yang dipilih
                      </td>
                    </tr>
                  ) : (
                    combinedTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                          {formatDate(tx.tanggal)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {tx.kategori_nama}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <p className="font-medium text-slate-900 dark:text-white">{tx.nama_anggota || '-'}</p>
                          {tx.keterangan && <p className="text-[11px] text-slate-400">{tx.keterangan}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {tx.periode || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.jenis === 'masuk'
                                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                            }`}
                          >
                            {tx.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            tx.jenis === 'masuk' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.jenis === 'masuk' ? '+' : '-'} {formatRupiah(tx.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
