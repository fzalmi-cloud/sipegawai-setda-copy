import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, X, FileType } from 'lucide-react';

export default function TemplateDokumen() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.DocumentTemplate.filter({}, 'nama_template', 100);
      setTemplates(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Template Dokumen</h1>
          <p className="text-muted-foreground mt-1">{templates.length} template dokumen</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileType className="w-5 h-5 text-accent" />
              </div>
              <button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
            </div>
            <p className="font-semibold text-sm mt-3">{t.nama_template}</p>
            <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">{t.kategori}</span>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{t.konten?.substring(0, 120)}...</p>
          </div>
        ))}
      </div>

      {showForm && <TemplateForm item={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function TemplateForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { nama_template: '', kategori: 'Surat Pengantar', konten: '', variabel_tersedia: '', aktif: true });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (item) await base44.entities.DocumentTemplate.update(item.id, form);
      else await base44.entities.DocumentTemplate.create(form);
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };
  const variabelList = '{{nama_pegawai}}, {{nip}}, {{pangkat_golongan}}, {{jabatan}}, {{unit_kerja}}, {{jenis_layanan}}, {{nomor_tiket}}, {{tanggal_permohonan}}, {{tanggal_surat}}, {{nama_pimpinan}}, {{jabatan_pimpinan}}, {{nomor_surat}}, {{catatan_verifikasi}}';
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{item ? 'Edit Template' : 'Tambah Template'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Nama Template *" value={form.nama_template} onChange={e => setForm({ ...form, nama_template: e.target.value })} required className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
            {['Surat Pengantar', 'Surat Keterangan', 'Surat Usulan', 'Nota Dinas', 'Berita Acara', 'Daftar Hadir', 'Checklist', 'Tanda Terima', 'Laporan'].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="p-2 bg-accent/5 rounded-lg">
            <p className="text-xs font-medium text-accent mb-1">Variabel tersedia:</p>
            <p className="text-xs text-muted-foreground">{variabelList}</p>
          </div>
          <textarea placeholder="Konten template..." value={form.konten} onChange={e => setForm({ ...form, konten: e.target.value })} required rows={10} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none font-mono" />
          <div className="flex items-center gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}