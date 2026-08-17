import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for Android Client & Web
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Try initializing Google Sheets in background if env exists
  db.initGoogleSheets().then(res => {
    console.log('[Database Status]', res.message);
  }).catch(e => {
    console.warn('[Database Init Note]', e);
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Kas & Iuran Remaja RT 04 API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // 1. GET /api/init - Trigger Auto-Generate Format Database Sheets
  app.get('/api/init', async (req: Request, res: Response) => {
    try {
      const result = await db.initGoogleSheets();
      res.json({
        success: true,
        message: result.message,
        configured_google_sheets: result.configured,
        sheets: result.sheetsCreated,
        total_anggota: db.getAnggota().length,
        total_kategori: db.getKategori().length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Google Sheets Testing & Synchronization API
  app.get('/api/sheets/status', async (req: Request, res: Response) => {
    try {
      const status = await db.getSheetsStatus();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sheets/test', async (req: Request, res: Response) => {
    try {
      const result = await db.testConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: `Error test: ${err.message}` });
    }
  });

  app.post('/api/sheets/sync', async (req: Request, res: Response) => {
    try {
      const result = await db.syncAllToGoogleSheets();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: `Error sync: ${err.message}` });
    }
  });

  app.post('/api/sheets/pull', async (req: Request, res: Response) => {
    try {
      const result = await db.pullFromGoogleSheets();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: `Error pull: ${err.message}` });
    }
  });

  // 2. POST /api/login - Check username & password (supports multi admin)
  app.post('/api/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
      return;
    }

    try {
      // Pull latest data from Google Sheets in case admin credentials were changed manually
      await db.pullFromGoogleSheets();
    } catch (e) {
      console.warn('Failed to pull from Google Sheets during login:', e);
    }

    const admin = db.findAdminByUsername(username);
    if (!admin || admin.password !== password) {
      res.status(401).json({ success: false, message: 'Username atau password salah' });
      return;
    }

    // Return sanitized admin object + token
    res.json({
      success: true,
      message: `Selamat datang, ${admin.nama_lengkap || admin.username}`,
      token: `token_${admin.id}_${Date.now()}`,
      admin: {
        id: admin.id,
        username: admin.username,
        nama_lengkap: admin.nama_lengkap || 'Pengurus RT 04',
        role: admin.role || 'Admin'
      }
    });
  });

  // 3. GET /api/dashboard - 5 Card Indicators + Statistics
  app.get('/api/dashboard', (req: Request, res: Response) => {
    try {
      const stats = db.getDashboardStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. CRUD /api/anggota
  app.get('/api/anggota', (req: Request, res: Response) => {
    try {
      const list = db.getAnggota();
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/anggota', (req: Request, res: Response) => {
    try {
      const { nama, status, no_telepon, alamat } = req.body;
      if (!nama || !nama.trim()) {
        res.status(400).json({ success: false, message: 'Nama anggota wajib diisi' });
        return;
      }
      const newAnggota = db.addAnggota({ nama, status, no_telepon, alamat });
      res.status(201).json({ success: true, message: 'Anggota berhasil ditambahkan', data: newAnggota });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/anggota', (req: Request, res: Response) => {
    try {
      const { id_anggota, nama, status, no_telepon, alamat } = req.body;
      if (!id_anggota) {
        res.status(400).json({ success: false, message: 'id_anggota wajib disertakan' });
        return;
      }
      const updated = db.updateAnggota(id_anggota, { nama, status, no_telepon, alamat });
      if (!updated) {
        res.status(404).json({ success: false, message: 'Anggota tidak ditemukan' });
        return;
      }
      res.json({ success: true, message: 'Data anggota berhasil diperbarui', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/anggota', (req: Request, res: Response) => {
    try {
      const id = (req.query.id as string) || req.body.id_anggota;
      if (!id) {
        res.status(400).json({ success: false, message: 'id_anggota wajib disertakan' });
        return;
      }
      const deleted = db.deleteAnggota(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Anggota tidak ditemukan' });
        return;
      }
      res.json({ success: true, message: 'Anggota berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. CRUD /api/kategori (With double validation: Reject PUT/DELETE if is_kas_utama)
  app.get('/api/kategori', (req: Request, res: Response) => {
    try {
      const list = db.getKategori();
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/kategori', (req: Request, res: Response) => {
    try {
      const { nama_kategori, target_nominal, deskripsi, color } = req.body;
      if (!nama_kategori || !nama_kategori.trim()) {
        res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
        return;
      }
      const newKat = db.addKategori({ nama_kategori, target_nominal, deskripsi, color });
      res.status(201).json({ success: true, message: 'Kategori baru berhasil dibuat', data: newKat });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/kategori', (req: Request, res: Response) => {
    try {
      const { id_kategori, nama_kategori, target_nominal, deskripsi, color } = req.body;
      if (!id_kategori) {
        res.status(400).json({ success: false, message: 'id_kategori wajib disertakan' });
        return;
      }

      // Backend double validation check
      const result = db.updateKategori(id_kategori, { nama_kategori, target_nominal, deskripsi, color });
      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.json({ success: true, message: 'Kategori berhasil diperbarui', data: result.data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/kategori', (req: Request, res: Response) => {
    try {
      const id = (req.query.id as string) || req.body.id_kategori;
      if (!id) {
        res.status(400).json({ success: false, message: 'id_kategori wajib disertakan' });
        return;
      }

      // Backend double validation check
      const result = db.deleteKategori(id);
      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.json({ success: true, message: 'Kategori berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. KAS UTAMA TRANSACTIONS & MULTISELECT
  app.get('/api/transaksi-kas', (req: Request, res: Response) => {
    try {
      const { periode_bulan, id_anggota, jenis } = req.query;
      const list = db.getTransaksiKas({
        periode_bulan: periode_bulan as string,
        id_anggota: id_anggota as string,
        jenis: jenis as ('masuk' | 'keluar')
      });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/transaksi-kas', (req: Request, res: Response) => {
    try {
      const { id_anggota, periode_bulan, jumlah, jenis, tanggal, keterangan } = req.body;
      if (!jumlah || jumlah <= 0) {
        res.status(400).json({ success: false, message: 'Jumlah nominal harus lebih dari 0' });
        return;
      }
      const tx = db.addTransaksiKas({
        id_anggota: id_anggota || '',
        periode_bulan: periode_bulan || '',
        jumlah: Number(jumlah),
        jenis: jenis || 'masuk',
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        keterangan: keterangan || ''
      });
      res.status(201).json({ success: true, message: 'Transaksi kas berhasil dicatat', data: tx });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/kas/multiselect - Input pembayaran kas massal dengan acuan periode_bulan
  app.post('/api/kas/multiselect', (req: Request, res: Response) => {
    try {
      const { anggota_ids, periode_bulan, jumlah, tanggal, keterangan } = req.body;

      if (!Array.isArray(anggota_ids) || anggota_ids.length === 0) {
        res.status(400).json({ success: false, message: 'Pilih minimal satu anggota' });
        return;
      }
      if (!periode_bulan || !periode_bulan.trim()) {
        res.status(400).json({ success: false, message: 'Periode bulan wajib dipilih' });
        return;
      }
      if (!jumlah || Number(jumlah) <= 0) {
        res.status(400).json({ success: false, message: 'Nominal iuran per orang wajib diisi' });
        return;
      }

      const result = db.addMultiSelectKas({
        anggota_ids,
        periode_bulan: periode_bulan.trim(),
        jumlah: Number(jumlah),
        tanggal,
        keterangan
      });

      res.status(201).json({
        success: true,
        message: `Berhasil mencatat pembayaran kas untuk ${result.count} anggota pada periode ${periode_bulan}`,
        total_pembayaran: result.count * Number(jumlah),
        data: result.transactions
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/transaksi-kas', (req: Request, res: Response) => {
    try {
      const id = (req.query.id as string) || req.body.id_transaksi;
      if (!id) {
        res.status(400).json({ success: false, message: 'id_transaksi wajib disertakan' });
        return;
      }
      const deleted = db.deleteTransaksiKas(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Transaksi kas tidak ditemukan' });
        return;
      }
      res.json({ success: true, message: 'Transaksi kas berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. TRANSAKSI IURAN LAIN & MULTISELECT
  app.get('/api/transaksi-lain', (req: Request, res: Response) => {
    try {
      const { id_kategori, id_anggota, jenis } = req.query;
      const list = db.getTransaksiLain({
        id_kategori: id_kategori as string,
        id_anggota: id_anggota as string,
        jenis: jenis as ('masuk' | 'keluar')
      });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/transaksi-lain', (req: Request, res: Response) => {
    try {
      const { id_kategori, id_anggota, nama_anggota, nama_pembayar, jumlah, jenis, tanggal, keterangan } = req.body;
      if (!id_kategori) {
        res.status(400).json({ success: false, message: 'id_kategori wajib disertakan' });
        return;
      }
      if (!jumlah || Number(jumlah) <= 0) {
        res.status(400).json({ success: false, message: 'Jumlah nominal harus lebih dari 0' });
        return;
      }
      const tx = db.addTransaksiLain({
        id_kategori,
        id_anggota: id_anggota || '',
        nama_anggota: nama_anggota || nama_pembayar || '',
        jumlah: Number(jumlah),
        jenis: jenis || 'masuk',
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        keterangan: keterangan || ''
      });
      res.status(201).json({ success: true, message: 'Transaksi iuran lain berhasil dicatat', data: tx });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/iuran-lain/multiselect - Input iuran lain massal tanpa acuan bulan
  app.post('/api/iuran-lain/multiselect', (req: Request, res: Response) => {
    try {
      const { id_kategori, anggota_ids, jumlah, tanggal, keterangan } = req.body;

      if (!id_kategori) {
        res.status(400).json({ success: false, message: 'Kategori iuran wajib dipilih' });
        return;
      }
      if (!Array.isArray(anggota_ids) || anggota_ids.length === 0) {
        res.status(400).json({ success: false, message: 'Pilih minimal satu anggota' });
        return;
      }
      if (!jumlah || Number(jumlah) <= 0) {
        res.status(400).json({ success: false, message: 'Nominal iuran per orang wajib diisi' });
        return;
      }

      const result = db.addMultiSelectIuranLain({
        id_kategori,
        anggota_ids,
        jumlah: Number(jumlah),
        tanggal,
        keterangan
      });

      res.status(201).json({
        success: true,
        message: `Berhasil mencatat iuran untuk ${result.count} anggota`,
        total_pembayaran: result.count * Number(jumlah),
        data: result.transactions
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/transaksi-lain', (req: Request, res: Response) => {
    try {
      const id = (req.query.id as string) || req.body.id_transaksi;
      if (!id) {
        res.status(400).json({ success: false, message: 'id_transaksi wajib disertakan' });
        return;
      }
      const deleted = db.deleteTransaksiLain(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        return;
      }
      res.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. PUT /api/admin/update-credentials - Ubah username / password admin
  app.put('/api/admin/update-credentials', (req: Request, res: Response) => {
    try {
      const { current_username, new_username, new_password, new_nama } = req.body;
      if (!current_username) {
        res.status(400).json({ success: false, message: 'current_username wajib diisi' });
        return;
      }
      const success = db.updateAdminCredentials(current_username, new_username, new_password, new_nama);
      if (!success) {
        res.status(404).json({ success: false, message: 'Akun admin tidak ditemukan' });
        return;
      }
      res.json({ success: true, message: 'Kredensial admin berhasil diperbarui' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. GET /api/rekap - Rekapitulasi Lengkap
  app.get('/api/rekap', (req: Request, res: Response) => {
    try {
      const { id_kategori, periode, tanggal_mulai, tanggal_selesai } = req.query;

      const stats = db.getDashboardStats();
      const settings = db.getPengaturanMap();
      const anggotaList = db.getAnggota();
      const kategoriList = db.getKategori();

      let kasList = db.getTransaksiKas();
      let lainList = db.getTransaksiLain();

      if (id_kategori) {
        const isKas = kategoriList.find(k => k.id_kategori === id_kategori)?.is_kas_utama;
        if (isKas) {
          lainList = [];
        } else {
          kasList = [];
          lainList = lainList.filter(l => l.id_kategori === id_kategori);
        }
      }

      if (periode) {
        kasList = kasList.filter(k => k.periode_bulan.toLowerCase() === (periode as string).toLowerCase());
      }

      if (tanggal_mulai) {
        kasList = kasList.filter(k => k.tanggal >= (tanggal_mulai as string));
        lainList = lainList.filter(l => l.tanggal >= (tanggal_mulai as string));
      }

      if (tanggal_selesai) {
        kasList = kasList.filter(k => k.tanggal <= (tanggal_selesai as string));
        lainList = lainList.filter(l => l.tanggal <= (tanggal_selesai as string));
      }

      const totalMasukKas = kasList.filter(t => t.jenis === 'masuk').reduce((s, t) => s + t.jumlah, 0);
      const totalKeluarKas = kasList.filter(t => t.jenis === 'keluar').reduce((s, t) => s + t.jumlah, 0);
      const totalMasukLain = lainList.filter(t => t.jenis === 'masuk').reduce((s, t) => s + t.jumlah, 0);
      const totalKeluarLain = lainList.filter(t => t.jenis === 'keluar').reduce((s, t) => s + t.jumlah, 0);

      res.json({
        success: true,
        data: {
          ringkasan: {
            total_masuk: totalMasukKas + totalMasukLain,
            total_keluar: totalKeluarKas + totalKeluarLain,
            saldo_bersih: (totalMasukKas + totalMasukLain) - (totalKeluarKas + totalKeluarLain),
            kas_masuk: totalMasukKas,
            kas_keluar: totalKeluarKas,
            lain_masuk: totalMasukLain,
            lain_keluar: totalKeluarLain
          },
          transaksi_kas: kasList,
          transaksi_lain: lainList,
          anggota: anggotaList,
          kategori: kategoriList,
          pengaturan: settings,
          generated_at: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. GET & PUT /api/pengaturan
  app.get('/api/pengaturan', (req: Request, res: Response) => {
    try {
      res.json({ success: true, data: db.getPengaturanMap(), list: db.getPengaturan() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/pengaturan', (req: Request, res: Response) => {
    try {
      const { settings } = req.body;
      if (settings && typeof settings === 'object') {
        db.batchUpdatePengaturan(settings);
      }
      res.json({ success: true, message: 'Pengaturan berhasil disimpan', data: db.getPengaturanMap() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. POST /api/reset-data - Quick reset to initial clean data
  app.post('/api/reset-data', (req: Request, res: Response) => {
    try {
      db.resetToDefault();
      res.json({ success: true, message: 'Data berhasil direset ke data default Remaja RT 04' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // Vite Middleware Setup
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[32m✔ Server Kas & Iuran Remaja RT 04 berjalan di port ${PORT}\x1b[0m`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
