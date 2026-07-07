import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, RefreshCw, Users, UserCheck, UserPlus } from 'lucide-react';

export default function BezzetingImport({ employees, units, onClose, onSynced }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setError('');
      setParsedData([]);
      setSyncResult(null);
    }
    e.target.value = '';
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError('');
    setParsedData([]);
    setSyncResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nip: { type: "string" },
                  nama_lengkap: { type: "string" },
                  jabatan: { type: "string" },
                  nama_unit: { type: "string" },
                  pangkat_golongan: { type: "string" },
                  eselon: { type: "string" },
                  jenis_jabatan: { type: "string" },
                  status: { type: "string" },
                  keterangan: { type: "string" },
                }
              }
            }
          }
        }
      });

      let rows = [];
      if (result.output) {
        if (Array.isArray(result.output)) rows = result.output;
        else if (result.output.data && Array.isArray(result.output.data)) rows = result.output.data;
        else if (Array.isArray(result.output.employees)) rows = result.output.employees;
      }

      if (rows.length === 0) {
        setError('Tidak ada data yang dapat dibaca dari file bezzeting. Pastikan file berisi tabel formasi pegawai.');
        return;
      }

      const enriched = rows.map(r => {
        const nip = (r.nip || '').trim();
        const existing = nip ? employees.find(e => e.nip === nip) : null;
        return {
          ...r,
          nip,
          nama_lengkap: (r.nama_lengkap || '').trim(),
          matchStatus: existing ? 'matched' : (nip ? 'new' : 'no_nip'),
          existingEmp: existing,
        };
      });

      setParsedData(enriched);
    } catch (e) {
      setError('Gagal membaca file: ' + e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleSync = async () => {
    const toUpdate = parsedData.filter(r => r.matchStatus === 'matched' && r.existingEmp);
    const toCreate = parsedData.filter(r => r.matchStatus === 'new' && r.nama_lengkap);

    if (toUpdate.length === 0 && toCreate.length === 0) {
      setError('Tidak ada data yang dapat disinkronkan.');
      return;
    }

    setSyncing(true);
    setError('');
    try {
      let updated = 0;
      let created = 0;

      if (toUpdate.length > 0) {
        const updates = toUpdate.map(r => {
          const unit = units.find(u => u.nama_unit === r.nama_unit);
          return {
            id: r.existingEmp.id,
            jabatan: r.jabatan || r.existingEmp.jabatan,
            pangkat_golongan: r.pangkat_golongan || r.existingEmp.pangkat_golongan,
            nama_unit: r.nama_unit || r.existingEmp.nama_unit,
            unit_id: unit?.id || r.existingEmp.unit_id,
            jenis_jabatan: r.jenis_jabatan || r.existingEmp.jenis_jabatan,
          };
        });
        await base44.entities.Employee.bulkUpdate(updates);
        updated = toUpdate.length;
      }

      if (toCreate.length > 0) {
        const newRecords = toCreate.map(r => {
          const unit = units.find(u => u.nama_unit === r.nama_unit);
          return {
            nama_lengkap: r.nama_lengkap,
            nip: r.nip,
            jabatan: r.jabatan || '',
            pangkat_golongan: r.pangkat_golongan || '',
            nama_unit: r.nama_unit || '',
            unit_id: unit?.id || '',
            jenis_jabatan: r.jenis_jabatan || 'Pelaksana',
            status_asn: 'PNS',
            status_pegawai: 'Aktif',
            jumlah_anak: 0,
            default_password: '12345678',
            password_changed: false,
            deleted: false,
          };
        });
        await base44.entities.Employee.bulkCreate(newRecords);
        created = toCreate.length;
      }

      setSyncResult({ updated, created });
      onSynced();
    } catch (e) {
      setError('Gagal sinkronisasi: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const stats = {
    matched: parsedData.filter(r => r.matchStatus === 'matched').length,
    new: parsedData.filter(r => r.matchStatus === 'new').length,
    noNip: parsedData.filter(r => r.matchStatus === 'no_nip').length,
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Import Bezzeting</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Baca file formasi pegawai untuk sinkronisasi data</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload area */}
          {parsedData.length === 0 && !syncResult && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls,.csv,.pdf" className="hidden" />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Klik untuk pilih file bezzeting</p>
                    <p className="text-xs text-muted-foreground mt-1">Format: Excel (.xlsx, .xls), CSV, atau PDF</p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {file && (
                <button
                  onClick={handleParse}
                  disabled={parsing}
                  className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {parsing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Membaca file bezzeting...</>
                  ) : (
                    <><FileSpreadsheet className="w-4 h-4" /> Baca Data Bezzeting</>
                  )}
                </button>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Info:</strong> File bezzeting biasanya berisi tabel formasi pegawai dengan kolom NIP, Nama, Jabatan, Pangkat/Golongan, Unit Kerja, dan Eselon. Sistem akan otomatis mencocokkan data berdasarkan NIP — pegawai yang sudah ada akan diperbarui, dan pegawai baru akan ditambahkan.
                </p>
              </div>
            </div>
          )}

          {/* Preview data */}
          {parsedData.length > 0 && !syncResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-700">{stats.matched}</p>
                  <p className="text-xs text-green-600">Cocok (Update)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <UserPlus className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-blue-700">{stats.new}</p>
                  <p className="text-xs text-blue-600">Pegawai Baru</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-amber-700">{stats.noNip}</p>
                  <p className="text-xs text-amber-600">Tanpa NIP</p>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">NIP</th>
                      <th className="text-left px-3 py-2 font-semibold">Nama</th>
                      <th className="text-left px-3 py-2 font-semibold">Jabatan</th>
                      <th className="text-left px-3 py-2 font-semibold">Pangkat/Gol</th>
                      <th className="text-left px-3 py-2 font-semibold">Unit</th>
                      <th className="text-left px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border max-h-[300px] overflow-y-auto">
                    {parsedData.slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground">{r.nip || '-'}</td>
                        <td className="px-3 py-2 font-medium">{r.nama_lengkap || '-'}</td>
                        <td className="px-3 py-2">{r.jabatan || '-'}</td>
                        <td className="px-3 py-2">{r.pangkat_golongan || '-'}</td>
                        <td className="px-3 py-2">{r.nama_unit || '-'}</td>
                        <td className="px-3 py-2">
                          {r.matchStatus === 'matched' && <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium"><CheckCircle2 className="w-3 h-3" /> Update</span>}
                          {r.matchStatus === 'new' && <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium"><UserPlus className="w-3 h-3" /> Baru</span>}
                          {r.matchStatus === 'no_nip' && <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium"><AlertCircle className="w-3 h-3" /> Lewati</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 100 && <p className="text-xs text-muted-foreground text-center">Menampilkan 100 dari {parsedData.length} baris</p>}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <button onClick={() => { setParsedData([]); setFile(null); }} className="text-sm text-muted-foreground hover:text-foreground">
                  ← Pilih file lain
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncing || (stats.matched === 0 && stats.new === 0)}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {syncing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyinkronkan...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Sinkronkan ({stats.matched + stats.new} pegawai)</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Sync result */}
          {syncResult && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sinkronisasi Selesai</h3>
                <p className="text-sm text-muted-foreground mt-1">Data bezzeting berhasil diproses</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                {syncResult.updated > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3">
                    <p className="text-2xl font-bold text-green-700">{syncResult.updated}</p>
                    <p className="text-xs text-green-600">Pegawai Diperbarui</p>
                  </div>
                )}
                {syncResult.created > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3">
                    <p className="text-2xl font-bold text-blue-700">{syncResult.created}</p>
                    <p className="text-xs text-blue-600">Pegawai Baru</p>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}