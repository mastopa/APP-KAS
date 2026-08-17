import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatDate } from './formatters';

export interface RekapExportData {
  judul: string;
  periodeInfo: string;
  kategoriNama: string;
  totalMasuk: number;
  totalKeluar: number;
  saldoBersih: number;
  namaRT: string;
  namaBendahara: string;
  transaksi: Array<{
    no: number;
    tanggal: string;
    kategori: string;
    anggota: string;
    keterangan: string;
    jenis: 'masuk' | 'keluar';
    jumlah: number;
  }>;
}

export function generateRekapPDF(data: RekapExportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Resmi Remaja RT 04
  doc.setFillColor(37, 99, 235); // primary blue
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KAS & IURAN REMAJA', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.namaRT || 'PENGURUS REMAJA RT 04 / RW 02'}`, pageWidth / 2, 17, { align: 'center' });

  // 2. Info Dokumen
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.judul, 14, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Kategori: ${data.kategoriNama}`, 14, 36);
  doc.text(`Periode: ${data.periodeInfo}`, 14, 41);
  doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 36, { align: 'right' });

  // 3. Ringkasan Finansial Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 46, pageWidth - 28, 20, 2, 2, 'FD');

  const cardThird = (pageWidth - 28) / 3;

  // Pemasukan
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN', 20, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // green
  doc.text(formatRupiah(data.totalMasuk), 20, 60);

  // Pengeluaran
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN', 14 + cardThird + 6, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // red
  doc.text(formatRupiah(data.totalKeluar), 14 + cardThird + 6, 60);

  // Saldo
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('SALDO BERSIH', 14 + (cardThird * 2) + 6, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // blue
  doc.text(formatRupiah(data.saldoBersih), 14 + (cardThird * 2) + 6, 60);

  // 4. Tabel Transaksi
  const tableRows = data.transaksi.map((t, idx) => [
    idx + 1,
    formatDate(t.tanggal),
    t.kategori,
    t.anggota || '-',
    t.keterangan || '-',
    t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
    formatRupiah(t.jumlah)
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['No', 'Tanggal', 'Kategori', 'Anggota', 'Keterangan', 'Jenis', 'Nominal']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 5) {
        if (hookData.cell.raw === 'Pemasukan') {
          hookData.cell.styles.textColor = [22, 163, 74];
        } else {
          hookData.cell.styles.textColor = [220, 38, 38];
        }
      }
    }
  });

  // 5. Tanda Tangan
  // @ts-ignore
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const signatureY = finalY > 230 ? 250 : finalY + 18;

  if (signatureY < 265) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    // Left side: Ketua
    doc.text('Mengetahui,', 25, signatureY);
    doc.text('Ketua Remaja RT 04', 25, signatureY + 5);
    doc.text('( .................................... )', 25, signatureY + 28);

    // Right side: Bendahara
    doc.text('Dibuat oleh,', pageWidth - 65, signatureY);
    doc.text('Bendahara Remaja', pageWidth - 65, signatureY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${data.namaBendahara || 'Siti Rahmawati'} )`, pageWidth - 65, signatureY + 28);
  }

  return doc;
}

export interface LaporanKasAnggotaExportData {
  judul: string;
  periode: string;
  namaRT: string;
  namaBendahara: string;
  nominalWajib: number;
  totalAnggota: number;
  totalLunas: number;
  totalBelum: number;
  totalNominalTerkumpul: number;
  totalNominalBelum: number;
  anggotaList: Array<{
    no: number;
    nama: string;
    id_anggota: string;
    statusAnggota: string;
    statusBayar: 'LUNAS' | 'BELUM';
    nominal: number;
    tanggalBayar: string;
    keterangan: string;
  }>;
}

export function generateLaporanKasAnggotaPDF(data: LaporanKasAnggotaExportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header
  doc.setFillColor(37, 99, 235); // Blue
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN STATUS PEMBAYARAN KAS UTAMA', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.namaRT || 'PENGURUS REMAJA RT 04 / RW 02', pageWidth / 2, 17, { align: 'center' });

  // 2. Info Laporan
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.judul, 14, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${data.periode}`, 14, 36);
  doc.text(`Iuran Wajib: ${formatRupiah(data.nominalWajib)} / orang`, 14, 41);
  doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 36, { align: 'right' });

  // 3. Ringkasan Status Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 46, pageWidth - 28, 20, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 4;

  // Total Anggota
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL WARGA', 18, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${data.totalAnggota} Orang`, 18, 60);

  // Sudah Bayar
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('SUDAH BAYAR', 14 + colWidth + 4, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`${data.totalLunas} Orang (${formatRupiah(data.totalNominalTerkumpul)})`, 14 + colWidth + 4, 60);

  // Belum Bayar
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('BELUM BAYAR', 14 + (colWidth * 2) + 4, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(`${data.totalBelum} Orang (${formatRupiah(data.totalNominalBelum)})`, 14 + (colWidth * 2) + 4, 60);

  // Persentase Capaian
  const percent = data.totalAnggota > 0 ? Math.round((data.totalLunas / data.totalAnggota) * 100) : 0;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('PERSENTASE', 14 + (colWidth * 3) + 4, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text(`${percent}% Tercapai`, 14 + (colWidth * 3) + 4, 60);

  // 4. Tabel Anggota
  const tableRows = data.anggotaList.map((a, idx) => [
    idx + 1,
    a.nama,
    a.statusAnggota || 'Aktif',
    data.periode,
    a.statusBayar === 'LUNAS' ? 'Lunas' : 'Belum Bayar',
    formatRupiah(a.nominal),
    a.tanggalBayar ? formatDate(a.tanggalBayar) : '-'
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['No', 'Nama Anggota', 'Status', 'Periode', 'Status Bayar', 'Nominal', 'Tanggal Bayar']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25 },
      4: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28 }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 4) {
        if (hookData.cell.raw === 'Lunas') {
          hookData.cell.styles.textColor = [22, 163, 74];
        } else {
          hookData.cell.styles.textColor = [220, 38, 38];
        }
      }
    }
  });

  // 5. Tanda Tangan
  // @ts-ignore
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const signatureY = finalY > 230 ? 250 : finalY + 18;

  if (signatureY < 265) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    // Left side: Ketua
    doc.text('Mengetahui,', 25, signatureY);
    doc.text('Ketua Remaja RT 04', 25, signatureY + 5);
    doc.text('( .................................... )', 25, signatureY + 28);

    // Right side: Bendahara
    doc.text('Dibuat oleh,', pageWidth - 65, signatureY);
    doc.text('Bendahara Remaja', pageWidth - 65, signatureY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`( ${data.namaBendahara || 'Siti Rahmawati'} )`, pageWidth - 65, signatureY + 28);
  }

  return doc;
}
