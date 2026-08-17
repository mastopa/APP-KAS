export interface Admin {
  id: string;
  username: string;
  password?: string;
  nama_lengkap?: string;
  role?: string;
}

export interface Anggota {
  id_anggota: string;
  nama: string;
  status: 'Aktif' | 'Non-aktif';
  no_telepon?: string;
  alamat?: string;
  created_at?: string;
}

export interface Kategori {
  id_kategori: string;
  nama_kategori: string;
  is_kas_utama: boolean;
  target_nominal?: number;
  deskripsi?: string;
  icon?: string;
  color?: string;
}

export interface TransaksiKas {
  id_transaksi: string;
  id_anggota: string;
  nama_anggota?: string;
  periode_bulan: string; // e.g. "Agustus 2026", "08-2026"
  jumlah: number;
  jenis: 'masuk' | 'keluar';
  tanggal: string; // YYYY-MM-DD
  keterangan?: string;
}

export interface TransaksiLain {
  id_transaksi: string;
  id_kategori: string;
  nama_kategori?: string;
  id_anggota?: string;
  nama_anggota?: string;
  jumlah: number;
  jenis: 'masuk' | 'keluar';
  tanggal: string; // YYYY-MM-DD
  keterangan?: string;
}

export interface PengaturanItem {
  key: string;
  value: string;
}

export interface DashboardStats {
  total_kas: number;
  total_iuran_lain: number;
  pengeluaran_kas: number;
  pengeluaran_lain: number;
  saldo_kas: number;
  saldo_iuran_lain: number;
  total_saldo: number;
  total_anggota: number;
  total_anggota_aktif: number;
  total_anggota_nonaktif: number;
  kategori_list: {
    id_kategori: string;
    nama_kategori: string;
    is_kas_utama: boolean;
    total_masuk: number;
    total_keluar: number;
    saldo: number;
  }[];
  recent_transactions: Array<{
    id: string;
    type: 'kas' | 'lain';
    kategori_nama: string;
    nama_anggota?: string;
    periode?: string;
    jumlah: number;
    jenis: 'masuk' | 'keluar';
    tanggal: string;
    keterangan?: string;
  }>;
  monthly_trend: Array<{
    bulan: string;
    pemasukan: number;
    pengeluaran: number;
  }>;
}

export type ActiveTab = 'dashboard' | 'kas' | 'kategori' | 'anggota' | 'rekap' | 'pengaturan' | 'android';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
