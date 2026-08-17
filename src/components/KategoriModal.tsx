import React, { useState, useEffect } from 'react';
import { X, FolderKanban, AlertCircle } from 'lucide-react';
import { Kategori } from '../types';

interface KategoriModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategoriToEdit: Kategori | null;
  onSubmit: (data: {
    id_kategori?: string;
    nama_kategori: string;
    target_nominal?: number;
    deskripsi?: string;
    color?: string;
  }) => Promise<void>;
  isOnline: boolean;
}

const COLOR_PRESETS = [
  '#dc2626', // Red
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#ea580c'  // Orange
];

export const KategoriModal: React.FC<KategoriModalProps> = ({
  isOpen,
  onClose,
  kategoriToEdit,
  onSubmit,
  isOnline
}) => {
  const [namaKategori, setNamaKategori] = useState('');
  const [targetNominal, setTargetNominal] = useState<number | string>('');
  const [deskripsi, setDeskripsi] = useState('');
  const [color, setColor] = useState('#059669');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (kategoriToEdit) {
      setNamaKategori(kategoriToEdit.nama_kategori);
      setTargetNominal(kategoriToEdit.target_nominal || '');
      setDeskripsi(kategoriToEdit.deskripsi || '');
      setColor(kategoriToEdit.color || '#059669');
    } else {
      setNamaKategori('');
      setTargetNominal('');
      setDeskripsi('');
      setColor('#059669');
    }
  }, [kategoriToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSubmit({
        id_kategori: kategoriToEdit ? kategoriToEdit.id_kategori : undefined,
        nama_kategori: namaKategori.trim(),
        target_nominal: targetNominal ? Number(targetNominal) : undefined,
        deskripsi: deskripsi.trim(),
        color
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {kategoriToEdit ? 'Edit Kategori Iuran' : 'Tambah Kategori Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Pos iuran khusus & kegiatan Remaja RT 04
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Kategori / Pos Iuran <span className="text-slate-500">*</span>
            </label>
            <input
              type="text"
              placeholder="cth: Iuran Buka Bersama Ramadan"
              value={namaKategori}
              onChange={e => setNamaKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Nominal per Orang (Opsional)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="cth: 30000"
              value={targetNominal}
              onChange={e => setTargetNominal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Warna Penanda
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Deskripsi / Keterangan
            </label>
            <textarea
              rows={2}
              placeholder="cth: Iuran sukarela untuk acara buka puasa bersama pemuda di masjid"
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : kategoriToEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
