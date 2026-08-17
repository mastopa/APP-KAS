import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { Anggota } from '../types';

interface AnggotaViewProps {
  anggotaList: Anggota[];
  onAddAnggota: (payload: { nama: string; status: 'Aktif' | 'Non-aktif'; no_telepon?: string; alamat?: string }) => Promise<void>;
  onUpdateAnggota: (payload: Partial<Anggota> & { id_anggota: string }) => Promise<void>;
  onDeleteAnggota: (id_anggota: string) => Promise<void>;
  isOnline: boolean;
}

export const AnggotaView: React.FC<AnggotaViewProps> = ({
  anggotaList,
  onAddAnggota,
  onUpdateAnggota,
  onDeleteAnggota,
  isOnline
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Non-aktif'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Non-aktif'>('Aktif');
  const [formTelepon, setFormTelepon] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalAktif = anggotaList.filter(a => a.status === 'Aktif').length;
  const totalNonaktif = anggotaList.filter(a => a.status === 'Non-aktif').length;

  const filteredList = anggotaList.filter(a => {
    const matchesSearch =
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.no_telepon && a.no_telepon.includes(searchTerm)) ||
      (a.alamat && a.alamat.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingAnggota(null);
    setFormNama('');
    setFormStatus('Aktif');
    setFormTelepon('');
    setFormAlamat('RT 04 RW 03');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (anggota: Anggota) => {
    setEditingAnggota(anggota);
    setFormNama(anggota.nama);
    setFormStatus(anggota.status);
    setFormTelepon(anggota.no_telepon || '');
    setFormAlamat(anggota.alamat || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      setErrorMsg('Nama anggota wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (editingAnggota) {
        await onUpdateAnggota({
          id_anggota: editingAnggota.id_anggota,
          nama: formNama.trim(),
          status: formStatus,
          no_telepon: formTelepon.trim(),
          alamat: formAlamat.trim()
        });
      } else {
        await onAddAnggota({
          nama: formNama.trim(),
          status: formStatus,
          no_telepon: formTelepon.trim(),
          alamat: formAlamat.trim()
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data anggota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="anggota-view-container" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Data Anggota Remaja
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Daftar seluruh pemuda & pemudi warga RT 04
            </p>
          </div>
        </div>

        <button
          id="open-add-anggota-btn"
          onClick={openAddModal}
          disabled={!isOnline}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Anggota Baru</span>
        </button>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Anggota</span>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {anggotaList.length} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Org</span>
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">Aktif</span>
          <p className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            {totalAktif} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Org</span>
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">Non-Aktif</span>
          <p className="text-lg sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            {totalNonaktif} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Org</span>
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controls */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-anggota-input"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama, ID, no HP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({anggotaList.length})
            </button>
            <button
              onClick={() => setStatusFilter('Aktif')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'Aktif'
                  ? 'bg-slate-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Aktif ({totalAktif})
            </button>
            <button
              onClick={() => setStatusFilter('Non-aktif')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'Non-aktif'
                  ? 'bg-slate-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Non-aktif ({totalNonaktif})
            </button>
          </div>
        </div>

        {/* Mobile View: Member Cards */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400 text-xs">
              Tidak ditemukan data anggota yang cocok.
            </div>
          ) : (
            filteredList.map(anggota => (
              <div key={anggota.id_anggota} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                      {anggota.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{anggota.nama}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{anggota.id_anggota}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      anggota.status === 'Aktif'
                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                    }`}
                  >
                    {anggota.status === 'Aktif' ? (
                      <CheckCircle2 className="w-3 h-3 text-slate-700" />
                    ) : (
                      <XCircle className="w-3 h-3 text-slate-700" />
                    )}
                    {anggota.status}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {anggota.no_telepon && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{anggota.no_telepon}</span>
                    </div>
                  )}
                  {anggota.alamat && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{anggota.alamat}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEditModal(anggota)}
                    disabled={!isOnline}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus anggota "${anggota.nama}" (${anggota.id_anggota})?`)) {
                        onDeleteAnggota(anggota.id_anggota);
                      }
                    }}
                    disabled={!isOnline}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
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
                <th className="px-4 py-3">ID Anggota</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">No. Kontak</th>
                <th className="px-4 py-3">Alamat Rumah</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tidak ditemukan data anggota yang cocok
                  </td>
                </tr>
              ) : (
                filteredList.map(anggota => (
                  <tr
                    key={anggota.id_anggota}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {anggota.id_anggota}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {anggota.nama}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          anggota.status === 'Aktif'
                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}
                      >
                        {anggota.status === 'Aktif' ? (
                          <CheckCircle2 className="w-3 h-3 text-slate-700" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-700" />
                        )}
                        {anggota.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {anggota.no_telepon ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {anggota.no_telepon}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {anggota.alamat ? (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {anggota.alamat}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(anggota)}
                          disabled={!isOnline}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Anggota"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus anggota "${anggota.nama}" (${anggota.id_anggota})?`)) {
                              onDeleteAnggota(anggota.id_anggota);
                            }
                          }}
                          disabled={!isOnline}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Anggota Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingAnggota ? 'Edit Data Anggota' : 'Tambah Anggota Remaja Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-rose-900 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  id="form-anggota-nama"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={formNama}
                  onChange={e => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Keanggotaan
                </label>
                <select
                  id="form-anggota-status"
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'Aktif' | 'Non-aktif')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Aktif">Aktif (Wajib Iuran Kas Rutin)</option>
                  <option value="Non-aktif">Non-aktif (Pindah / Tidak Wajib)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  No. Telepon / WhatsApp
                </label>
                <input
                  id="form-anggota-telepon"
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  value={formTelepon}
                  onChange={e => setFormTelepon(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Rumah / Blok
                </label>
                <input
                  id="form-anggota-alamat"
                  type="text"
                  placeholder="Contoh: RT 04 / RW 03 No. 12"
                  value={formAlamat}
                  onChange={e => setFormAlamat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingAnggota ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
