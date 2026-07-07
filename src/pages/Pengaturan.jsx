import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, X, Scale, FileText, Upload, FileUp, Link2, Trash } from 'lucide-react';

export default function Pengaturan() {
  const [tab, setTab] = useState('regulation');
  const [regulations, setRegulations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [regs, tpls] = await Promise.all([
        base44.entities.Regulation.filter({}, '-tahun', 50),
        base44.entities.DocumentTemplate.filter({}, 'nama_template', 50)
      ]);
      setRegulations(regs);
      setTemplates(tpls);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  const handleUploadDoc = async (regId, file) => {
    if (!file) return;
    setUploadingId(regId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Regulation.update(regId, { url_dokumen: file_url });
      setRegulations(prev => prev.map(r => r.id === regId ? { ...r, url_dokumen: file_url } : r));
    } catch (e) { alert('Gagal mengunggah dokumen: ' + e.message); }
    finally { setUploadingId(null); }
  };

  const handleDeleteDoc = async (regId) => {
    if (!confirm('Hapus dokumen regulasi ini?')) return;
    try {
      await base44.entities.Regulation.update(regId, { url_dokumen: '' });
      setRegulations(prev => prev.map(r => r.id === regId ? { ...r, url_dokumen: '' } : r));
    } catch (e) { alert('Gagal menghapus dokumen: ' + e.message); }
  };

  const handleDeleteRegulation = async (regId) => {
    if (!confirm('Yakin ingin menghapus regulasi ini? Tindakan tidak dapat dibatalkan.')) return;
    try {
      await base44.entities.Regulation.delete(regId);
      setRegulations(prev => prev.filter(r => r.id !== regId));
    } catch (e) { alert('Gagal menghapus regulasi: ' + e.message); }
  };

  const tabs = [
    { id: 'regulation', label: 'Dasar Hukum & Regulasi', icon: Scale },
    { id: 'template', label: 'Template Dokumen', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Pengaturan Sistem</h1>
        <p className="text-muted-foreground mt-1">Kelola regulasi, template dokumen, dan konfigurasi sistem</p>
      </div>

      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'regulation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{regulations.length} regulasi terdaftar</p>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Regulasi
            </button>
          </div>
          <div className="space-y-2">
            {regulations.map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{r.judul}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{r.jenis}</span>
                    {r.tahun && <span className="text-[10px] text-muted-foreground">{r.tahun}</span>}
                  </div>
                  {r.nomor && <p className="text-xs text-muted-foreground mt-0.5">No. {r.nomor}</p>}
                  {r.ringkasan && <p className="text-xs text-muted-foreground mt-1">{r.ringkasan}</p>}
                  {r.url_dokumen ? (
                    <div className="flex items-center gap-2 mt-2">
                      <a href={r.url_dokumen} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Link2 className="w-3 h-3" /> Lihat Dokumen
                      </a>
                      <label className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline cursor-pointer">
                        {uploadingId === r.id ? (
                          <><div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Mengganti...</>
                        ) : (
                          <><FileUp className="w-3 h-3" /> Ganti Dokumen</>
                        )}
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleUploadDoc(r.id, e.target.files?.[0])} disabled={uploadingId === r.id} />
                      </label>
                      <button onClick={() => handleDeleteDoc(r.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                        <Trash className="w-3 h-3" /> Hapus Dokumen
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer mt-2">
                      {uploadingId === r.id ? (
                        <><div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Mengunggah...</>
                      ) : (
                        <><Upload className="w-3 h-3" /> Unggah Dokumen</>
                      )}
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleUploadDoc(r.id, e.target.files?.[0])} disabled={uploadingId === r.id} />
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(r); setShowForm(true); }} title="Edit" className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRegulation(r.id)} title="Hapus Regulasi" className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {showForm && tab === 'regulation' && <RegulationForm item={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
        </div>
      )}

      {tab === 'template' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{templates.length} template terdaftar</p>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t.nama_template}</p>
                    <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">{t.kategori}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.konten?.substring(0, 100)}...</p>
                  </div>
                  <button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {showForm && tab === 'template' && <TemplateForm item={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
        </div>
      )}
    </div>
  );
}

function RegulationForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { judul: '', nomor: '', tahun: new Date().getFullYear(), jenis: 'PP', kategori_layanan: '', ringkasan: '', url_dokumen: '', aktif: true });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (item) await base44.entities.Regulation.update(item.id, form);
      else await base44.entities.Regulation.create(form);
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{item ? 'Edit Regulasi' : 'Tambah Regulasi'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Judul *" value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nomor" value={form.nomor} onChange={e => setForm({ ...form, nomor: e.target.value })} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            <input type="number" placeholder="Tahun" value={form.tahun} onChange={e => setForm({ ...form, tahun: Number(e.target.value) })} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <select value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
            {['UU', 'PP', 'Peraturan BKN', 'Peraturan Menteri', 'Peraturan Daerah', 'Peraturan Gubernur', 'SOP Internal'].map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <input type="text" placeholder="Kategori Layanan (opsional)" value={form.kategori_layanan || ''} onChange={e => setForm({ ...form, kategori_layanan: e.target.value })} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          <textarea placeholder="Ringkasan" value={form.ringkasan || ''} onChange={e => setForm({ ...form, ringkasan: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none" />
          <div className="flex items-center gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
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
          <textarea placeholder="Konten template (gunakan variabel di atas)..." value={form.konten} onChange={e => setForm({ ...form, konten: e.target.value })} required rows={10} className="w-full px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none font-mono" />
          <div className="flex items-center gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}