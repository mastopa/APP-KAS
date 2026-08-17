import React, { useState } from 'react';
import {
  Smartphone,
  Code2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Server,
  Zap
} from 'lucide-react';

export const AndroidGuideView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/stats',
      desc: 'Mengambil ringkasan saldo kas utama, iuran lain, anggota, dan grafik bulanan',
      response: '{\n  "total_saldo": 2450000,\n  "saldo_kas": 1200000,\n  "saldo_iuran_lain": 1250000,\n  "total_anggota": 12,\n  "recent_transactions": [...]\n}'
    },
    {
      method: 'GET',
      path: '/api/kas',
      desc: 'Mengambil daftar riwayat transaksi kas utama masuk & keluar',
      response: '{\n  "data": [\n    {\n      "id_transaksi": "TRK-...",\n      "id_anggota": "ANG-001",\n      "periode_bulan": "Agustus 2026",\n      "jumlah": 10000,\n      "jenis": "masuk"\n    }\n  ]\n}'
    },
    {
      method: 'POST',
      path: '/api/kas/batch',
      desc: 'Bayar kas massal / multi-select dari aplikasi Android',
      response: '// Request Body:\n{\n  "anggota_ids": ["ANG-001", "ANG-002"],\n  "periode_bulan": "Agustus 2026",\n  "jumlah": 10000,\n  "tanggal": "2026-08-15"\n}'
    },
    {
      method: 'GET',
      path: '/api/anggota',
      desc: 'Mengambil daftar anggota remaja RT 04 (nama, status, kontak, alamat)',
      response: '{\n  "data": [\n    {\n      "id_anggota": "ANG-001",\n      "nama": "Aditya Pratama",\n      "status": "Aktif",\n      "no_telepon": "081234567890"\n    }\n  ]\n}'
    },
    {
      method: 'POST',
      path: '/api/sheets/sync',
      desc: 'Trigger sinkronisasi database lokal ke Google Spreadsheet secara instan',
      response: '{\n  "success": true,\n  "message": "Sinkronisasi ke Google Spreadsheet sukses!"\n}'
    }
  ];

  return (
    <div id="android-guide-view" className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              REST API & Mobile Client RT 04
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Panduan Integrasi Android & Mobile Client
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Backend web ini menyediakan API JSON standar yang dapat dikonsumsi langsung oleh aplikasi Android (Kotlin / Jetpack Compose / Flutter / React Native).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              API Ready
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 w-fit mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Format JSON Cepat & Ringan
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Respon payload didesain terstruktur, mendukung pagination & batch multi-select.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-emerald-900/40 text-slate-700 dark:text-slate-300 w-fit mb-3">
            <Server className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Dual Sync: Local & Google Sheets
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Data tersimpan di server lokal dan otomatis tersinkron ke Google Sheets secara realtime.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 w-fit mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Autentikasi Pengurus RT
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Endpoint login mengamankan aksi penambahan kas, mutasi pengeluaran, dan hapus data.
          </p>
        </div>
      </div>

      {/* Endpoints Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Daftar REST Endpoint Android
            </h3>
            <p className="text-xs text-slate-500">
              Gunakan endpoint berikut untuk Retrofit / Ktor / HTTP Client
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Base URL: /api/*</span>
        </div>

        <div className="space-y-3.5">
          {endpoints.map((ep, idx) => (
            <div
              key={ep.path}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      ep.method === 'GET'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-emerald-900/60 dark:text-slate-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {ep.path}
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(ep.path, idx)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {copiedIndex === idx ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedIndex === idx ? 'Tersalin' : 'Salin Path'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {ep.desc}
              </p>

              <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
                <code>{ep.response}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
