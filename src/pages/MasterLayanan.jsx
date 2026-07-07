import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Power, FileText, X, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MasterLayanan() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterKategori, setFilterKategori] = useState('all');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Service.filter({}, 'urutan', 200);
      setServices(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const kategoriList = ['all', 'Pensiun', 'Kenaikan Pangkat', 'Jabatan Fungsional', 'Pelantikan', 'Cuti', 'Mutasi', 'Data Kepegawaian', 'Surat Keterangan', 'KGB', 'Disiplin', 'Pengembangan Kompetensi', 'Lainnya'];

  const filtered = services.filter(s => filterKategori === 'all' || s.kategori === filterKategori);

  const handleToggle = async (svc) => {
    try {
      await base44.entities.Service.update(svc.id, { aktif: !svc.aktif });
      setServices(prev => prev.map(s => s.id === svc.id ? { ...s, aktif: !s.aktif } : s));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Master Layanan</h1>
          <p className="text-muted-foreground mt-1">{services.length} jenis layanan</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Layanan
        </button>
      </div>

      <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
        {kategoriList.map(k => <option key={k} value={k}>{k === 'all' ? 'Semua Kategori' : k}</option>)}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(svc => (
          <div key={svc.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{svc.nama_layanan}</p>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{svc.kategori}</span>
                  {svc.deskripsi && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{svc.deskripsi}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">SLA: {svc.sla_hari} hari</span>
                    {svc.estimasi_waktu && <span className="text-xs text-muted-foreground">{svc.estimasi_waktu}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Link to={`/master-checklist?service_id=${svc.id}`} className="flex-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-primary/20">
                <ListChecks className="w-3.5 h-3.5" /> Checklist
              </Link>
              <button onClick={() => { setEditing(svc); setShowForm(true); }} className="px-3 py-1.5 text-xs border border-border rounded-lg flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={() => handleToggle(svc)} className="px-3 py-1.5 text-xs border border-border rounded-lg"><Power className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && <ServiceForm service={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ServiceForm({ service, onClose, onSaved }) {
  const [form, setForm] = useState(service || {
    nama_layanan: '', kategori: 'Pensiun', kode_layanan: '', deskripsi: '',
    estimasi_waktu: '', sla_hari: 3, alur_layanan: '', dasar_hukum: '', aktif: true, urutan: 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (service) await base44.entities.Service.update(service.id, form);
      else await base44.entities.Service.create(form);
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{service ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nama Layanan *</label>
            <input type="text" value={form.nama_layanan} onChange={e => setForm({ ...form, nama_layanan: e.target.value })} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kategori</label>
              <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                {['Pensiun', 'Kenaikan Pangkat', 'Jabatan Fungsional', 'Pelantikan', 'Cuti', 'Mutasi', 'Data Kepegawaian', 'Surat Keterangan', 'KGB', 'Disiplin', 'Pengembangan Kompetensi', 'Lainnya'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kode Layanan</label>
              <input type="text" value={form.kode_layanan || ''} onChange={e => setForm({ ...form, kode_layanan: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
            <textarea value={form.deskripsi || ''} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={2}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">SLA (hari kerja)</label>
              <input type="number" value={form.sla_hari} onChange={e => setForm({ ...form, sla_hari: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Estimasi Waktu</label>
              <input type="text" value={form.estimasi_waktu || ''} onChange={e => setForm({ ...form, estimasi_waktu: e.target.value })} placeholder="1-3 hari kerja"
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Alur Layanan</label>
            <textarea value={form.alur_layanan || ''} onChange={e => setForm({ ...form, alur_layanan: e.target.value })} rows={3}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Dasar Hukum</label>
            <textarea value={form.dasar_hukum || ''} onChange={e => setForm({ ...form, dasar_hukum: e.target.value })} rows={2}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex items-center gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}