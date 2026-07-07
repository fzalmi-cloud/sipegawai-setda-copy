import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Building2, X, Power } from 'lucide-react';

export default function MasterUnitKerja() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Unit.filter({}, 'urutan', 50);
      setUnits(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggle = async (unit) => {
    try {
      await base44.entities.Unit.update(unit.id, { aktif: !unit.aktif });
      setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, aktif: !u.aktif } : u));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Master Unit Kerja</h1>
          <p className="text-muted-foreground mt-1">{units.length} unit kerja</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(u => (
          <div key={u.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(u); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleToggle(u)} className="p-1.5 text-muted-foreground hover:text-amber-500" title={u.aktif ? 'Nonaktifkan' : 'Aktifkan'}><Power className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="font-semibold text-sm mt-3">{u.nama_unit}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{u.jenis}</span>
              {u.aktif ? (
                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Aktif</span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Nonaktif</span>
              )}
            </div>
            {u.keterangan && <p className="text-xs text-muted-foreground mt-2">{u.keterangan}</p>}
          </div>
        ))}
      </div>

      {showForm && <UnitForm unit={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function UnitForm({ unit, onClose, onSaved }) {
  const [form, setForm] = useState(unit || { nama_unit: '', kode_unit: '', jenis: 'Biro', urutan: 0, aktif: true, keterangan: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (unit) await base44.entities.Unit.update(unit.id, form);
      else await base44.entities.Unit.create(form);
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{unit ? 'Edit Unit' : 'Tambah Unit'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nama Unit *</label>
            <input type="text" value={form.nama_unit} onChange={e => setForm({ ...form, nama_unit: e.target.value })} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Kode Unit</label>
            <input type="text" value={form.kode_unit || ''} onChange={e => setForm({ ...form, kode_unit: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jenis</label>
              <select value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                <option value="Biro">Biro</option>
                <option value="Unsur Pimpinan">Unsur Pimpinan</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Urutan</label>
              <input type="number" value={form.urutan || 0} onChange={e => setForm({ ...form, urutan: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Keterangan</label>
            <textarea value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} rows={2}
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