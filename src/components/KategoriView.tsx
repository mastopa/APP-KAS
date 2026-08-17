import React, { useState } from 'react';
import {
  FolderKanban,
  Lock,
  PlusCircle,
  Edit2,
  Trash2,
  Coins,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Kategori, TransaksiKas, TransaksiLain, Anggota, DashboardStats } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';
import { KategoriDetailView } from './KategoriDetailView';

interface KategoriViewProps {
  kategoriList: Kategori[];
  transaksiLainList: (TransaksiLain & { nama_anggota?: string; nama_kategori?: string })[];
  transaksiKasList?: (TransaksiKas & { nama_anggota?: string })[];
  anggotaList: Anggota[];
  dashboardStats?: DashboardStats | null;
  onOpenAddKategori?: () => void;
  onOpenAddKategoriModal?: () => void;
  onOpenEditKategori?: (kat: Kategori) => void;
  onOpenEditKategoriModal?: (kat: Kategori) => void;
  onDeleteKategori: (id_kategori: string) => void;
  onOpenDetailKategori?: (kat: Kategori) => void;
  onOpenDetailKategoriModal?: (kat: Kategori) => void;
  onOpenMultiSelectIuranLain?: (kat: Kategori) => void;
  onOpenPengeluaranIuranLain?: (kat: Kategori) => void;
  onDeleteTransaksiLain?: (id: string) => void;
  isOnline: boolean;
}

export const KategoriView: React.FC<KategoriViewProps> = ({
  kategoriList,
  transaksiLainList,
  transaksiKasList = [],
  anggotaList,
  dashboardStats,
  onOpenAddKategori,
  onOpenAddKategoriModal,
  onOpenEditKategori,
  onOpenEditKategoriModal,
  onDeleteKategori,
  onOpenDetailKategori,
  onOpenDetailKategoriModal,
  onOpenMultiSelectIuranLain,
  onOpenPengeluaranIuranLain,
  onDeleteTransaksiLain,
  isOnline
}) => {
  const [selectedDetailKategoriId, setSelectedDetailKategoriId] = useState<string | null>(null);
  const [kategoriToDelete, setKategoriToDelete] = useState<Kategori | null>(null);

  const handleAddClick = () => {
    if (onOpenAddKategori) onOpenAddKategori();
    else if (onOpenAddKategoriModal) onOpenAddKategoriModal();
  };

  const handleEditClick = (kat: Kategori) => {
    if (onOpenEditKategori) onOpenEditKategori(kat);
    else if (onOpenEditKategoriModal) onOpenEditKategoriModal(kat);
  };

  const handleDetailClick = (kat: Kategori) => {
    if (kat.is_kas_utama) {
      if (onOpenDetailKategori) onOpenDetailKategori(kat);
      else if (onOpenDetailKategoriModal) onOpenDetailKategoriModal(kat);
      return;
    }
    // Switch inline to dedicated Detail Page view
    setSelectedDetailKategoriId(kat.id_kategori);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If a category detail is currently selected, render the dedicated Detail View
  const currentSelectedKategori = kategoriList.find(k => k.id_kategori === selectedDetailKategoriId);
  if (currentSelectedKategori) {
    return (
      <KategoriDetailView
        kategori={currentSelectedKategori}
        transaksiList={transaksiLainList}
        anggotaList={anggotaList}
        onBack={() => setSelectedDetailKategoriId(null)}
        onOpenMultiSelectIuranLain={kat => {
          if (onOpenMultiSelectIuranLain) onOpenMultiSelectIuranLain(kat);
        }}
        onOpenPengeluaranIuranLain={kat => {
          if (onOpenPengeluaranIuranLain) onOpenPengeluaranIuranLain(kat);
        }}
        onOpenEditKategori={handleEditClick}
        onDeleteKategori={id => {
          onDeleteKategori(id);
          setSelectedDetailKategoriId(null);
        }}
        onDeleteTransaksiLain={id => {
          if (onDeleteTransaksiLain) {
            onDeleteTransaksiLain(id);
          }
        }}
        isOnline={isOnline}
      />
    );
  }

  return (
    <div id="kategori-view-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Kategori & Pos Iuran
            </h2>
            <p className="text-xs text-slate-500">
              Kelola pos pendanaan khusus, iuran acara, dan kas rutin
            </p>
          </div>
        </div>

        <button
          id="open-add-kategori-btn"
          onClick={handleAddClick}
          disabled={!isOnline}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {kategoriList.map(kat => {
          // Calculate stats for this category
          let masuk = 0;
          let keluar = 0;

          if (kat.is_kas_utama) {
            masuk = transaksiKasList
              .filter(t => t.jenis === 'masuk')
              .reduce((s, t) => s + Number(t.jumlah || 0), 0);
            keluar = transaksiKasList
              .filter(t => t.jenis === 'keluar')
              .reduce((s, t) => s + Number(t.jumlah || 0), 0);
            if (masuk === 0 && keluar === 0 && dashboardStats) {
              masuk = dashboardStats.total_kas || 0;
              keluar = dashboardStats.pengeluaran_kas || 0;
            }
          } else {
            masuk = transaksiLainList
              .filter(t => t.id_kategori === kat.id_kategori && t.jenis === 'masuk')
              .reduce((s, t) => s + Number(t.jumlah || 0), 0);
            keluar = transaksiLainList
              .filter(t => t.id_kategori === kat.id_kategori && t.jenis === 'keluar')
              .reduce((s, t) => s + Number(t.jumlah || 0), 0);
          }

          const saldo = masuk - keluar;

          return (
            <div
              key={kat.id_kategori}
              id={`kategori-card-${kat.id_kategori}`}
              className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                kat.is_kas_utama
                  ? 'border-blue-300 dark:border-blue-800 ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: kat.color || (kat.is_kas_utama ? '#2563eb' : '#8b5cf6') }}
                    />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {kat.nama_kategori}
                    </h3>
                  </div>

                  {/* Badges / Locked Status */}
                  {kat.is_kas_utama ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-amber-900 dark:bg-amber-950/70 dark:text-slate-300 border border-amber-300 dark:border-amber-700">
                      <Lock className="w-3 h-3" /> Kas Utama (Terkunci)
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-kategori-${kat.id_kategori}-btn`}
                        onClick={() => handleEditClick(kat)}
                        disabled={!isOnline}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-kategori-${kat.id_kategori}-btn`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKategoriToDelete(kat);
                        }}
                        disabled={!isOnline}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 min-h-[32px]">
                  {kat.deskripsi || 'Pos pendanaan kegiatan Karang Taruna / Remaja RT 04.'}
                </p>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 mb-4 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Masuk</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatRupiah(masuk)}
                    </p>
                  </div>
                  <div className="border-x border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Keluar</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatRupiah(keluar)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Saldo</span>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {formatRupiah(saldo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                id={`detail-kategori-${kat.id_kategori}-btn`}
                onClick={() => handleDetailClick(kat)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                <span>{kat.is_kas_utama ? 'Buka Tab Kas Utama' : 'Detail & Input Pembayaran'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      {/* Delete Confirmation Modal */}
      {kategoriToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Kategori?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Yakin ingin menghapus kategori <span className="font-semibold text-slate-700 dark:text-slate-300">"{kategoriToDelete.nama_kategori}"</span>?
                Seluruh transaksi terkait akan ikut terhapus dan saldo akan ter-update. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setKategoriToDelete(null)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteKategori(kategoriToDelete.id_kategori);
                  setKategoriToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

