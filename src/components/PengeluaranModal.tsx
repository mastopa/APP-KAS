import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, TrendingDown, AlertCircle } from 'lucide-react';
import { Kategori } from '../types';
import { formatRupiah } from '../utils/formatters';

interface PengeluaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategoriList: Kategori[];
  preselectedKategoriId?: string;
  preselectedMonth?: string;
  onSubmit: (data: {
    is_kas_utama: boolean;
    id_kategori?: string;
    periode_bulan?: string;
    jumlah: number;
    tanggal: string;
    keterangan: string;
  }) => Promise<void>;
  isOnline: boolean;
}

export const PengeluaranModal: React.FC<PengeluaranModalProps> = ({
  isOpen,
  onClose,
  kategoriList,
  preselectedKategoriId,
  preselectedMonth,
  onSubmit,
  isOnline
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('kas_utama');
  const [jumlah, setJumlah] = useState<number | string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (preselectedKategoriId) {
      const kat = kategoriList.find(k => k.id_kategori === preselectedKategoriId);
      if (kat?.is_kas_utama) {
        setSelectedTarget('kas_utama');
      } else {
        setSelectedTarget(preselectedKategoriId);
      }
    }
  }, [preselectedKategoriId, kategoriList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah || Number(jumlah) <= 0) {
      setErrorMsg('Nominal pengeluaran harus lebih dari Rp 0.');
      return;
    }
    if (!keterangan || !keterangan.trim()) {
      setErrorMsg('Keterangan / keperluan pengeluaran wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const isKas = selectedTarget === 'kas_utama';
      await onSubmit({
        is_kas_utama: isKas,
        id_kategori: isKas ? undefined : selectedTarget,
        periode_bulan: preselectedMonth,
        jumlah: Number(jumlah),
        tanggal,
        keterangan: keterangan.trim()
      });

      setJumlah('');
      setKeterangan('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencatat pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-white font-bold">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Catat Pengeluaran
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan biaya operasional, belanja keperluan & dana keluar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pos Sumber Dana */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sumber Pos Dana <span className="text-slate-500">*</span>
            </label>
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            >
              <option value="kas_utama">Kas Utama RT 04</option>
              {kategoriList
                .filter(k => !k.is_kas_utama)
                .map(k => (
                  <option key={k.id_kategori} value={k.id_kategori}>
                    {k.nama_kategori}
                  </option>
                ))}
            </select>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nominal Pengeluaran (Rp) <span className="text-slate-500">*</span>
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              placeholder="cth: 50000"
              value={jumlah}
              onChange={e => setJumlah(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
            {Number(jumlah) > 0 && (
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                Terbaca: {formatRupiah(jumlah)}
              </p>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal Pengeluaran <span className="text-slate-500">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Keperluan / Rincian Belanja <span className="text-slate-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="cth: Beli konsumsi & air mineral rapat pemuda RT 04"
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
