import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Admin, Anggota, Kategori, TransaksiKas, TransaksiLain, PengaturanItem, DashboardStats } from '../src/types/index';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed data for Remaja RT 04 (No demo data)
const defaultData = {
  admins: [
    {
      id: 'adm-001',
      username: 'admin',
      password: 'admin123',
      nama_lengkap: 'Admin RT 04',
      role: 'Bendahara'
    }
  ] as Admin[],
  anggota: [] as Anggota[],
  kategori: [
    {
      id_kategori: 'KAT-KAS-01',
      nama_kategori: 'Kas Utama RT 04',
      is_kas_utama: true,
      target_nominal: 10000,
      deskripsi: 'Iuran kas rutin bulanan seluruh anggota remaja RT 04',
      color: '#2563eb'
    }
  ] as Kategori[],
  transaksi_kas: [] as TransaksiKas[],
  transaksi_lain: [] as TransaksiLain[],
  pengaturan: [
    { key: 'nama_organisasi', value: 'Karang Taruna / Remaja RT 04' },
    { key: 'nama_rt', value: 'RT 04 / RW 03' },
    { key: 'nominal_kas_bulanan', value: '10000' },
    { key: 'nama_bendahara', value: 'Bendahara RT 04' },
    { key: 'kontak_bendahara', value: '' },
    { key: 'rekening_kas', value: '' },
    { key: 'qris_kas', value: '' },
    { key: 'tema_default', value: 'light' },
    { key: 'auto_sync_sheets', value: 'true' }
  ] as PengaturanItem[]
};

class DatabaseManager {
  private data = JSON.parse(JSON.stringify(defaultData));
  private doc: GoogleSpreadsheet | null = null;
  private isGoogleSheetsConfigured = false;
  private isInitializing = false;

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          admins: parsed.admins || defaultData.admins,
          anggota: parsed.anggota || defaultData.anggota,
          kategori: parsed.kategori || defaultData.kategori,
          transaksi_kas: parsed.transaksi_kas || defaultData.transaksi_kas,
          transaksi_lain: parsed.transaksi_lain || defaultData.transaksi_lain,
          pengaturan: parsed.pengaturan || defaultData.pengaturan
        };
      } else {
        this.saveToDisk();
      }
    } catch (e) {
      console.warn('Gagal memuat file database.json, menggunakan data default:', e);
      this.data = JSON.parse(JSON.stringify(defaultData));
      this.saveToDisk();
    }
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Gagal menyimpan database.json:', e);
    }
  }

  public getCredentials() {
    const spreadsheetId = process.env.SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || process.env.SHEET_ID || '';
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || process.env.SERVICE_ACCOUNT_EMAIL || '';
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.PRIVATE_KEY || '';

    if (privateKey) {
      privateKey = privateKey.trim();
      // Remove enclosing quotes if user pasted with quotes
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
      }
      // Replace literal \n with real newline characters
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    return {
      spreadsheetId: spreadsheetId.trim(),
      clientEmail: clientEmail.trim(),
      privateKey,
      isComplete: Boolean(spreadsheetId.trim() && clientEmail.trim() && privateKey.trim())
    };
  }

  public async getSheetsStatus(): Promise<{
    configured: boolean;
    spreadsheetId: string;
    clientEmail: string;
    spreadsheetTitle?: string;
    sheetsList?: string[];
    lastSync?: string;
    message: string;
  }> {
    const creds = this.getCredentials();
    if (!creds.isComplete) {
      return {
        configured: false,
        spreadsheetId: creds.spreadsheetId ? `${creds.spreadsheetId.slice(0, 8)}...` : '',
        clientEmail: creds.clientEmail || '',
        message: 'Kredensial belum lengkap di konfigurasi environment. Menggunakan database lokal.'
      };
    }

    try {
      if (!this.doc) {
        await this.initGoogleSheets();
      }
      return {
        configured: this.isGoogleSheetsConfigured,
        spreadsheetId: creds.spreadsheetId,
        clientEmail: creds.clientEmail,
        spreadsheetTitle: this.doc?.title || 'Google Spreadsheet',
        sheetsList: this.doc ? Object.keys(this.doc.sheetsByTitle) : [],
        lastSync: new Date().toISOString(),
        message: this.isGoogleSheetsConfigured
          ? `Tersambung ke Google Spreadsheet: "${this.doc?.title}" (${Object.keys(this.doc?.sheetsByTitle || {}).length} tab)`
          : 'Gagal terhubung ke Google Sheets.'
      };
    } catch (e: any) {
      return {
        configured: false,
        spreadsheetId: creds.spreadsheetId,
        clientEmail: creds.clientEmail,
        message: `Error saat memeriksa status Google Sheets: ${e.message}`
      };
    }
  }

  public async testConnection(): Promise<{
    success: boolean;
    spreadsheetTitle?: string;
    sheetCount?: number;
    sheets: { name: string; rowCount: number }[];
    message: string;
    details?: any;
  }> {
    const creds = this.getCredentials();
    if (!creds.isComplete) {
      return {
        success: false,
        sheets: [],
        message: 'Kredensial belum lengkap. Pastikan SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_PRIVATE_KEY telah diisi.'
      };
    }

    try {
      const serviceAccountAuth = new JWT({
        email: creds.clientEmail,
        key: creds.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const testDoc = new GoogleSpreadsheet(creds.spreadsheetId, serviceAccountAuth);
      await testDoc.loadInfo();
      this.doc = testDoc;
      this.isGoogleSheetsConfigured = true;

      // Ensure 6 sheets exist
      const expectedSheets: Record<string, string[]> = {
        Admins: ['id', 'username', 'password', 'nama_lengkap', 'role'],
        Anggota: ['id_anggota', 'nama', 'status', 'no_telepon', 'alamat', 'created_at'],
        Kategori: ['id_kategori', 'nama_kategori', 'is_kas_utama', 'target_nominal', 'deskripsi', 'color'],
        Transaksi_Kas: ['id_transaksi', 'id_anggota', 'periode_bulan', 'jumlah', 'jenis', 'tanggal', 'keterangan'],
        Transaksi_Lain: ['id_transaksi', 'id_kategori', 'id_anggota', 'jumlah', 'jenis', 'tanggal', 'keterangan'],
        Pengaturan: ['key', 'value']
      };

      const sheetsInfo: { name: string; rowCount: number }[] = [];

      for (const [title, headerValues] of Object.entries(expectedSheets)) {
        let sheet = testDoc.sheetsByTitle[title];
        if (!sheet) {
          sheet = await testDoc.addSheet({ title, headerValues });
        }
        const rows = await sheet.getRows();
        sheetsInfo.push({
          name: title,
          rowCount: rows.length
        });
      }

      return {
        success: true,
        spreadsheetTitle: testDoc.title,
        sheetCount: Object.keys(testDoc.sheetsByTitle).length,
        sheets: sheetsInfo,
        message: `Koneksi Google Sheets Berhasil! Terhubung ke "${testDoc.title}" dengan akses Service Account ${creds.clientEmail}.`
      };
    } catch (err: any) {
      console.error('Test connection error:', err);
      this.isGoogleSheetsConfigured = false;
      return {
        success: false,
        sheets: [],
        message: `Uji koneksi gagal: ${err.message}. Pastikan Spreadsheet sudah dibagikan (Share) dengan izin Editor ke email Service Account.`
      };
    }
  }

  public async syncAllToGoogleSheets(): Promise<{ success: boolean; message: string; syncedTabs: string[] }> {
    const creds = this.getCredentials();
    if (!creds.isComplete) {
      return {
        success: false,
        message: 'Kredensial Google Sheets belum dikonfigurasi.',
        syncedTabs: []
      };
    }

    try {
      const serviceAccountAuth = new JWT({
        email: creds.clientEmail,
        key: creds.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const doc = new GoogleSpreadsheet(creds.spreadsheetId, serviceAccountAuth);
      await doc.loadInfo();
      this.doc = doc;
      this.isGoogleSheetsConfigured = true;

      const syncedTabs: string[] = [];

      // 1. Admins
      let sheetAdmin = doc.sheetsByTitle['Admins'];
      if (!sheetAdmin) {
        sheetAdmin = await doc.addSheet({ title: 'Admins', headerValues: ['id', 'username', 'password', 'nama_lengkap', 'role'] });
      }
      await sheetAdmin.clearRows();
      if (this.data.admins.length > 0) {
        await sheetAdmin.addRows(this.data.admins.map((a: Admin) => ({
          id: a.id,
          username: a.username,
          password: a.password,
          nama_lengkap: a.nama_lengkap || '',
          role: a.role || 'Admin'
        })));
      }
      syncedTabs.push('Admins');

      // 2. Anggota
      let sheetAnggota = doc.sheetsByTitle['Anggota'];
      if (!sheetAnggota) {
        sheetAnggota = await doc.addSheet({ title: 'Anggota', headerValues: ['id_anggota', 'nama', 'status', 'no_telepon', 'alamat', 'created_at'] });
      }
      await sheetAnggota.clearRows();
      if (this.data.anggota.length > 0) {
        await sheetAnggota.addRows(this.data.anggota.map((a: Anggota) => ({
          id_anggota: a.id_anggota,
          nama: a.nama,
          status: a.status,
          no_telepon: a.no_telepon || '',
          alamat: a.alamat || '',
          created_at: a.created_at || ''
        })));
      }
      syncedTabs.push('Anggota');

      // 3. Kategori
      let sheetKat = doc.sheetsByTitle['Kategori'];
      if (!sheetKat) {
        sheetKat = await doc.addSheet({ title: 'Kategori', headerValues: ['id_kategori', 'nama_kategori', 'is_kas_utama', 'target_nominal', 'deskripsi', 'color'] });
      }
      await sheetKat.clearRows();
      if (this.data.kategori.length > 0) {
        await sheetKat.addRows(this.data.kategori.map((k: Kategori) => ({
          id_kategori: k.id_kategori,
          nama_kategori: k.nama_kategori,
          is_kas_utama: String(k.is_kas_utama),
          target_nominal: String(k.target_nominal || 0),
          deskripsi: k.deskripsi || '',
          color: k.color || '#3b82f6'
        })));
      }
      syncedTabs.push('Kategori');

      // 4. Transaksi_Kas
      let sheetKas = doc.sheetsByTitle['Transaksi_Kas'];
      if (!sheetKas) {
        sheetKas = await doc.addSheet({ title: 'Transaksi_Kas', headerValues: ['id_transaksi', 'id_anggota', 'periode_bulan', 'jumlah', 'jenis', 'tanggal', 'keterangan'] });
      }
      await sheetKas.clearRows();
      if (this.data.transaksi_kas.length > 0) {
        await sheetKas.addRows(this.data.transaksi_kas.map((t: TransaksiKas) => ({
          id_transaksi: t.id_transaksi,
          id_anggota: t.id_anggota,
          periode_bulan: t.periode_bulan,
          jumlah: String(t.jumlah),
          jenis: t.jenis,
          tanggal: t.tanggal,
          keterangan: t.keterangan || ''
        })));
      }
      syncedTabs.push('Transaksi_Kas');

      // 5. Transaksi_Lain
      let sheetLain = doc.sheetsByTitle['Transaksi_Lain'];
      if (!sheetLain) {
        sheetLain = await doc.addSheet({ title: 'Transaksi_Lain', headerValues: ['id_transaksi', 'id_kategori', 'id_anggota', 'jumlah', 'jenis', 'tanggal', 'keterangan'] });
      }
      await sheetLain.clearRows();
      if (this.data.transaksi_lain.length > 0) {
        await sheetLain.addRows(this.data.transaksi_lain.map((t: TransaksiLain) => ({
          id_transaksi: t.id_transaksi,
          id_kategori: t.id_kategori,
          id_anggota: t.id_anggota || '',
          jumlah: String(t.jumlah),
          jenis: t.jenis,
          tanggal: t.tanggal,
          keterangan: t.keterangan || ''
        })));
      }
      syncedTabs.push('Transaksi_Lain');

      // 6. Pengaturan
      let sheetPengaturan = doc.sheetsByTitle['Pengaturan'];
      if (!sheetPengaturan) {
        sheetPengaturan = await doc.addSheet({ title: 'Pengaturan', headerValues: ['key', 'value'] });
      }
      await sheetPengaturan.clearRows();
      if (this.data.pengaturan.length > 0) {
        await sheetPengaturan.addRows(this.data.pengaturan.map((p: PengaturanItem) => ({
          key: p.key,
          value: p.value
        })));
      }
      syncedTabs.push('Pengaturan');

      return {
        success: true,
        message: `Sinkronisasi Penuh Berhasil! Seluruh 6 tab (${syncedTabs.join(', ')}) pada Spreadsheet "${doc.title}" berhasil diperbarui.`,
        syncedTabs
      };
    } catch (err: any) {
      console.error('Error syncing to Google Sheets:', err);
      return {
        success: false,
        message: `Sinkronisasi gagal: ${err.message}`,
        syncedTabs: []
      };
    }
  }

  public async pullFromGoogleSheets(): Promise<{ success: boolean; message: string; stats?: any }> {
    const creds = this.getCredentials();
    if (!creds.isComplete) {
      return {
        success: false,
        message: 'Kredensial Google Sheets belum lengkap.'
      };
    }

    try {
      const serviceAccountAuth = new JWT({
        email: creds.clientEmail,
        key: creds.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const doc = new GoogleSpreadsheet(creds.spreadsheetId, serviceAccountAuth);
      await doc.loadInfo();
      this.doc = doc;
      this.isGoogleSheetsConfigured = true;

      // 1. Read Admins
      const sheetAdmin = doc.sheetsByTitle['Admins'];
      if (sheetAdmin) {
        const rows = await sheetAdmin.getRows();
        if (rows.length > 0) {
          this.data.admins = rows.map((r: any) => ({
            id: r.get('id') || `adm-${Math.random()}`,
            username: r.get('username') || '',
            password: r.get('password') || '',
            nama_lengkap: r.get('nama_lengkap') || undefined,
            role: r.get('role') || 'Admin'
          }));
        }
      }

      // 2. Read Anggota
      const sheetAnggota = doc.sheetsByTitle['Anggota'];
      if (sheetAnggota) {
        const rows = await sheetAnggota.getRows();
        if (rows.length > 0) {
          this.data.anggota = rows.map((r: any) => ({
            id_anggota: r.get('id_anggota') || '',
            nama: r.get('nama') || '',
            status: (r.get('status') === 'Non-aktif' ? 'Non-aktif' : 'Aktif') as 'Aktif' | 'Non-aktif',
            no_telepon: r.get('no_telepon') || '',
            alamat: r.get('alamat') || '',
            created_at: r.get('created_at') || new Date().toISOString().split('T')[0]
          }));
        }
      }

      // 3. Read Kategori
      const sheetKat = doc.sheetsByTitle['Kategori'];
      if (sheetKat) {
        const rows = await sheetKat.getRows();
        if (rows.length > 0) {
          this.data.kategori = rows.map((r: any) => ({
            id_kategori: r.get('id_kategori') || '',
            nama_kategori: r.get('nama_kategori') || '',
            is_kas_utama: r.get('is_kas_utama') === 'true' || r.get('id_kategori') === 'KAT-KAS-01',
            target_nominal: Number(r.get('target_nominal')) || 0,
            deskripsi: r.get('deskripsi') || '',
            color: r.get('color') || '#3b82f6'
          }));
        }
      }

      // 4. Read Transaksi_Kas
      const sheetKas = doc.sheetsByTitle['Transaksi_Kas'];
      if (sheetKas) {
        const rows = await sheetKas.getRows();
        if (rows.length > 0) {
          this.data.transaksi_kas = rows.map((r: any) => ({
            id_transaksi: r.get('id_transaksi') || '',
            id_anggota: r.get('id_anggota') || '',
            periode_bulan: r.get('periode_bulan') || '',
            jumlah: Number(r.get('jumlah')) || 0,
            jenis: (r.get('jenis') === 'keluar' ? 'keluar' : 'masuk') as 'masuk' | 'keluar',
            tanggal: r.get('tanggal') || new Date().toISOString().split('T')[0],
            keterangan: r.get('keterangan') || ''
          }));
        }
      }

      // 5. Read Transaksi_Lain
      const sheetLain = doc.sheetsByTitle['Transaksi_Lain'];
      if (sheetLain) {
        const rows = await sheetLain.getRows();
        if (rows.length > 0) {
          this.data.transaksi_lain = rows.map((r: any) => ({
            id_transaksi: r.get('id_transaksi') || '',
            id_kategori: r.get('id_kategori') || '',
            id_anggota: r.get('id_anggota') || '',
            jumlah: Number(r.get('jumlah')) || 0,
            jenis: (r.get('jenis') === 'keluar' ? 'keluar' : 'masuk') as 'masuk' | 'keluar',
            tanggal: r.get('tanggal') || new Date().toISOString().split('T')[0],
            keterangan: r.get('keterangan') || ''
          }));
        }
      }

      // 6. Read Pengaturan
      const sheetPengaturan = doc.sheetsByTitle['Pengaturan'];
      if (sheetPengaturan) {
        const rows = await sheetPengaturan.getRows();
        if (rows.length > 0) {
          this.data.pengaturan = rows.map((r: any) => ({
            key: r.get('key') || '',
            value: r.get('value') || ''
          }));
        }
      }

      this.saveToDisk();

      return {
        success: true,
        message: `Berhasil menarik data terbaru dari Spreadsheet "${doc.title}"!`,
        stats: {
          anggota: this.data.anggota.length,
          kategori: this.data.kategori.length,
          transaksi_kas: this.data.transaksi_kas.length,
          transaksi_lain: this.data.transaksi_lain.length
        }
      };
    } catch (err: any) {
      console.error('Error pulling from Google Sheets:', err);
      return {
        success: false,
        message: `Gagal menarik data dari Google Sheets: ${err.message}`
      };
    }
  }

  public async initGoogleSheets(): Promise<{ configured: boolean; message: string; sheetsCreated: string[] }> {
    const creds = this.getCredentials();
    if (!creds.isComplete) {
      this.isGoogleSheetsConfigured = false;
      return {
        configured: false,
        message: 'Google Sheets credentials belum lengkap di .env. Menggunakan Local Storage Persisten.',
        sheetsCreated: ['Admins', 'Anggota', 'Kategori', 'Transaksi_Kas', 'Transaksi_Lain', 'Pengaturan']
      };
    }

    try {
      const serviceAccountAuth = new JWT({
        email: creds.clientEmail,
        key: creds.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const doc = new GoogleSpreadsheet(creds.spreadsheetId, serviceAccountAuth);
      await doc.loadInfo();
      this.doc = doc;
      this.isGoogleSheetsConfigured = true;

      const expectedSheets: Record<string, string[]> = {
        Admins: ['id', 'username', 'password', 'nama_lengkap', 'role'],
        Anggota: ['id_anggota', 'nama', 'status', 'no_telepon', 'alamat', 'created_at'],
        Kategori: ['id_kategori', 'nama_kategori', 'is_kas_utama', 'target_nominal', 'deskripsi', 'color'],
        Transaksi_Kas: ['id_transaksi', 'id_anggota', 'periode_bulan', 'jumlah', 'jenis', 'tanggal', 'keterangan'],
        Transaksi_Lain: ['id_transaksi', 'id_kategori', 'id_anggota', 'jumlah', 'jenis', 'tanggal', 'keterangan'],
        Pengaturan: ['key', 'value']
      };

      const sheetsCreated: string[] = [];

      for (const [title, headerValues] of Object.entries(expectedSheets)) {
        let sheet = doc.sheetsByTitle[title];
        if (!sheet) {
          sheet = await doc.addSheet({ title, headerValues });
          sheetsCreated.push(title);

          // Seed default rows if new sheet
          if (title === 'Admins') {
            await sheet.addRows(this.data.admins.map((a: Admin) => ({ id: a.id, username: a.username, password: a.password, nama_lengkap: a.nama_lengkap || '', role: a.role || 'Admin' })));
          } else if (title === 'Anggota') {
            await sheet.addRows(this.data.anggota.map((a: Anggota) => ({ id_anggota: a.id_anggota, nama: a.nama, status: a.status, no_telepon: a.no_telepon || '', alamat: a.alamat || '', created_at: a.created_at || '' })));
          } else if (title === 'Kategori') {
            await sheet.addRows(this.data.kategori.map((k: Kategori) => ({ id_kategori: k.id_kategori, nama_kategori: k.nama_kategori, is_kas_utama: String(k.is_kas_utama), target_nominal: String(k.target_nominal || 0), deskripsi: k.deskripsi || '', color: k.color || '#3b82f6' })));
          } else if (title === 'Transaksi_Kas') {
            await sheet.addRows(this.data.transaksi_kas.map((t: TransaksiKas) => ({
              id_transaksi: t.id_transaksi,
              id_anggota: t.id_anggota,
              periode_bulan: t.periode_bulan,
              jumlah: String(t.jumlah),
              jenis: t.jenis,
              tanggal: t.tanggal,
              keterangan: t.keterangan || ''
            })));
          } else if (title === 'Transaksi_Lain') {
            await sheet.addRows(this.data.transaksi_lain.map((t: TransaksiLain) => ({
              id_transaksi: t.id_transaksi,
              id_kategori: t.id_kategori,
              id_anggota: t.id_anggota || '',
              jumlah: String(t.jumlah),
              jenis: t.jenis,
              tanggal: t.tanggal,
              keterangan: t.keterangan || ''
            })));
          } else if (title === 'Pengaturan') {
            await sheet.addRows(this.data.pengaturan.map((p: PengaturanItem) => ({ key: p.key, value: p.value })));
          }
        }
      }

      return {
        configured: true,
        message: `Terkoneksi ke Google Sheets: "${doc.title}". Seluruh 6 tab (${Object.keys(doc.sheetsByTitle).join(', ')}) aktif dan siap digunakan.`,
        sheetsCreated
      };
    } catch (err: any) {
      console.warn('Peringatan: Gagal sinkronisasi Google Sheets API, beralih ke Local Storage:', err.message);
      this.isGoogleSheetsConfigured = false;
      return {
        configured: false,
        message: `Koneksi Google Sheets gagal (${err.message}). Menggunakan Local Database dengan format tabel lengkap.`,
        sheetsCreated: ['Admins', 'Anggota', 'Kategori', 'Transaksi_Kas', 'Transaksi_Lain', 'Pengaturan']
      };
    }
  }

  // Background helper to automatically sync specific sheet tab when CRUD occurs
  public async syncTab(tabName: 'Admins' | 'Anggota' | 'Kategori' | 'Transaksi_Kas' | 'Transaksi_Lain' | 'Pengaturan'): Promise<void> {
    const creds = this.getCredentials();
    if (!creds.isComplete) return;

    try {
      if (!this.doc) {
        const serviceAccountAuth = new JWT({
          email: creds.clientEmail,
          key: creds.privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.doc = new GoogleSpreadsheet(creds.spreadsheetId, serviceAccountAuth);
        await this.doc.loadInfo();
        this.isGoogleSheetsConfigured = true;
      }

      const headers: Record<string, string[]> = {
        Admins: ['id', 'username', 'password', 'nama_lengkap', 'role'],
        Anggota: ['id_anggota', 'nama', 'status', 'no_telepon', 'alamat', 'created_at'],
        Kategori: ['id_kategori', 'nama_kategori', 'is_kas_utama', 'target_nominal', 'deskripsi', 'color'],
        Transaksi_Kas: ['id_transaksi', 'id_anggota', 'periode_bulan', 'jumlah', 'jenis', 'tanggal', 'keterangan'],
        Transaksi_Lain: ['id_transaksi', 'id_kategori', 'id_anggota', 'jumlah', 'jenis', 'tanggal', 'keterangan'],
        Pengaturan: ['key', 'value']
      };

      let sheet = this.doc.sheetsByTitle[tabName];
      if (!sheet) {
        sheet = await this.doc.addSheet({ title: tabName, headerValues: headers[tabName] });
      }

      await sheet.clearRows();

      if (tabName === 'Admins' && this.data.admins.length > 0) {
        await sheet.addRows(this.data.admins.map((a: Admin) => ({ id: a.id, username: a.username, password: a.password, nama_lengkap: a.nama_lengkap || '', role: a.role || 'Admin' })));
      } else if (tabName === 'Anggota' && this.data.anggota.length > 0) {
        await sheet.addRows(this.data.anggota.map((a: Anggota) => ({ id_anggota: a.id_anggota, nama: a.nama, status: a.status, no_telepon: a.no_telepon || '', alamat: a.alamat || '', created_at: a.created_at || '' })));
      } else if (tabName === 'Kategori' && this.data.kategori.length > 0) {
        await sheet.addRows(this.data.kategori.map((k: Kategori) => ({ id_kategori: k.id_kategori, nama_kategori: k.nama_kategori, is_kas_utama: String(k.is_kas_utama), target_nominal: String(k.target_nominal || 0), deskripsi: k.deskripsi || '', color: k.color || '#3b82f6' })));
      } else if (tabName === 'Transaksi_Kas' && this.data.transaksi_kas.length > 0) {
        await sheet.addRows(this.data.transaksi_kas.map((t: TransaksiKas) => ({ id_transaksi: t.id_transaksi, id_anggota: t.id_anggota, periode_bulan: t.periode_bulan, jumlah: String(t.jumlah), jenis: t.jenis, tanggal: t.tanggal, keterangan: t.keterangan || '' })));
      } else if (tabName === 'Transaksi_Lain' && this.data.transaksi_lain.length > 0) {
        await sheet.addRows(this.data.transaksi_lain.map((t: TransaksiLain) => ({ id_transaksi: t.id_transaksi, id_kategori: t.id_kategori, id_anggota: t.id_anggota || '', jumlah: String(t.jumlah), jenis: t.jenis, tanggal: t.tanggal, keterangan: t.keterangan || '' })));
      } else if (tabName === 'Pengaturan' && this.data.pengaturan.length > 0) {
        await sheet.addRows(this.data.pengaturan.map((p: PengaturanItem) => ({ key: p.key, value: p.value })));
      }

      console.log(`[Auto-Sync Realtime] Tab "${tabName}" berhasil disinkronkan otomatis.`);
    } catch (e: any) {
      console.warn(`[Auto-Sync Note] Gagal sync tab ${tabName} ke Google Sheets: ${e.message}`);
    }
  }

  // Non-blocking trigger for automatic real-time sync
  public triggerAutoSync(tabName: 'Admins' | 'Anggota' | 'Kategori' | 'Transaksi_Kas' | 'Transaksi_Lain' | 'Pengaturan') {
    setTimeout(() => {
      this.syncTab(tabName).catch(err => {
        console.warn(`[Auto-Sync Warning] ${err.message}`);
      });
    }, 150);
  }

  // Background helper to append a single row to Google Sheets if configured
  private async safeAppendRow(sheetTitle: string, rowData: any) {
    if (!this.isGoogleSheetsConfigured || !this.doc) return;
    try {
      const sheet = this.doc.sheetsByTitle[sheetTitle];
      if (sheet) {
        await sheet.addRow(rowData);
      }
    } catch (e) {
      console.warn(`Gagal auto-sync row ke tab ${sheetTitle}:`, e);
    }
  }

  // --- ADMINS ---
  public getAdmins(): Admin[] {
    return this.data.admins;
  }

  public findAdminByUsername(username: string): Admin | undefined {
    return this.data.admins.find((a: Admin) => a.username.toLowerCase() === username.trim().toLowerCase());
  }

  public updateAdminCredentials(currentUsername: string, newUsername?: string, newPassword?: string, newNama?: string): boolean {
    const admin = this.findAdminByUsername(currentUsername);
    if (!admin) return false;

    if (newUsername && newUsername.trim()) admin.username = newUsername.trim();
    if (newPassword && newPassword.trim()) admin.password = newPassword.trim();
    if (newNama && newNama.trim()) admin.nama_lengkap = newNama.trim();

    this.saveToDisk();
    this.triggerAutoSync('Admins');
    return true;
  }

  // --- ANGGOTA ---
  public getAnggota(): Anggota[] {
    return this.data.anggota;
  }

  public getAnggotaById(id: string): Anggota | undefined {
    return this.data.anggota.find((a: Anggota) => a.id_anggota === id);
  }

  public addAnggota(payload: Omit<Anggota, 'id_anggota'> & { id_anggota?: string }): Anggota {
    const nextId = payload.id_anggota || `ANG-${String(this.data.anggota.length + 1).padStart(3, '0')}`;
    const newAnggota: Anggota = {
      id_anggota: nextId,
      nama: payload.nama.trim(),
      status: payload.status || 'Aktif',
      no_telepon: payload.no_telepon || '',
      alamat: payload.alamat || '',
      created_at: payload.created_at || new Date().toISOString().split('T')[0]
    };
    this.data.anggota.push(newAnggota);
    this.saveToDisk();
    this.triggerAutoSync('Anggota');
    return newAnggota;
  }

  public updateAnggota(id: string, payload: Partial<Anggota>): Anggota | null {
    const idx = this.data.anggota.findIndex((a: Anggota) => a.id_anggota === id);
    if (idx === -1) return null;
    this.data.anggota[idx] = {
      ...this.data.anggota[idx],
      ...payload,
      id_anggota: id // prevent changing ID
    };
    this.saveToDisk();
    this.triggerAutoSync('Anggota');
    return this.data.anggota[idx];
  }

  public deleteAnggota(id: string): boolean {
    const initialLen = this.data.anggota.length;
    this.data.anggota = this.data.anggota.filter((a: Anggota) => a.id_anggota !== id);
    if (this.data.anggota.length !== initialLen) {
      this.saveToDisk();
      this.triggerAutoSync('Anggota');
      return true;
    }
    return false;
  }

  // --- KATEGORI ---
  public getKategori(): Kategori[] {
    return this.data.kategori;
  }

  public getKategoriById(id: string): Kategori | undefined {
    return this.data.kategori.find((k: Kategori) => k.id_kategori === id);
  }

  public addKategori(payload: { nama_kategori: string; target_nominal?: number; deskripsi?: string; color?: string }): Kategori {
    const id_kategori = `KAT-${Date.now().toString().slice(-4)}`;
    const newKat: Kategori = {
      id_kategori,
      nama_kategori: payload.nama_kategori.trim(),
      is_kas_utama: false, // User-created categories cannot be kas utama
      target_nominal: payload.target_nominal || 0,
      deskripsi: payload.deskripsi || '',
      color: payload.color || '#3b82f6'
    };
    this.data.kategori.push(newKat);
    this.saveToDisk();
    this.triggerAutoSync('Kategori');
    return newKat;
  }

  public updateKategori(id: string, payload: Partial<Kategori>): { success: boolean; error?: string; data?: Kategori } {
    const existing = this.getKategoriById(id);
    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan' };
    }
    // Strict Double Validation: Kas Utama cannot be modified
    if (existing.is_kas_utama === true) {
      return { success: false, error: 'Kas Utama RT 04 merupakan kategori sistem yang dilindungi dan tidak dapat diubah/diedit.' };
    }

    const idx = this.data.kategori.findIndex((k: Kategori) => k.id_kategori === id);
    this.data.kategori[idx] = {
      ...this.data.kategori[idx],
      ...payload,
      id_kategori: id,
      is_kas_utama: false // enforce false
    };
    this.saveToDisk();
    this.triggerAutoSync('Kategori');
    return { success: true, data: this.data.kategori[idx] };
  }

  public deleteKategori(id: string): { success: boolean; error?: string } {
    const existing = this.getKategoriById(id);
    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan' };
    }
    // Strict Double Validation: Kas Utama cannot be deleted
    if (existing.is_kas_utama === true) {
      return { success: false, error: 'Kas Utama RT 04 merupakan kategori sistem yang dilindungi dan tidak dapat dihapus.' };
    }

    this.data.kategori = this.data.kategori.filter((k: Kategori) => k.id_kategori !== id);
    // Also remove related transactions
    this.data.transaksi_lain = this.data.transaksi_lain.filter((t: TransaksiLain) => t.id_kategori !== id);
    this.saveToDisk();
    this.triggerAutoSync('Kategori');
    this.triggerAutoSync('Transaksi_Lain');
    return { success: true };
  }

  // --- TRANSAKSI KAS ---
  public getTransaksiKas(filters?: { periode_bulan?: string; id_anggota?: string; jenis?: 'masuk' | 'keluar' }): (TransaksiKas & { nama_anggota?: string })[] {
    let list = this.data.transaksi_kas as TransaksiKas[];
    if (filters?.periode_bulan) {
      list = list.filter(t => t.periode_bulan.toLowerCase() === filters.periode_bulan!.toLowerCase());
    }
    if (filters?.id_anggota) {
      list = list.filter(t => t.id_anggota === filters.id_anggota);
    }
    if (filters?.jenis) {
      list = list.filter(t => t.jenis === filters.jenis);
    }

    return list.map(t => {
      const anggota = this.getAnggotaById(t.id_anggota);
      return {
        ...t,
        nama_anggota: anggota ? anggota.nama : (t.jenis === 'keluar' ? 'Pengeluaran Kas RT' : 'Umum')
      };
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public addTransaksiKas(payload: Omit<TransaksiKas, 'id_transaksi'>): TransaksiKas {
    const id_transaksi = `TRK-${Date.now().toString().slice(-6)}`;
    const tx: TransaksiKas = {
      id_transaksi,
      id_anggota: payload.id_anggota || '',
      periode_bulan: payload.periode_bulan || this.getCurrentMonthYear(),
      jumlah: Number(payload.jumlah) || 0,
      jenis: payload.jenis || 'masuk',
      tanggal: payload.tanggal || new Date().toISOString().split('T')[0],
      keterangan: payload.keterangan || ''
    };
    this.data.transaksi_kas.push(tx);
    this.saveToDisk();
    this.triggerAutoSync('Transaksi_Kas');
    return tx;
  }

  public addMultiSelectKas(payload: {
    anggota_ids: string[];
    periode_bulan: string;
    jumlah: number;
    tanggal?: string;
    keterangan?: string;
  }): { count: number; transactions: TransaksiKas[] } {
    const transactions: TransaksiKas[] = [];
    const date = payload.tanggal || new Date().toISOString().split('T')[0];

    for (const id_anggota of payload.anggota_ids) {
      const anggota = this.getAnggotaById(id_anggota);
      if (!anggota) continue;

      // Check if already paid for this month
      const alreadyPaid = this.data.transaksi_kas.some(
        (t: TransaksiKas) => t.id_anggota === id_anggota && t.periode_bulan === payload.periode_bulan && t.jenis === 'masuk'
      );

      const id_transaksi = `TRK-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
      const tx: TransaksiKas = {
        id_transaksi,
        id_anggota,
        periode_bulan: payload.periode_bulan,
        jumlah: Number(payload.jumlah),
        jenis: 'masuk',
        tanggal: date,
        keterangan: payload.keterangan ? `${payload.keterangan} - ${anggota.nama}` : `Kas ${payload.periode_bulan} - ${anggota.nama}`
      };
      this.data.transaksi_kas.push(tx);
      transactions.push(tx);
    }

    this.saveToDisk();
    this.triggerAutoSync('Transaksi_Kas');
    return { count: transactions.length, transactions };
  }

  public deleteTransaksiKas(id: string): boolean {
    const initialLen = this.data.transaksi_kas.length;
    this.data.transaksi_kas = this.data.transaksi_kas.filter((t: TransaksiKas) => t.id_transaksi !== id);
    if (this.data.transaksi_kas.length !== initialLen) {
      this.saveToDisk();
      this.triggerAutoSync('Transaksi_Kas');
      return true;
    }
    return false;
  }

  // --- TRANSAKSI LAIN ---
  public getTransaksiLain(filters?: { id_kategori?: string; id_anggota?: string; jenis?: 'masuk' | 'keluar' }): (TransaksiLain & { nama_anggota?: string; nama_kategori?: string })[] {
    let list = this.data.transaksi_lain as TransaksiLain[];
    if (filters?.id_kategori) {
      list = list.filter(t => t.id_kategori === filters.id_kategori);
    }
    if (filters?.id_anggota) {
      list = list.filter(t => t.id_anggota === filters.id_anggota);
    }
    if (filters?.jenis) {
      list = list.filter(t => t.jenis === filters.jenis);
    }

    return list.map(t => {
      const anggota = t.id_anggota ? this.getAnggotaById(t.id_anggota) : null;
      const kategori = this.getKategoriById(t.id_kategori);
      return {
        ...t,
        nama_anggota: anggota ? anggota.nama : (t.nama_anggota || (t.jenis === 'keluar' ? 'Pengeluaran Kategori' : 'Non-Anggota / Umum')),
        nama_kategori: kategori ? kategori.nama_kategori : 'Kategori'
      };
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public addTransaksiLain(payload: Omit<TransaksiLain, 'id_transaksi'>): TransaksiLain {
    const id_transaksi = `TRL-${Date.now().toString().slice(-6)}`;
    const tx: TransaksiLain = {
      id_transaksi,
      id_kategori: payload.id_kategori,
      id_anggota: payload.id_anggota || '',
      nama_anggota: payload.nama_anggota || '',
      jumlah: Number(payload.jumlah) || 0,
      jenis: payload.jenis || 'masuk',
      tanggal: payload.tanggal || new Date().toISOString().split('T')[0],
      keterangan: payload.keterangan || ''
    };
    this.data.transaksi_lain.push(tx);
    this.saveToDisk();
    this.triggerAutoSync('Transaksi_Lain');
    return tx;
  }

  public addMultiSelectIuranLain(payload: {
    id_kategori: string;
    anggota_ids: string[];
    jumlah: number;
    tanggal?: string;
    keterangan?: string;
  }): { count: number; transactions: TransaksiLain[] } {
    const kat = this.getKategoriById(payload.id_kategori);
    if (!kat) throw new Error('Kategori tidak valid');

    const transactions: TransaksiLain[] = [];
    const date = payload.tanggal || new Date().toISOString().split('T')[0];

    for (const id_anggota of payload.anggota_ids) {
      const anggota = this.getAnggotaById(id_anggota);
      if (!anggota) continue;

      const id_transaksi = `TRL-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
      const tx: TransaksiLain = {
        id_transaksi,
        id_kategori: payload.id_kategori,
        id_anggota,
        jumlah: Number(payload.jumlah),
        jenis: 'masuk',
        tanggal: date,
        keterangan: payload.keterangan ? `${payload.keterangan} - ${anggota.nama}` : `${kat.nama_kategori} - ${anggota.nama}`
      };
      this.data.transaksi_lain.push(tx);
      transactions.push(tx);
    }

    this.saveToDisk();
    this.triggerAutoSync('Transaksi_Lain');
    return { count: transactions.length, transactions };
  }

  public deleteTransaksiLain(id: string): boolean {
    const initialLen = this.data.transaksi_lain.length;
    this.data.transaksi_lain = this.data.transaksi_lain.filter((t: TransaksiLain) => t.id_transaksi !== id);
    if (this.data.transaksi_lain.length !== initialLen) {
      this.saveToDisk();
      this.triggerAutoSync('Transaksi_Lain');
      return true;
    }
    return false;
  }

  // --- PENGATURAN ---
  public getPengaturan(): PengaturanItem[] {
    return this.data.pengaturan;
  }

  public getPengaturanMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const item of this.data.pengaturan) {
      map[item.key] = item.value;
    }
    return map;
  }

  public updatePengaturan(key: string, value: string): void {
    const idx = this.data.pengaturan.findIndex((p: PengaturanItem) => p.key === key);
    if (idx !== -1) {
      this.data.pengaturan[idx].value = value;
    } else {
      this.data.pengaturan.push({ key, value });
    }
    this.saveToDisk();
    this.triggerAutoSync('Pengaturan');
  }

  public batchUpdatePengaturan(items: Record<string, string>): void {
    for (const [key, value] of Object.entries(items)) {
      const idx = this.data.pengaturan.findIndex((p: PengaturanItem) => p.key === key);
      if (idx !== -1) {
        this.data.pengaturan[idx].value = value;
      } else {
        this.data.pengaturan.push({ key, value });
      }
    }
    this.saveToDisk();
    this.triggerAutoSync('Pengaturan');
  }

  // --- DASHBOARD STATS ---
  public getDashboardStats(): DashboardStats {
    const kasMasuk = this.data.transaksi_kas
      .filter((t: TransaksiKas) => t.jenis === 'masuk')
      .reduce((sum: number, t: TransaksiKas) => sum + Number(t.jumlah), 0);

    const kasKeluar = this.data.transaksi_kas
      .filter((t: TransaksiKas) => t.jenis === 'keluar')
      .reduce((sum: number, t: TransaksiKas) => sum + Number(t.jumlah), 0);

    const lainMasuk = this.data.transaksi_lain
      .filter((t: TransaksiLain) => t.jenis === 'masuk')
      .reduce((sum: number, t: TransaksiLain) => sum + Number(t.jumlah), 0);

    const lainKeluar = this.data.transaksi_lain
      .filter((t: TransaksiLain) => t.jenis === 'keluar')
      .reduce((sum: number, t: TransaksiLain) => sum + Number(t.jumlah), 0);

    const totalAnggota = this.data.anggota.length;
    const anggotaAktif = this.data.anggota.filter((a: Anggota) => a.status === 'Aktif').length;
    const anggotaNonaktif = this.data.anggota.filter((a: Anggota) => a.status === 'Non-aktif').length;

    // Per category breakdown
    const kategoriBreakdown = this.data.kategori.map((k: Kategori) => {
      let masuk = 0;
      let keluar = 0;

      if (k.is_kas_utama) {
        masuk = kasMasuk;
        keluar = kasKeluar;
      } else {
        masuk = this.data.transaksi_lain
          .filter((t: TransaksiLain) => t.id_kategori === k.id_kategori && t.jenis === 'masuk')
          .reduce((sum: number, t: TransaksiLain) => sum + Number(t.jumlah), 0);
        keluar = this.data.transaksi_lain
          .filter((t: TransaksiLain) => t.id_kategori === k.id_kategori && t.jenis === 'keluar')
          .reduce((sum: number, t: TransaksiLain) => sum + Number(t.jumlah), 0);
      }

      return {
        id_kategori: k.id_kategori,
        nama_kategori: k.nama_kategori,
        is_kas_utama: k.is_kas_utama,
        total_masuk: masuk,
        total_keluar: keluar,
        saldo: masuk - keluar
      };
    });

    // Recent combined transactions (last 10)
    const recentKas = this.data.transaksi_kas.map((t: TransaksiKas) => {
      const agg = this.getAnggotaById(t.id_anggota);
      return {
        id: t.id_transaksi,
        type: 'kas' as const,
        kategori_nama: 'Kas Utama RT 04',
        nama_anggota: agg ? agg.nama : (t.jenis === 'keluar' ? 'Pengeluaran Kas RT' : 'Kas RT'),
        periode: t.periode_bulan,
        jumlah: t.jumlah,
        jenis: t.jenis,
        tanggal: t.tanggal,
        keterangan: t.keterangan
      };
    });

    const recentLain = this.data.transaksi_lain.map((t: TransaksiLain) => {
      const agg = t.id_anggota ? this.getAnggotaById(t.id_anggota) : null;
      const kat = this.getKategoriById(t.id_kategori);
      return {
        id: t.id_transaksi,
        type: 'lain' as const,
        kategori_nama: kat ? kat.nama_kategori : 'Iuran Lain',
        nama_anggota: agg ? agg.nama : (t.jenis === 'keluar' ? 'Pengeluaran Iuran' : 'Kolektif'),
        periode: undefined,
        jumlah: t.jumlah,
        jenis: t.jenis,
        tanggal: t.tanggal,
        keterangan: t.keterangan
      };
    });

    const allRecent = [...recentKas, ...recentLain]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .slice(0, 10);

    // Monthly Trend computed from actual transactions
    const months = ['Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'];
    const monthlyTrend = months.map(m => {
      const monthRegex = new RegExp(m, 'i');
      
      const kasMasukBulan = this.data.transaksi_kas
        .filter((t: TransaksiKas) => t.jenis === 'masuk' && (monthRegex.test(t.periode_bulan) || monthRegex.test(t.tanggal)))
        .reduce((sum: number, t: TransaksiKas) => sum + Number(t.jumlah), 0);

      const kasKeluarBulan = this.data.transaksi_kas
        .filter((t: TransaksiKas) => t.jenis === 'keluar' && (monthRegex.test(t.periode_bulan) || monthRegex.test(t.tanggal)))
        .reduce((sum: number, t: TransaksiKas) => sum + Number(t.jumlah), 0);

      const lainMasukBulan = this.data.transaksi_lain
        .filter((t: TransaksiLain) => t.jenis === 'masuk' && monthRegex.test(t.tanggal))
        .reduce((sum: number, t: TransaksiLain) => sum + Number(t.jumlah), 0);

      const lainKeluarBulan = this.data.transaksi_lain
        .filter((t: TransaksiLain) => t.jenis === 'keluar' && monthRegex.test(t.tanggal))
        .reduce((sum: number, t: TransaksiLain) => sum + Number(t.jumlah), 0);

      return {
        bulan: m,
        pemasukan: kasMasukBulan + lainMasukBulan,
        pengeluaran: kasKeluarBulan + lainKeluarBulan
      };
    });

    return {
      total_kas: kasMasuk,
      total_iuran_lain: lainMasuk,
      pengeluaran_kas: kasKeluar,
      pengeluaran_lain: lainKeluar,
      saldo_kas: kasMasuk - kasKeluar,
      saldo_iuran_lain: lainMasuk - lainKeluar,
      total_saldo: (kasMasuk + lainMasuk) - (kasKeluar + lainKeluar),
      total_anggota: totalAnggota,
      total_anggota_aktif: anggotaAktif,
      total_anggota_nonaktif: anggotaNonaktif,
      kategori_list: kategoriBreakdown,
      recent_transactions: allRecent,
      monthly_trend: monthlyTrend
    };
  }

  // Reset to default seed
  public resetToDefault(): void {
    this.data = JSON.parse(JSON.stringify(defaultData));
    this.saveToDisk();
  }

  private getCurrentMonthYear(): string {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date();
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}

export const db = new DatabaseManager();
