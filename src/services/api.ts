import {
  Admin,
  Anggota,
  Kategori,
  TransaksiKas,
  TransaksiLain,
  DashboardStats,
  ApiResponse
} from '../types';

const API_BASE = '/api';

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    return res;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new Error('Koneksi ke server terputus atau server sedang merespons.');
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // 1. Health & Init
  async checkHealth() {
    const res = await safeFetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; service: string }>(res);
  },

  async initDatabase() {
    const res = await safeFetch(`${API_BASE}/init`);
    return handleResponse<{
      success: boolean;
      message: string;
      configured_google_sheets: boolean;
      sheets: string[];
      total_anggota: number;
      total_kategori: number;
    }>(res);
  },

  async initGoogleSheets() {
    return this.initDatabase();
  },

  async getSheetsStatus() {
    const res = await safeFetch(`${API_BASE}/sheets/status`);
    return handleResponse<{
      success: boolean;
      data: {
        configured: boolean;
        spreadsheetId: string;
        clientEmail: string;
        spreadsheetTitle?: string;
        sheetsList?: string[];
        lastSync?: string;
        message: string;
      };
    }>(res);
  },

  async testSheetsConnection() {
    const res = await safeFetch(`${API_BASE}/sheets/test`, {
      method: 'POST'
    });
    return handleResponse<{
      success: boolean;
      spreadsheetTitle?: string;
      sheetCount?: number;
      sheets: { name: string; rowCount: number }[];
      message: string;
    }>(res);
  },

  async syncAllToSheets() {
    const res = await safeFetch(`${API_BASE}/sheets/sync`, {
      method: 'POST'
    });
    return handleResponse<{
      success: boolean;
      message: string;
      syncedTabs: string[];
    }>(res);
  },

  async syncToGoogleSheets() {
    return this.syncAllToSheets();
  },

  async pullFromSheets() {
    const res = await safeFetch(`${API_BASE}/sheets/pull`, {
      method: 'POST'
    });
    return handleResponse<{
      success: boolean;
      message: string;
      stats?: any;
    }>(res);
  },

  // 2. Login & Admin
  async login(
    arg1: string | { username: string; password: string },
    arg2?: string
  ): Promise<{ success: boolean; message: string; token: string; admin: Admin }> {
    let username = '';
    let password = '';
    if (typeof arg1 === 'object') {
      username = arg1.username;
      password = arg1.password;
    } else {
      username = arg1;
      password = arg2 || '';
    }

    const res = await safeFetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async updateAdminCredentials(payload: {
    current_username: string;
    new_username?: string;
    new_password?: string;
    new_nama?: string;
  }) {
    const res = await safeFetch(`${API_BASE}/admin/update-credentials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<{ success: boolean; message: string; admin?: Admin }>(res);
  },

  // 3. Dashboard
  async getDashboard(): Promise<{ success: boolean; data: DashboardStats }> {
    const res = await safeFetch(`${API_BASE}/dashboard`);
    return handleResponse(res);
  },

  // 4. Anggota
  async getAnggota(): Promise<{ success: boolean; data: Anggota[] }> {
    const res = await safeFetch(`${API_BASE}/anggota`);
    return handleResponse(res);
  },

  async addAnggota(payload: { nama: string; status?: 'Aktif' | 'Non-aktif'; no_telepon?: string; alamat?: string }) {
    const res = await safeFetch(`${API_BASE}/anggota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<Anggota>>(res);
  },

  async updateAnggota(payload: Partial<Anggota> & { id_anggota: string }) {
    const res = await safeFetch(`${API_BASE}/anggota`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<Anggota>>(res);
  },

  async deleteAnggota(id_anggota: string) {
    const res = await safeFetch(`${API_BASE}/anggota?id=${encodeURIComponent(id_anggota)}`, {
      method: 'DELETE'
    });
    return handleResponse<ApiResponse>(res);
  },

  // 5. Kategori
  async getKategori(): Promise<{ success: boolean; data: Kategori[] }> {
    const res = await safeFetch(`${API_BASE}/kategori`);
    return handleResponse(res);
  },

  async addKategori(payload: { nama_kategori: string; target_nominal?: number; deskripsi?: string; color?: string }) {
    const res = await safeFetch(`${API_BASE}/kategori`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<Kategori>>(res);
  },

  async updateKategori(payload: Partial<Kategori> & { id_kategori: string }) {
    const res = await safeFetch(`${API_BASE}/kategori`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<Kategori>>(res);
  },

  async deleteKategori(id_kategori: string) {
    const res = await safeFetch(`${API_BASE}/kategori?id=${encodeURIComponent(id_kategori)}`, {
      method: 'DELETE'
    });
    return handleResponse<ApiResponse>(res);
  },

  // 6. Kas Utama
  async getTransaksiKas(filters?: { periode_bulan?: string; id_anggota?: string; jenis?: 'masuk' | 'keluar' }): Promise<{ success: boolean; data: (TransaksiKas & { nama_anggota?: string })[] }> {
    const params = new URLSearchParams();
    if (filters?.periode_bulan) params.append('periode_bulan', filters.periode_bulan);
    if (filters?.id_anggota) params.append('id_anggota', filters.id_anggota);
    if (filters?.jenis) params.append('jenis', filters.jenis);

    const res = await safeFetch(`${API_BASE}/transaksi-kas?${params.toString()}`);
    return handleResponse(res);
  },

  async addTransaksiKas(payload: { id_anggota?: string; periode_bulan?: string; jumlah: number; jenis?: 'masuk' | 'keluar'; tanggal?: string; keterangan?: string }) {
    const res = await safeFetch(`${API_BASE}/transaksi-kas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<TransaksiKas>>(res);
  },

  async addTransaksiKasSingle(payload: { id_anggota?: string; periode_bulan?: string; jumlah: number; jenis?: 'masuk' | 'keluar'; tanggal?: string; keterangan?: string }) {
    return this.addTransaksiKas(payload);
  },

  async addMultiSelectKas(payload: {
    anggota_ids: string[];
    periode_bulan: string;
    jumlah: number;
    tanggal?: string;
    keterangan?: string;
  }) {
    const res = await safeFetch(`${API_BASE}/kas/multiselect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<TransaksiKas[]>>(res);
  },

  async addTransaksiKasBatch(payload: {
    anggota_ids: string[];
    periode_bulan: string;
    jumlah: number;
    tanggal?: string;
    keterangan?: string;
  }) {
    return this.addMultiSelectKas(payload);
  },

  async deleteTransaksiKas(id_transaksi: string) {
    const res = await safeFetch(`${API_BASE}/transaksi-kas?id=${encodeURIComponent(id_transaksi)}`, {
      method: 'DELETE'
    });
    return handleResponse<ApiResponse>(res);
  },

  // 7. Transaksi Lain
  async getTransaksiLain(filters?: { id_kategori?: string; id_anggota?: string; jenis?: 'masuk' | 'keluar' }): Promise<{ success: boolean; data: (TransaksiLain & { nama_anggota?: string; nama_kategori?: string })[] }> {
    const params = new URLSearchParams();
    if (filters?.id_kategori) params.append('id_kategori', filters.id_kategori);
    if (filters?.id_anggota) params.append('id_anggota', filters.id_anggota);
    if (filters?.jenis) params.append('jenis', filters.jenis);

    const res = await safeFetch(`${API_BASE}/transaksi-lain?${params.toString()}`);
    return handleResponse(res);
  },

  async addTransaksiLain(payload: { id_kategori: string; id_anggota?: string; nama_anggota?: string; jumlah: number; jenis?: 'masuk' | 'keluar'; tanggal?: string; keterangan?: string }) {
    const res = await safeFetch(`${API_BASE}/transaksi-lain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<TransaksiLain>>(res);
  },

  async addTransaksiLainSingle(payload: { id_kategori: string; id_anggota?: string; jumlah: number; jenis?: 'masuk' | 'keluar'; tanggal?: string; keterangan?: string }) {
    return this.addTransaksiLain(payload);
  },

  async addMultiSelectIuranLain(payload: {
    id_kategori: string;
    anggota_ids: string[];
    jumlah: number;
    tanggal?: string;
    keterangan?: string;
  }) {
    const res = await safeFetch(`${API_BASE}/iuran-lain/multiselect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ApiResponse<TransaksiLain[]>>(res);
  },

  async addTransaksiLainBatch(payload: {
    id_kategori: string;
    anggota_ids: string[];
    jumlah: number;
    tanggal?: string;
    keterangan?: string;
  }) {
    return this.addMultiSelectIuranLain(payload);
  },

  async deleteTransaksiLain(id_transaksi: string) {
    const res = await safeFetch(`${API_BASE}/transaksi-lain?id=${encodeURIComponent(id_transaksi)}`, {
      method: 'DELETE'
    });
    return handleResponse<ApiResponse>(res);
  },

  // 8. Rekap
  async getRekap(filters?: { id_kategori?: string; periode?: string; tanggal_mulai?: string; tanggal_selesai?: string }) {
    const params = new URLSearchParams();
    if (filters?.id_kategori) params.append('id_kategori', filters.id_kategori);
    if (filters?.periode) params.append('periode', filters.periode);
    if (filters?.tanggal_mulai) params.append('tanggal_mulai', filters.tanggal_mulai);
    if (filters?.tanggal_selesai) params.append('tanggal_selesai', filters.tanggal_selesai);

    const res = await safeFetch(`${API_BASE}/rekap?${params.toString()}`);
    return handleResponse<any>(res);
  },

  // 9. Pengaturan
  async getPengaturan() {
    const res = await safeFetch(`${API_BASE}/pengaturan`);
    return handleResponse<{ success: boolean; data: Record<string, string>; list: any[] }>(res);
  },

  async updatePengaturan(settings: Record<string, string>) {
    const res = await safeFetch(`${API_BASE}/pengaturan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });
    return handleResponse<ApiResponse>(res);
  },

  // 10. Reset Data
  async resetData() {
    const res = await safeFetch(`${API_BASE}/reset-data`, {
      method: 'POST'
    });
    return handleResponse<ApiResponse>(res);
  }
};
