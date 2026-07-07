import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Search, Plus, Edit2, Trash2, Users, Upload, Download, X } from 'lucide-react';
import moment from 'moment';

export default function MasterPegawai() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [empData, unitData] = await Promise.all([
        base44.entities.Employee.filter({}, 'nama_lengkap', 500),
        base44.entities.Unit.filter({ aktif: true }, 'urutan', 50)
      ]);
      setEmployees(empData);
      setUnits(unitData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search ||
        e.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
        e.nip?.includes(search);
      const matchUnit = filterUnit === 'all' || e.unit_id === filterUnit;
      const matchStatus = filterStatus === 'all' || e.status_pegawai === filterStatus;
      return matchSearch && matchUnit && matchStatus;
    });
  }, [employees, search, filterUnit, filterStatus]);

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menonaktifkan pegawai ini? Data tidak akan dihapus permanen.')) return;
    try {
      await base44.entities.Employee.update(id, { status_pegawai: 'Berhenti', deleted: true });
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Master Pegawai</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} pegawai</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Pegawai
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari nama atau NIP..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary" />
        </div>
        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Unit</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Pensiun">Pensiun</option>
          <option value="Mutasi">Mutasi</option>
          <option value="Meninggal">Meninggal</option>
          <option value="Berhenti">Berhenti</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Nama</th>
              <th className="text-left px-4 py-3 font-semibold">NIP</th>
              <th className="text-left px-4 py-3 font-semibold">Jabatan</th>
              <th className="text-left px-4 py-3 font-semibold">Pangkat/Gol</th>
              <th className="text-left px-4 py-3 font-semibold">Unit</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />Tidak ada pegawai</td></tr>
            ) : (
              filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{emp.nama_lengkap?.charAt(0)}</div>
                      <div>
                        <p className="font-medium">{emp.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground">{emp.status_asn} · {emp.jenis_jabatan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{emp.nip}</td>
                  <td className="px-4 py-3 text-xs">{emp.jabatan}</td>
                  <td className="px-4 py-3 text-xs">{emp.pangkat_golongan}</td>
                  <td className="px-4 py-3 text-xs">{emp.nama_unit}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status_pegawai === 'Aktif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{emp.status_pegawai}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(emp); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />Tidak ada pegawai</div>
        ) : (
          filtered.map(emp => (
            <div key={emp.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{emp.nama_lengkap?.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-sm">{emp.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">{emp.nip}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status_pegawai === 'Aktif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{emp.status_pegawai}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                <p>{emp.jabatan} · {emp.pangkat_golongan}</p>
                <p>{emp.nama_unit}</p>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => { setEditing(emp); setShowForm(true); }} className="flex-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium">Edit</button>
                <button onClick={() => handleDelete(emp.id)} className="px-3 py-1.5 text-xs text-destructive border border-border rounded-lg">Hapus</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <EmployeeForm employee={editing} units={units} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function EmployeeForm({ employee, units, onClose, onSaved }) {
  const [form, setForm] = useState(employee || {
    nama_lengkap: '', nip: '', nik: '', tempat_lahir: '', tanggal_lahir: '',
    jenis_kelamin: 'Laki-laki', agama: 'Islam', status_asn: 'PNS', unit_id: '',
    nama_unit: '', subbagian: '', jabatan: '', jenis_jabatan: 'Pelaksana',
    pangkat_golongan: '', tmt_cpns: '', tmt_pns: '', tmt_pangkat_terakhir: '',
    tmt_jabatan: '', pendidikan_terakhir: '', no_hp: '', email: '', alamat: '',
    status_perkawinan: 'Belum Kawin', jumlah_anak: 0, atasan_langsung: '',
    pejabat_penilai: '', catatan_khusus: '', status_pegawai: 'Aktif'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const unit = units.find(u => u.id === form.unit_id);
      const data = { ...form, nama_unit: unit?.nama_unit || form.nama_unit };
      if (employee) {
        await base44.entities.Employee.update(employee.id, data);
      } else {
        await base44.entities.Employee.create(data);
      }
      onSaved();
    } catch (err) { alert('Gagal menyimpan: ' + err.message); }
    finally { setSaving(false); }
  };

  const fields = [
    { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text', required: true, col: 2 },
    { key: 'nip', label: 'NIP', type: 'text', required: true, col: 2 },
    { key: 'nik', label: 'NIK', type: 'text', col: 2 },
    { key: 'tempat_lahir', label: 'Tempat Lahir', type: 'text', col: 1 },
    { key: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', col: 1 },
    { key: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'], col: 1 },
    { key: 'agama', label: 'Agama', type: 'select', options: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'], col: 1 },
    { key: 'status_asn', label: 'Status ASN', type: 'select', options: ['PNS', 'PPPK', 'CPNS'], col: 1 },
    { key: 'jenis_jabatan', label: 'Jenis Jabatan', type: 'select', options: ['Struktural', 'Fungsional', 'Pelaksana'], col: 1 },
    { key: 'jabatan', label: 'Jabatan', type: 'text', col: 2 },
    { key: 'pangkat_golongan', label: 'Pangkat/Golongan', type: 'text', col: 1 },
    { key: 'pendidikan_terakhir', label: 'Pendidikan Terakhir', type: 'text', col: 1 },
    { key: 'tmt_cpns', label: 'TMT CPNS', type: 'date', col: 1 },
    { key: 'tmt_pns', label: 'TMT PNS', type: 'date', col: 1 },
    { key: 'tmt_pangkat_terakhir', label: 'TMT Pangkat Terakhir', type: 'date', col: 1 },
    { key: 'tmt_jabatan', label: 'TMT Jabatan', type: 'date', col: 1 },
    { key: 'no_hp', label: 'No. HP', type: 'text', col: 1 },
    { key: 'email', label: 'Email', type: 'email', col: 1 },
    { key: 'status_perkawinan', label: 'Status Perkawinan', type: 'select', options: ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'], col: 1 },
    { key: 'jumlah_anak', label: 'Jumlah Anak', type: 'number', col: 1 },
    { key: 'atasan_langsung', label: 'Atasan Langsung', type: 'text', col: 2 },
    { key: 'pejabat_penilai', label: 'Pejabat Penilai', type: 'text', col: 2 },
    { key: 'alamat', label: 'Alamat', type: 'textarea', col: 2 },
    { key: 'catatan_khusus', label: 'Catatan Khusus', type: 'textarea', col: 2 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{employee ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Unit Kerja <span className="text-red-500">*</span></label>
              <select value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} required
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                <option value="">Pilih Unit...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
              </select>
            </div>
            {fields.map(f => (
              <div key={f.key} className={f.col === 2 ? 'md:col-span-2' : ''}>
                <label className="text-xs font-medium text-muted-foreground">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={2}
                    className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none" />
                ) : (
                  <input type={f.type} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} required={f.required}
                    className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}