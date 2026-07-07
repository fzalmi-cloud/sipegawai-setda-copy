import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Search, FolderArchive, Upload, Download, X, FileText, Filter } from 'lucide-react';
import moment from 'moment';

const docTypes = ['SK CPNS', 'SK PNS', 'SK Pangkat', 'SK Jabatan', 'SK Pelantikan', 'Ijazah', 'Transkrip', 'Sertifikat Diklat', 'Sertifikat Uji Kompetensi', 'SKP', 'Dokumen Disiplin', 'Kartu Keluarga', 'KTP', 'NPWP', 'Taspen', 'BPJS', 'Surat Nikah', 'Akta Anak', 'Dokumen Pensiun', 'Dokumen Cuti', 'Dokumen Layanan Lainnya'];

export default function ArsipPegawai() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        let filter = {};
        if (user?.role === 'operator_biro' && user?.unit_id) {
          filter = { unit_id: user.unit_id, status_pegawai: 'Aktif' };
        } else if (user?.role === 'pegawai') {
          filter = { email: user.email };
        }
        const data = await base44.entities.Employee.filter(filter, 'nama_lengkap', 500);
        setEmployees(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const loadArchives = async (empId) => {
    try {
      const data = await base44.entities.DocumentArchive.filter({ employee_id: empId }, '-tanggal_unggah', 200);
      setArchives(data);
    } catch (e) { console.error(e); }
  };

  const filteredEmps = employees.filter(e =>
    e.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) || e.nip?.includes(search)
  );

  const filteredArchives = archives.filter(a =>
    filterJenis === 'all' || a.jenis_dokumen === filterJenis
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  if (!selectedEmp) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Arsip Digital Pegawai</h1>
          <p className="text-muted-foreground mt-1">Pilih pegawai untuk melihat arsip dokumen</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari pegawai..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEmps.map(emp => (
            <button key={emp.id} onClick={() => { setSelectedEmp(emp); loadArchives(emp.id); }}
              className="text-left bg-card rounded-xl border border-border p-4 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{emp.nama_lengkap?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{emp.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.nip}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.nama_unit}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => setSelectedEmp(null)} className="text-sm text-muted-foreground hover:text-foreground">← Kembali ke daftar pegawai</button>
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{selectedEmp.nama_lengkap?.charAt(0)}</div>
            <div>
              <h1 className="text-xl font-heading font-bold">{selectedEmp.nama_lengkap}</h1>
              <p className="text-sm text-muted-foreground">{selectedEmp.nip} · {selectedEmp.jabatan} · {selectedEmp.nama_unit}</p>
            </div>
          </div>
          <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Unggah Dokumen
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="px-4 py-2 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Jenis Dokumen</option>
          {docTypes.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArchives.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada dokumen di arsip</p>
          </div>
        ) : (
          filteredArchives.map(doc => (
            <div key={doc.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.nama_dokumen}</p>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{doc.jenis_dokumen}</span>
                  {doc.nomor_dokumen && <p className="text-xs text-muted-foreground mt-1">No: {doc.nomor_dokumen}</p>}
                  {doc.tanggal_dokumen && <p className="text-xs text-muted-foreground">Tgl: {moment(doc.tanggal_dokumen).format('DD MMM YYYY')}</p>}
                  <p className="text-xs text-muted-foreground">Diunggah: {doc.tanggal_unggah ? moment(doc.tanggal_unggah).format('DD MMM YYYY') : '-'}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-1 ${doc.status_validasi === 'Terverifikasi' ? 'bg-green-50 text-green-700' : doc.status_validasi === 'Ditolak' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{doc.status_validasi}</span>
                </div>
              </div>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 w-full px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-primary/20">
                <Download className="w-3.5 h-3.5" /> Unduh
              </a>
            </div>
          ))
        )}
      </div>

      {showUpload && <UploadForm employee={selectedEmp} user={user} onClose={() => setShowUpload(false)} onSaved={() => { setShowUpload(false); loadArchives(selectedEmp.id); }} />}
    </div>
  );
}

function UploadForm({ employee, user, onClose, onSaved }) {
  const [form, setForm] = useState({ nama_dokumen: '', jenis_dokumen: 'SK CPNS', nomor_dokumen: '', tanggal_dokumen: '', masa_berlaku: '', file: null });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file) { alert('Pilih file terlebih dahulu'); return; }
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: form.file });
      await base44.entities.DocumentArchive.create({
        employee_id: employee.id, nama_pegawai: employee.nama_lengkap, nip_pegawai: employee.nip,
        nama_dokumen: form.nama_dokumen, jenis_dokumen: form.jenis_dokumen,
        nomor_dokumen: form.nomor_dokumen, tanggal_dokumen: form.tanggal_dokumen,
        masa_berlaku: form.masa_berlaku, file_url,
        diunggah_oleh: user.id, nama_pengunggah: user.full_name,
        tanggal_unggah: new Date().toISOString(), status_validasi: 'Belum Diverifikasi',
      });
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Unggah Dokumen Arsip</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-primary bg-primary/5 p-2 rounded">{employee.nama_lengkap} — {employee.nip}</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nama Dokumen *</label>
            <input type="text" value={form.nama_dokumen} onChange={e => setForm({ ...form, nama_dokumen: e.target.value })} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Jenis Dokumen</label>
            <select value={form.jenis_dokumen} onChange={e => setForm({ ...form, jenis_dokumen: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
              {docTypes.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nomor Dokumen</label>
              <input type="text" value={form.nomor_dokumen} onChange={e => setForm({ ...form, nomor_dokumen: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Dokumen</label>
              <input type="date" value={form.tanggal_dokumen} onChange={e => setForm({ ...form, tanggal_dokumen: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Masa Berlaku (jika ada)</label>
            <input type="date" value={form.masa_berlaku} onChange={e => setForm({ ...form, masa_berlaku: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">File Dokumen *</label>
            <input type="file" onChange={e => setForm({ ...form, file: e.target.files[0] })} required
              className="w-full mt-1 text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-medium" />
          </div>
          <div className="flex items-center gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Mengunggah...' : 'Unggah'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}