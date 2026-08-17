# 📊 Struktur Google Sheets: Kas Remaja RT 04

Aplikasi ini dirancang untuk dapat melakukan sinkronisasi dengan Google Sheets sebagai *database* penyimpanannya. Di bawah ini adalah struktur dokumen Google Sheets beserta nama-nama *sheet* (tab) dan kolom yang wajib ada.

> **Catatan Penting:** 
> - Nama-nama sheet harus sama persis (perhatikan huruf besar/kecil dan spasi/underscore).
> - Baris pertama (Row 1) pada masing-masing sheet adalah header kolom.

---

## 1. Admins
Sheet ini menyimpan data akses login untuk pengurus/bendahara.
- **Nama Sheet:** `Admins`
- **Kolom (Header):**
  - `id`: ID unik admin (contoh: ADM-1)
  - `username`: Username untuk login
  - `password`: Password (berupa *plain text* dalam sistem ini)
  - `nama_lengkap`: Nama lengkap admin/bendahara
  - `role`: Peran akun (contoh: 'Admin', 'Bendahara')

## 2. Anggota
Sheet ini menyimpan daftar nama warga atau remaja yang terdaftar.
- **Nama Sheet:** `Anggota`
- **Kolom (Header):**
  - `id_anggota`: ID unik anggota (contoh: ANG-12345)
  - `nama`: Nama lengkap anggota
  - `status`: Status keanggotaan (contoh: 'Aktif', 'Nonaktif')
  - `no_telepon`: Nomor WhatsApp / HP anggota
  - `alamat`: Alamat / blok rumah
  - `created_at`: Tanggal pertama kali ditambahkan (format ISO)

## 3. Kategori
Sheet ini menyimpan kategori/pos keuangan (baik pemasukan maupun pengeluaran).
- **Nama Sheet:** `Kategori`
- **Kolom (Header):**
  - `id_kategori`: ID unik kategori (contoh: KAT-KAS-UTAMA)
  - `nama_kategori`: Nama pos keuangan (contoh: Kas Utama RT 04)
  - `is_kas_utama`: Penanda boolean (`true` / `false`). *True* khusus untuk Kas Bulanan Wajib.
  - `target_nominal`: Nominal standar untuk iuran (opsional/angka).
  - `deskripsi`: Penjelasan kegunaan kategori.
  - `color`: Hex code warna label (contoh: `#3B82F6`).

## 4. Transaksi Kas (Wajib Bulanan)
Sheet ini menyimpan seluruh riwayat iuran/pembayaran khusus untuk Kas Utama.
- **Nama Sheet:** `Transaksi_Kas`
- **Kolom (Header):**
  - `id_transaksi`: ID unik transaksi
  - `id_anggota`: Relasi ke ID Anggota pembayar
  - `periode_bulan`: Periode bulan lunas (contoh: `2024-08` untuk Agustus 2024)
  - `jumlah`: Nominal uang yang masuk/keluar
  - `jenis`: `masuk` atau `keluar`
  - `tanggal`: Waktu transaksi dicatat (format ISO)
  - `keterangan`: Catatan tambahan (opsional)

## 5. Transaksi Lain (Iuran Kegiatan & Pengeluaran)
Sheet ini menyimpan seluruh riwayat transaksi di luar Kas Wajib (misal: Iuran Agustusan, Pengeluaran Beli Sapu, dll).
- **Nama Sheet:** `Transaksi_Lain`
- **Kolom (Header):**
  - `id_transaksi`: ID unik transaksi
  - `id_kategori`: Relasi ke ID Kategori (Pos Keuangan terkait)
  - `id_anggota`: Relasi ke ID Anggota (jika pemasukan/iuran patungan), bisa kosong jika pengeluaran umum.
  - `jumlah`: Nominal uang yang masuk/keluar
  - `jenis`: `masuk` atau `keluar`
  - `tanggal`: Waktu transaksi dicatat (format ISO)
  - `keterangan`: Catatan tambahan/tujuan pengeluaran

## 6. Pengaturan
Sheet ini menyimpan pengaturan aplikasi seperti periode aktif atau konfigurasi web lainnya.
- **Nama Sheet:** `Pengaturan`
- **Kolom (Header):**
  - `key`: Nama kunci pengaturan (contoh: `target_kas_bulanan`)
  - `value`: Nilai pengaturan tersebut (contoh: `20000`)
