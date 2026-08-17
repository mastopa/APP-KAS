# 📱 React Native App Prompt: Kas Remaja RT 04 (Expo / React Native + TypeScript)

Gunakan dokumen prompt ini sebagai spesifikasi lengkap jika Anda ingin men-generate atau membangun aplikasi mobile **React Native (Expo SDK / React Native CLI)** berbasis **TypeScript** dan **NativeWind / Tailwind CSS** yang terhubung langsung ke Backend REST API Kas Remaja RT 04.

---

## 1. 🛠️ Tech Stack & Architecture Spesifikasi

- **Framework:** React Native (Expo Managed Workflow SDK 51+ atau React Native CLI)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS v3/v4 for React Native) / StyleSheet
- **Navigation:** React Navigation v6/v7 (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`) atau Expo Router
- **State Management & Data Fetching:** Zustand / React Context + TanStack React Query / Axios
- **Local & Secure Storage:** `@react-native-async-storage/async-storage` atau `expo-secure-store`
- **Icons:** `lucide-react-native` atau `@expo/vector-icons` (Feather/MaterialCommunityIcons)
- **Image & Asset Handling:** `expo-image` atau standard React Native `Image` component

---

## 2. 🖼️ Logo Aplikasi & Branding Visual

- **URL Logo / Icon Resmi:** `https://res.cloudinary.com/unv48/image/upload/v1786763340/logo1_nj3krq.jpg`
- **Penerapan Logo pada React Native:**
  - **App Icon (`app.json` / `assets/icon.png`):** Gunakan logo di atas sebagai icon launcher aplikasi (dengan masking squircle `rounded-2xl` / radius `16`).
  - **Splash Screen (`app.json` splash):** Tampilkan logo di tengah dengan background `#FFFFFF` atau `#0F172A`.
  - **Header Screen & Login Modal/Screen:** Tampilkan logo berukuran `w-12 h-12` (48x48) dengan `rounded-xl` border subtle untuk branding identik dengan versi Web App.

---

## 3. 🎨 Design System & Color Palette (NativeWind / Tailwind)

Terapkan tema modern, clean, dan profesional dengan palet warna berikut:

```typescript
export const themeColors = {
  primary: '#155EEF',       // Royal Blue (Brand Utama)
  primaryDark: '#1239B8',   // Deep Blue
  primaryDarkest: '#312E81',// Indigo Blue (untuk gradient hero)
  bgLight: '#F8FAFC',       // Slate 50 (Background terang)
  surfaceLight: '#FFFFFF',  // Pure White (Card terang)
  bgDark: '#0F172A',        // Slate 900 (Background gelap)
  surfaceDark: '#1E293B',   // Slate 800 (Card gelap)
  textPrimaryLight: '#0F172A',
  textSecondaryLight: '#64748B',
  
  // Semantic Status Colors
  success: '#10B981',       // Emerald 500 (Lunas / Masuk)
  successBg: '#ECFDF5',     // Emerald 50
  warning: '#F59E0B',       // Amber 500 (Belum Lunas / Pending)
  warningBg: '#FFFBEB',     // Amber 50
  danger: '#E11D48',        // Rose 600 (Pengeluaran / Hapus)
  dangerBg: '#FFF1F2',      // Rose 50
  purpleAccent: '#9333EA',  // Purple 600 (Pos Iuran Khusus)
  purpleAccentBg: '#FAF5FF' // Purple 50
};
```

### Geometri & Border Radius
- **Inputs & Standard Buttons:** `rounded-xl` (12px)
- **Cards & List Items:** `rounded-2xl` (16px)
- **Hero Dashboard Banner:** `rounded-3xl` (24px)
- **Pill Badges & Chips:** `rounded-full` (9999px)

---

## 4. 🌐 Struktur Backend REST API

**Base URL:** `https://aplikasiremaja.ai.studio/api`  
*(Semua request menggunakan format JSON dengan header `Content-Type: application/json`)*

### A. Autentikasi Admin
- **POST `/api/login`**
  - **Request:** `{ "username": "admin", "password": "adminpassword123" }`
  - **Response (200):**
    ```json
    {
      "success": true,
      "message": "Login berhasil",
      "token": "token_admin_rt04_xyz",
      "admin": {
        "username": "admin",
        "nama_lengkap": "Bendahara RT 04",
        "role": "Bendahara"
      }
    }
    ```

### B. Dashboard & Ringkasan Keuangan
- **GET `/api/dashboard`**
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "total_kas": 1200000,
        "pengeluaran_kas": 200000,
        "total_iuran_lain": 850000,
        "pengeluaran_lain": 150000,
        "saldo_kas": 1000000,
        "saldo_iuran_lain": 700000,
        "total_saldo": 1700000,
        "total_anggota": 40,
        "total_anggota_aktif": 35,
        "total_anggota_nonaktif": 5,
        "recent_transactions": [
          {
            "id": "TRK-202608-ANG-001",
            "type": "kas",
            "kategori_nama": "Kas Utama RT 04",
            "nama_anggota": "Budi Santoso",
            "periode": "Agustus 2026",
            "jumlah": 10000,
            "jenis": "masuk",
            "tanggal": "2026-08-15",
            "keterangan": "Iuran Kas Agustus 2026"
          }
        ]
      }
    }
    ```

### C. Kelola Anggota (Warga / Remaja RT 04)
- **GET `/api/anggota`**: Mengambil semua anggota terdaftar.
- **POST `/api/anggota`**: Menambah anggota baru.
  - **Payload:** `{ "nama": "Budi", "status": "Aktif", "no_telepon": "081234567890", "alamat": "RT 04 RW 03" }`
- **PUT `/api/anggota`**: Mengubah data anggota (`id_anggota` wajib disertakan).
- **DELETE `/api/anggota?id={id_anggota}`**: Menghapus anggota.

### D. Kelola Kategori / Pos Keuangan
- **GET `/api/kategori`**: Mengambil daftar kategori pos keuangan.
  - **Response Data Kategori:**
    ```json
    [
      {
        "id_kategori": "KAT-KAS-01",
        "nama_kategori": "Kas Utama RT 04",
        "is_kas_utama": true,
        "target_nominal": 10000,
        "deskripsi": "Iuran kas rutin bulanan wajib seluruh anggota",
        "color": "#2563eb"
      },
      {
        "id_kategori": "KAT-AGUSTUSAN",
        "nama_kategori": "Iuran Lomba 17 Agustus",
        "is_kas_utama": false,
        "target_nominal": 50000,
        "deskripsi": "Iuran sukarela kegiatan kemerdekaan",
        "color": "#8b5cf6"
      }
    ]
    ```
- **POST `/api/kategori`**: Menambah pos kategori baru.
- **PUT `/api/kategori`**: Mengubah pos kategori.
- **DELETE `/api/kategori?id={id_kategori}`**: Menghapus pos kategori (akan menghapus seluruh riwayat transaksi di pos tersebut secara *cascade*).

### E. Transaksi Kas Utama (Wajib Bulanan Rp 10.000)
- **GET `/api/transaksi-kas?periode_bulan=Agustus%202026`**: Riwayat transaksi kas bulanan.
- **POST `/api/transaksi-kas`**: Bayar kas perorangan.
- **POST `/api/kas/multiselect`**: Bayar kas massal (multi-select anggota).
  - **Payload:**
    ```json
    {
      "anggota_ids": ["ANG-001", "ANG-002"],
      "periode_bulan": "Agustus 2026",
      "jumlah": 10000,
      "tanggal": "2026-08-15",
      "keterangan": "Lunas Kas Agustus"
    }
    ```

### F. Transaksi Pos Iuran Khusus / Kategori Lain (Manual Names & Flexible)
- **GET `/api/transaksi-lain`**: Riwayat transaksi pos lain / pengeluaran.
- **POST `/api/transaksi-lain`**: Input pembayaran pos khusus (Mendukung input nama bebas / manual tanpa `id_anggota`).
  - **Payload Input Nama Manual (Bebas / Donatur / Non-Anggota):**
    ```json
    {
      "id_kategori": "KAT-AGUSTUSAN",
      "nama_anggota": "H. Ahmad (Donatur Warga)",
      "jumlah": 100000,
      "jenis": "masuk",
      "tanggal": "2026-08-15",
      "keterangan": "Sumbangan Acara Agustusan"
    }
    ```
- **POST `/api/transaksi-lain` (Pengeluaran Pos / Kas):**
  - **Payload:**
    ```json
    {
      "id_kategori": "KAT-AGUSTUSAN",
      "jumlah": 75000,
      "jenis": "keluar",
      "tanggal": "2026-08-16",
      "keterangan": "Beli Konsumsi Rapat"
    }
    ```
- **DELETE `/api/transaksi-lain?id={id_transaksi}`**: Menghapus transaksi pos lain.

---

## 5. 📱 Rincian Halaman & Komponen React Native

### 1. Screen: Login Admin (Auth)
- State `username` dan `password` **kosong secara default** (bukan hardcoded).
- Header menyertakan logo resmi dari Cloudinary (`https://res.cloudinary.com/unv48/image/upload/v1786763340/logo1_nj3krq.jpg`) dan judul "Kas Remaja RT 04".
- Validasi form & handling loading state saat request login berlangsung.
- Simpan session token & data admin di `AsyncStorage` / `SecureStore`.

### 2. Screen: Dashboard Tab (`DashboardScreen`)
- **Hero Card Linear Gradient** (`colors={['#155EEF', '#1239B8', '#312E81']}`):
  - Label: "TOTAL SALDO BERSIH GABUNGAN"
  - Nominal: `formatRupiah(total_saldo)` (Contoh: Rp 1.700.000)
  - Badge RT: "RT 04 / RW 03"
- **4 Grid Cards Ringkasan:**
  - Saldo Kas Utama (`saldo_kas`)
  - Saldo Iuran Lain (`saldo_iuran_lain`)
  - Total Pemasukan
  - Total Pengeluaran
- **Daftar 10-12 Transaksi Terbaru:**
  - Item list dengan avatar inisial/ikon, nama pembayar/kategori, tanggal, nominal dengan badge hijau (`+Rp`) atau merah (`-Rp`).
- **Pull-to-Refresh (`RefreshControl`):** Untuk memuat ulang data terbaru dari backend.

### 3. Screen: Kas Utama Tab (`KasScreen`)
- **Nominal Standar:** **Rp 10.000 / bulan**.
- **Month Picker Modal / Selector:** Pilihan bulan (contoh: "Agustus 2026", "Juli 2026").
- **Statistik Header Bulan Terpilih:** Total terkumpul bulan ini, jumlah yang sudah lunas vs belum lunas.
- **Search Bar:** Pencarian nama anggota dengan cepat.
- **FlatList Anggota:**
  - Card anggota menampilkan Nama, ID Anggota, No Telp.
  - Badge status: **Lunas** (Hijau dengan ikon check) atau **Belum Lunas** (Amber).
  - Tombol aksi cepat: "Tandai Lunas" untuk anggota yang belum bayar.
- **Floating Action Button (FAB) / Action Button:**
  - "Bayar Kas Massal (Multi-Select)": Modal untuk mencentang beberapa anggota sekaligus dan menandai mereka lunas dengan nominal Rp 10.000.
  - "Catat Pengeluaran Kas": Form modal untuk mencatat biaya yang diambil dari kas utama.

### 4. Screen: Pos Iuran Lain / Kategori Tab (`KategoriScreen`)
- **Grid / List Kategori Pos:** Menampilkan daftar pos kegiatan (misal: "Iuran Agustusan", "Kerja Bakti", "Kas Sosial").
- **Detail Kategori Modal / Screen:**
  - Saldo pos saat ini, target nominal, deskripsi, total masuk vs keluar di pos ini.
- **Modal Input Pembayaran Pos Khusus:**
  - **TIDAK WAJIB** memilih dari anggota terdaftar.
  - Sediakan **Tab 1: Input Nama Manual** (TextInput / TextArea) agar bendahara bisa mengetik nama bebas siapa saja (donatur, warga luar, alumni, peserta umum). Bisa input 1 nama atau beberapa nama sekaligus dipisahkan baris/koma.
  - Sediakan **Tab 2: Pilih dari Anggota Terdaftar** (opsional multi-select).
  - Real-time kalkulasi total nominal masuk = `jumlah_orang × nominal_per_orang`.
- **Modal Catat Pengeluaran Pos:** Form pengeluaran khusus untuk kategori tersebut.

### 5. Screen: Anggota Tab (`AnggotaScreen`)
- **Daftar Seluruh Anggota:** Search by nama/ID, Filter status (Semua / Aktif / Non-aktif).
- **Tombol Tambah Anggota:**
  - Form Input: Nama Lengkap, Status (Aktif/Nonaktif), No HP/WhatsApp, Alamat Rumah.
  - **Field Alamat Rumah default otomatis terisi: `RT 04 RW 03`**.
- **Fitur Chat WhatsApp:** Tombol di card anggota yang membuka `Linking.openURL('https://wa.me/628xxx?text=Halo...')` untuk menagih iuran atau mengirim info kas.
- **Edit & Hapus Anggota:** Dengan konfirmasi modal dialog.

### 6. Screen: Rekap & Laporan Tab (`RekapScreen`)
- **Tab Segmented Control:**
  1. **Rekap Kas Per Anggota:** Tabel / card per anggota yang menunjukkan status lunas/belum pada bulan yang dipilih.
  2. **Buku Kas Kronologis:** Aliran cashflow harian/bulanan (Masuk vs Keluar).
- **Fitur Bagikan / Salin Laporan WhatsApp:**
  - Tombol "Salin Laporan WA" / "Share via WhatsApp" menggunakan `Share.share({ message: laporanText })`.
  - Format teks siap kirim ke grup WhatsApp RT 04 (lengkap dengan total saldo, daftar yang sudah lunas, dan yang belum lunas).

---

## 6. 🧭 Navigation Structure (React Navigation)

```tsx
// AppNavigation.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Wallet, FolderKanban, Users, ReceiptText } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#155EEF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        headerShown: true,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} 
      />
      <Tab.Screen 
        name="KasUtama" 
        component={KasScreen} 
        options={{ title: 'Kas Utama', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }} 
      />
      <Tab.Screen 
        name="PosLain" 
        component={KategoriScreen} 
        options={{ title: 'Pos Lain', tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size} /> }} 
      />
      <Tab.Screen 
        name="Anggota" 
        component={AnggotaScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} 
      />
      <Tab.Screen 
        name="Rekap" 
        component={RekapScreen} 
        options={{ title: 'Laporan', tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} /> }} 
      />
    </Tab.Navigator>
  );
}
```

---

## 7. 💡 Helper Utility Format Mata Uang

```typescript
// utils/formatters.ts
export const formatRupiah = (nominal: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(nominal || 0);
};
```
