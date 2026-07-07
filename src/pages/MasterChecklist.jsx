import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Power, X, ListChecks, ChevronDown } from 'lucide-react';

export default function MasterChecklist() {
  const [searchParams] = useSearchParams();
  const presetServiceId = searchParams.get('service_id');
  const [services, setServices] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const svcData = await base44.entities.Service.filter({}, 'urutan', 200);
        setServices(svcData);
        const target = presetServiceId ? svcData.find(s => s.id === presetServiceId) : svcData[0];
        if (target) {
          setSelectedService(target);
          const reqData = await base44.entities.ServiceRequirement.filter({ service_id: target.id }, 'urutan', 100);
          setRequirements(reqData);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [presetServiceId]);

  const loadReqs = async (svcId) => {
    const data = await base44.entities.ServiceRequirement.filter({ service_id: svcId }, 'urutan', 100);
    setRequirements(data);
  };

  const handleSelectService = (svc) => {
    setSelectedService(svc);
    loadReqs(svc.id);
  };

  const handleToggle = async (req) => {
    try {
      await base44.entities.ServiceRequirement.update(req.id, { aktif: !req.aktif });
      setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, aktif: !r.aktif } : r));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Master Checklist Persyaratan</h1>
          <p className="text-muted-foreground mt-1">Kelola checklist persyaratan setiap layanan</p>
        </div>
        {selectedService && (
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Persyaratan
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {services.filter(s => s.aktif).map(svc => (
          <button key={svc.id} onClick={() => handleSelectService(svc)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${selectedService?.id === svc.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary'}`}>
            {svc.nama_layanan}
          </button>
        ))}
      </div>

      {selectedService && (
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">{selectedService.nama_layanan}</p>
              <p className="text-xs text-muted-foreground">{requirements.length} persyaratan</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada persyaratan. Klik "Tambah Persyaratan" untuk membuat.</p>
            ) : (
              requirements.map((r, i) => (
                <div key={r.id} className="px-5 py-3 flex items-start gap-3">
                  <span className="text-xs font-bold text-primary mt-0.5">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{r.nama_item}</p>
                      {r.wajib ? <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Wajib</span> : <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Opsional</span>}
                      {!r.aktif && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Nonaktif</span>}
                    </div>
                    {r.keterangan && <p className="text-xs text-muted-foreground mt-0.5">{r.keterangan}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">Format: {r.format_diterima}</span>
                      <span className="text-[10px] text-muted-foreground">Max: {r.max_ukuran_mb}MB</span>
                      {r.dasar_hukum && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">Dasar: {r.dasar_hukum}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleToggle(r)} className="p-1.5 text-muted-foreground hover:text-amber-500"><Power className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showForm && <ReqForm req={editing} service={selectedService} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadReqs(selectedService.id); }} />}
    </div>
  );
}

function ReqForm({ req, service, onClose, onSaved }) {
  const [form, setForm] = useState(req || {
    service_id: service.id, nama_layanan: service.nama_layanan, nama_item: '',
    wajib: true, format_diterima: 'PDF', max_ukuran_mb: 5, keterangan: '',
    dasar_hukum: '', urutan: 0, aktif: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (req) await base44.entities.ServiceRequirement.update(req.id, form);
      else await base44.entities.ServiceRequirement.create(form);
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{req ? 'Edit Persyaratan' : 'Tambah Persyaratan'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="p-2 bg-primary/5 rounded-lg text-xs text-primary font-medium">{service.nama_layanan}</div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nama Item Persyaratan *</label>
            <input type="text" value={form.nama_item} onChange={e => setForm({ ...form, nama_item: e.target.value })} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Wajib</label>
              <select value={form.wajib} onChange={e => setForm({ ...form, wajib: e.target.value === 'true' })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                <option value="true">Wajib</option>
                <option value="false">Opsional</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Format File</label>
              <select value={form.format_diterima} onChange={e => setForm({ ...form, format_diterima: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                {['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX', 'Semua Format'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Max Ukuran (MB)</label>
            <input type="number" value={form.max_ukuran_mb} onChange={e => setForm({ ...form, max_ukuran_mb: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Keterangan</label>
            <textarea value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} rows={2}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Dasar Hukum / SOP Internal</label>
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