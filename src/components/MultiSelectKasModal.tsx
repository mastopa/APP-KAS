import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Coins, CheckSquare, Square, Check, AlertCircle } from 'lucide-react';
import { Anggota } from '../types';
import { formatRupiah, getCurrentPeriodeBulan, getPeriodeOptions } from '../utils/formatters';

interface MultiSelectKasModalProps {
  isOpen: boolean;
  onClose: () => void;
  anggotaList: Anggota[];
  defaultNominal: number;
  initialPeriode?: string;
  onSubmit: (data: {
    anggota_ids: string[];
    periode_bulan: string;
    jumlah: number;
    tanggal: string;
    keterangan?: string;
  }) => Promise<void>;
  isOnline: boolean;
}

export const MultiSelectKasModal: React.FC<MultiSelectKasModalProps> = ({
  isOpen,
  onClose,
  anggotaList,
  defaultNominal,
  initialPeriode,
  onSubmit,
  isOnline
}) => {
  const [selectedAnggotaIds, setSelectedAnggotaIds] = useState<string[]>([]);
  const [periodeBulan, setPeriodeBulan] = useState<string>(initialPeriode || getCurrentPeriodeBulan());
  const [jumlahPerOrang, setJumlahPerOrang] = useState<number>(defaultNominal || 10000);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const periodeOptions = getPeriodeOptions(1, 1);
  const activeAnggota = anggotaList.filter(a => a.status === 'Aktif');

  useEffect(() => {
    if (initialPeriode) setPeriodeBulan(initialPeriode);
    if (defaultNominal) setJumlahPerOrang(defaultNominal);
  }, [initialPeriode, defaultNominal]);

  if (!isOpen) return null;

  const toggleAnggota = (id: string) => {
    setSelectedAnggotaIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAnggotaIds.length === activeAnggota.length) {
      setSelectedAnggotaIds([]);
    } else {
      setSelectedAnggotaIds(activeAnggota.map(a => a.id_anggota));
    }
  };

  const filteredAnggota = activeAnggota.filter(a =>
    a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id_anggota.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalKalkulasi = selectedAnggotaIds.length * (Number(jumlahPerOrang) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnggotaIds.length === 0) {
      setErrorMsg('Pilih minimal 1 orang anggota yang membayar.');
      return;
    }
    if (!jumlahPerOrang || jumlahPerOrang <= 0) {
      setErrorMsg('Nominal per orang harus lebih dari Rp 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSubmit({
        anggota_ids: selectedAnggotaIds,
        periode_bulan: periodeBulan,
        jumlah: jumlahPerOrang,
        tanggal,
        keterangan: keterangan || `Kas ${periodeBulan}`
      });
      setSelectedAnggotaIds([]);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pembayaran kas massal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Input Kas Massal (Multi-Select)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih beberapa anggota sekaligus dengan acuan periode bulan
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Fields: Periode Bulan & Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Acuan Periode Bulan <span className="text-slate-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="modal-kas-periode-select"
                  value={periodeBulan}
                  onChange={e => setPeriodeBulan(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {periodeOptions.map(p => (
                    <option key={p} value={p} className="dark:bg-slate-900">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nominal Iuran / Orang (Rp) <span className="text-slate-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={jumlahPerOrang}
                onChange={e => setJumlahPerOrang(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Keterangan Tambahan
              </label>
              <input
                type="text"
                placeholder="cth: Setor tunai ke Siti"
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Member Selection Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Anggota yang Membayar ({selectedAnggotaIds.length} Terpilih)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-28 sm:w-36 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                >
                  {selectedAnggotaIds.length === activeAnggota.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {filteredAnggota.map(a => {
                const isChecked = selectedAnggotaIds.includes(a.id_anggota);
                return (
                  <button
                    type="button"
                    key={a.id_anggota}
                    onClick={() => toggleAnggota(a.id_anggota)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                      isChecked
                        ? 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{a.nama}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">
                      {a.id_anggota}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {selectedAnggotaIds.length} orang × {formatRupiah(jumlahPerOrang)}
              </p>
              <p className="text-[11px] text-blue-600/80">
                Periode: <strong>{periodeBulan}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">Total Masuk</span>
              <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                {formatRupiah(totalKalkulasi)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedAnggotaIds.length === 0 || !isOnline}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : `Simpan Pembayaran (${selectedAnggotaIds.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
