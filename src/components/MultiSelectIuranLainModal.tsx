import React, { useState, useEffect } from 'react';
import { X, Users, Coins, Check, AlertCircle, UserCheck, UserPlus, FileText } from 'lucide-react';
import { Anggota, Kategori } from '../types';
import { formatRupiah } from '../utils/formatters';

interface MultiSelectIuranLainModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategoriList: Kategori[];
  selectedKategori: Kategori | null;
  anggotaList: Anggota[];
  onSubmit: (data: {
    id_kategori: string;
    anggota_ids?: string[];
    manual_names?: string[];
    jumlah: number;
    tanggal: string;
    keterangan?: string;
  }) => Promise<void>;
  isOnline: boolean;
}

export const MultiSelectIuranLainModal: React.FC<MultiSelectIuranLainModalProps> = ({
  isOpen,
  onClose,
  kategoriList,
  selectedKategori,
  anggotaList,
  onSubmit,
  isOnline
}) => {
  const [targetKategoriId, setTargetKategoriId] = useState<string>('');
  const [inputMode, setInputMode] = useState<'manual' | 'registered'>('manual');
  
  // Manual mode state
  const [manualNameInput, setManualNameInput] = useState<string>('');
  
  // Registered members mode state
  const [selectedAnggotaIds, setSelectedAnggotaIds] = useState<string[]>([]);
  
  // Shared transaction state
  const [jumlahPerOrang, setJumlahPerOrang] = useState<number>(50000);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const otherKategoriList = kategoriList.filter(k => !k.is_kas_utama);
  const activeAnggota = anggotaList.filter(a => a.status === 'Aktif');

  useEffect(() => {
    if (selectedKategori && !selectedKategori.is_kas_utama) {
      setTargetKategoriId(selectedKategori.id_kategori);
      if (selectedKategori.target_nominal) {
        setJumlahPerOrang(selectedKategori.target_nominal);
      }
    } else if (otherKategoriList.length > 0 && !targetKategoriId) {
      setTargetKategoriId(otherKategoriList[0].id_kategori);
      if (otherKategoriList[0].target_nominal) {
        setJumlahPerOrang(otherKategoriList[0].target_nominal);
      }
    }
  }, [selectedKategori, otherKategoriList]);

  if (!isOpen) return null;

  const currentKat = kategoriList.find(k => k.id_kategori === targetKategoriId);

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

  // Process manual names line by line or comma separated
  const parsedManualNames = manualNameInput
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0);

  const totalPayersCount = inputMode === 'manual' ? parsedManualNames.length : selectedAnggotaIds.length;
  const totalKalkulasi = totalPayersCount * (Number(jumlahPerOrang) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetKategoriId) {
      setErrorMsg('Pilih kategori iuran terlebih dahulu.');
      return;
    }
    if (inputMode === 'manual' && parsedManualNames.length === 0) {
      setErrorMsg('Masukkan minimal 1 nama pembayar manual.');
      return;
    }
    if (inputMode === 'registered' && selectedAnggotaIds.length === 0) {
      setErrorMsg('Pilih minimal 1 orang anggota yang membayar.');
      return;
    }
    if (!jumlahPerOrang || jumlahPerOrang <= 0) {
      setErrorMsg('Nominal iuran harus lebih dari Rp 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (inputMode === 'manual') {
        await onSubmit({
          id_kategori: targetKategoriId,
          manual_names: parsedManualNames,
          jumlah: jumlahPerOrang,
          tanggal,
          keterangan: keterangan || (currentKat ? `Iuran ${currentKat.nama_kategori}` : 'Iuran Pos Khusus')
        });
      } else {
        await onSubmit({
          id_kategori: targetKategoriId,
          anggota_ids: selectedAnggotaIds,
          jumlah: jumlahPerOrang,
          tanggal,
          keterangan: keterangan || (currentKat ? `Iuran ${currentKat.nama_kategori}` : 'Iuran Pos Khusus')
        });
      }

      setManualNameInput('');
      setSelectedAnggotaIds([]);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan iuran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Input Pembayaran Iuran Pos Khusus
              </h2>
              <p className="text-xs text-slate-500">
                Pembayaran bebas dari siapa saja (tidak wajib terdaftar sebagai anggota)
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
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Input Nama Manual (Bebas / Umum)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('registered')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === 'registered'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pilih dari Anggota Terdaftar ({activeAnggota.length})</span>
            </button>
          </div>

          {/* Category & Nominal Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Kategori Pos <span className="text-slate-500">*</span>
              </label>
              <select
                id="modal-iuran-kategori-select"
                value={targetKategoriId}
                onChange={e => {
                  setTargetKategoriId(e.target.value);
                  const sel = kategoriList.find(k => k.id_kategori === e.target.value);
                  if (sel && sel.target_nominal) setJumlahPerOrang(sel.target_nominal);
                }}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              >
                {otherKategoriList.map(k => (
                  <option key={k.id_kategori} value={k.id_kategori} className="dark:bg-slate-900">
                    {k.nama_kategori}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Keterangan / Catatan
              </label>
              <input
                type="text"
                placeholder="cth: Sumbangan Acara HUT / Tahap 1"
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* INPUT MODE: MANUAL NAMES */}
          {inputMode === 'manual' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Pembayar (Input Manual) <span className="text-slate-500">*</span>
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                  {parsedManualNames.length} nama terdeteksi
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Ketik nama pembayar. Gunakan koma atau baris baru untuk lebih dari 1 orang&#10;Contoh:&#10;Budi Santoso&#10;H. Ahmad (Donatur)&#10;Siti Rahmawati"
                value={manualNameInput}
                onChange={e => setManualNameInput(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none font-sans"
              />
              <p className="text-[11px] text-slate-500">
                💡 <em>Dapat diisi siapa saja: warga, alumni, donatur, atau peserta umum.</em>
              </p>
            </div>
          )}

          {/* INPUT MODE: REGISTERED MEMBERS */}
          {inputMode === 'registered' && (
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
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline"
                  >
                    {selectedAnggotaIds.length === activeAnggota.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                {filteredAnggota.map(a => {
                  const isChecked = selectedAnggotaIds.includes(a.id_anggota);
                  return (
                    <button
                      type="button"
                      key={a.id_anggota}
                      onClick={() => toggleAnggota(a.id_anggota)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                        isChecked
                          ? 'bg-purple-50 border-purple-400 text-purple-900 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-200 font-semibold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
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
          )}

          {/* Real-time Calculation Summary */}
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-800 dark:text-purple-300">
                {totalPayersCount} orang × {formatRupiah(jumlahPerOrang)}
              </p>
              <p className="text-[11px] text-purple-600/80">
                Kategori: <strong>{currentKat?.nama_kategori || 'Iuran Pos Khusus'}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">Total Masuk</span>
              <p className="text-lg font-black text-purple-700 dark:text-purple-300">
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
              disabled={isSubmitting || totalPayersCount === 0 || !isOnline}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : `Simpan Pembayaran (${totalPayersCount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
