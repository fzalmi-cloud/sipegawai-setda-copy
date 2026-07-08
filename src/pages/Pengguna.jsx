import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Shield, UserCog, Eye, KeyRound, X, Search, Mail, UserPlus,
  CheckCircle2, AlertCircle, Lock, Unlock, ChevronDown, ChevronRight
} from 'lucide-react';
import moment from 'moment';

const roleInfo = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-50 text-red-700 border-red-200',
    badge: 'bg-red-100 text-red-700',
    description: 'Hak akses penuh untuk mengatur aplikasi, pengguna, unit kerja, jenis layanan, checklist, template dokumen, SLA, status, dan laporan.',
    access: [
      'Mengelola seluruh konfigurasi aplikasi',
      'Mengelola pengguna dan hak akses',
      'Mengelola unit kerja, jenis layanan, checklist',
      'Mengelola template dokumen, SLA, status',
      'Melihat semua laporan dan audit trail',
      'Reset password pengguna',
    ],
  },
  pimpinan: {
    label: 'Unsur Pimpinan',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    description: 'Sekda, Asisten Sekda (Pemerintahan & Kesra, Perekonomian & Pembangunan, Administrasi), Kepala Biro (9 Biro).',
    access: [
      'Dashboard monitoring',
      'Melihat rekap layanan',
      'Melihat permohonan yang membutuhkan persetujuan',
      'Memberikan persetujuan atau catatan',
      'Melihat laporan kinerja layanan',
    ],
  },
  admin_kepegawaian: {
    label: 'Admin Kepegawaian Setda',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    description: 'Petugas kepegawaian Sekretariat Daerah yang memproses permohonan layanan.',
    access: [
      'Melihat semua permohonan',
      'Memverifikasi dokumen',
      'Memberi catatan perbaikan',
      'Mengubah status permohonan',
      'Menugaskan petugas penanggung jawab',
      'Membuat surat pengantar/rekomendasi',
      'Mengunggah dokumen hasil',
      'Menutup layanan',
      'Mengekspor laporan',
    ],
  },
  operator_biro: {
    label: 'Operator Biro',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-700',
    description: 'Operator di setiap biro yang mengajukan permohonan untuk pegawai di bironya.',
    access: [
      'Mengajukan permohonan untuk pegawai biro',
      'Mengunggah dokumen',
      'Memantau status permohonan biro',
      'Melihat catatan perbaikan',
      'Mengunduh hasil layanan',
      'Melihat rekap layanan biro sendiri',
    ],
  },
  pegawai: {
    label: 'Pegawai / ASN',
    color: 'bg-green-50 text-green-700 border-green-200',
    badge: 'bg-green-100 text-green-700',
    description: 'PNS, PPPK, dan CPNS yang mengajukan permohonan pribadi.',
    access: [
      'Mengajukan permohonan pribadi',
      'Melihat persyaratan layanan',
      'Mengunggah dokumen',
      'Memantau status permohonan',
      'Melihat catatan perbaikan',
      'Mengunduh dokumen hasil',
    ],
  },
  bendahara: {
    label: 'Bendahara / Pejabat Rangkap',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    description: 'Bendahara atau pejabat rangkap dengan akses verifikasi tertentu.',
    access: [
      'Verifikasi berkAs tertentu',
      'Melihat permohonan terkait',
      'Memberikan persetujuan teknis',
    ],
  },
};

const pimpinanOptions = [
  'Sekretaris Daerah',
  'Asisten Sekda - Pemerintahan dan Kesra',
  'Asisten Sekda - Perekonomian dan Pembangunan',
  'Asisten Sekda - Administrasi',
  'Kepala Biro',
];

export default function Pengguna() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [userData, empData, unitData] = await Promise.all([
        base44.entities.User.list(200),
        base44.entities.Employee.filter({ deleted: false }, 'nama_lengkap', 500),
        base44.entities.Unit.filter({ aktif: true }, 'urutan', 50),
      ]);
      setUsers(userData);
      setEmployees(empData);
      setUnits(unitData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.nip?.includes(search);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

  const handleResetPassword = async (u) => {
    if (!confirm(`Reset password pengguna "${u.full_name}" ke "12345678"?`)) return;
    try {
      await base44.entities.User.update(u.id, { default_password: '12345678', password_changed: false });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, default_password: '12345678', password_changed: false } : x));
      alert('Password berhasil direset ke "12345678".');
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Halaman ini hanya dapat diakses oleh Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Undang Pengguna
        </button>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(roleInfo).map(([key, info]) => (
          <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpandedRole(expandedRole === key ? null : key)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30"
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.badge}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{roleCounts[key] || 0} pengguna</p>
                </div>
              </div>
              {expandedRole === key ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expandedRole === key && (
              <div className="px-4 pb-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                <ul className="space-y-1">
                  {info.access.map((a, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari nama, email, atau NIP..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Role</option>
          {Object.entries(roleInfo).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Pengguna</th>
              <th className="text-left px-4 py-3 font-semibold">NIP</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Unit / Jabatan</th>
              <th className="text-left px-4 py-3 font-semibold">Password</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground"><UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />Tidak ada pengguna</td></tr>
            ) : (
              filtered.map(u => {
                const info = roleInfo[u.role] || roleInfo.pegawai;
                return (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(u.nama_lengkap || u.full_name)?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{u.nama_lengkap || u.full_name || u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{u.nip || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${info.color}`}>{info.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p>{u.nama_unit || '-'}</p>
                      <p className="text-muted-foreground">{u.jabatan || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.password_changed ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><Lock className="w-3 h-3" /> Diubah</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600"><Unlock className="w-3 h-3" /> Default</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPasswordUser(u)} title="Lihat/Reset Password" className="p-1.5 text-muted-foreground hover:text-primary">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingUser(u)} title="Edit Pengguna" className="p-1.5 text-muted-foreground hover:text-primary">
                          <UserCog className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteUserForm
          employees={employees}
          units={units}
          onClose={() => setShowInvite(false)}
          onSaved={() => { setShowInvite(false); load(); }}
        />
      )}

      {editingUser && (
        <EditUserForm
          user={editingUser}
          units={units}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); load(); }}
        />
      )}

      {passwordUser && (
        <PasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onReset={() => { handleResetPassword(passwordUser); setPasswordUser(null); }}
        />
      )}
    </div>
  );
}

function InviteUserForm({ employees, units, onClose, onSaved }) {
  const [mode, setMode] = useState('existing');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState('pegawai');
  const [unitId, setUnitId] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEmpSelect = (empId) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setNip(emp.nip || '');
      setNama(emp.nama_lengkap || '');
      setEmail(emp.email || `${emp.nip}@setda.sumbarprov.go.id`);
      setUnitId(emp.unit_id || '');
      setJabatan(emp.jabatan || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !role) return;
    setSaving(true);
    try {
      const unit = units.find(u => u.id === unitId);
      // Platform inviteUser only accepts "user" or "admin" — invite as "user",
      // then set the custom role (pegawai, admin_kepegawaian, etc.) via User entity update
      await base44.users.inviteUser(email, 'user');

      // The newly invited user may take a moment to be queryable — retry up to 5 times
      let newUser = null;
      for (let attempt = 0; attempt < 5 && !newUser; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1000));
        const matches = await base44.entities.User.filter({ email });
        if (matches.length > 0) newUser = matches[0];
      }
      if (newUser) {
        await base44.entities.User.update(newUser.id, {
          role,
          nama_lengkap: nama,
          nip,
          unit_id: unitId,
          nama_unit: unit?.nama_unit || '',
          jabatan,
          default_password: '12345678',
          password_changed: false,
        });
      }
      onSaved();
    } catch (err) {
      alert('Gagal mengundang pengguna: ' + err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Undang Pengguna Baru</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
            <button type="button" onClick={() => setMode('existing')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${mode === 'existing' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
              Dari Data Pegawai
            </button>
            <button type="button" onClick={() => setMode('manual')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${mode === 'manual' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
              Input Manual
            </button>
          </div>

          {mode === 'existing' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pilih Pegawai <span className="text-red-500">*</span></label>
              <select value={selectedEmpId} onChange={e => handleEmpSelect(e.target.value)} required
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                <option value="">Pilih pegawai...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nama_lengkap} - {emp.nip}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} required
                  className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">NIP (Username) <span className="text-red-500">*</span></label>
                <input type="text" value={nip} onChange={e => setNip(e.target.value)} required
                  className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Email <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="email@setda.sumbarprov.go.id"
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Username login = NIP. Password default: 12345678</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Role <span className="text-red-500">*</span></label>
            <select value={role} onChange={e => setRole(e.target.value)} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
              {Object.entries(roleInfo).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Unit Kerja</label>
            <select value={unitId} onChange={e => setUnitId(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
              <option value="">Pilih unit...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
            </select>
          </div>

          {role === 'pimpinan' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jabatan Pimpinan</label>
              <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                <option value="">Pilih jabatan...</option>
                {pimpinanOptions.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          )}

          {role !== 'pimpinan' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jabatan</label>
              <input type="text" value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Pengguna akan menerima email undangan. Password default <strong>12345678</strong> dapat diubah oleh pengguna setelah login.
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Mengirim...' : 'Undang Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserForm({ user, units, onClose, onSaved }) {
  const [role, setRole] = useState(user.role || 'pegawai');
  const [unitId, setUnitId] = useState(user.unit_id || '');
  const [jabatan, setJabatan] = useState(user.jabatan || '');
  const [noHp, setNoHp] = useState(user.no_hp || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const unit = units.find(u => u.id === unitId);
      await base44.entities.User.update(user.id, {
        role,
        unit_id: unitId,
        nama_unit: unit?.nama_unit || '',
        jabatan,
        no_hp: noHp,
      });
      onSaved();
    } catch (err) { alert('Gagal: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Edit Pengguna</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {(user.nama_lengkap || user.full_name)?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium text-sm">{user.nama_lengkap || user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">NIP: {user.nip || '-'}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
              {Object.entries(roleInfo).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Unit Kerja</label>
            <select value={unitId} onChange={e => setUnitId(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
              <option value="">Pilih unit...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Jabatan</label>
            {role === 'pimpinan' ? (
              <select value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                <option value="">Pilih jabatan...</option>
                {pimpinanOptions.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            ) : (
              <input type="text" value={jabatan} onChange={e => setJabatan(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">No. HP</label>
            <input type="text" value={noHp} onChange={e => setNoHp(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
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

function PasswordModal({ user, onClose, onReset }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2"><KeyRound className="w-5 h-5" /> Info Password</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {(user.nama_lengkap || user.full_name)?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium text-sm">{user.nama_lengkap || user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Password Default</span>
              <code className="px-2 py-1 bg-card border border-border rounded text-sm font-mono font-bold">{user.default_password || '12345678'}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status Password</span>
              {user.password_changed ? (
                <span className="flex items-center gap-1 text-xs text-green-600"><Lock className="w-3 h-3" /> Sudah Diubah</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600"><Unlock className="w-3 h-3" /> Masih Default</span>
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              Username login menggunakan <strong>NIP</strong>. Password default adalah <strong>12345678</strong> dan dapat diubah oleh pengguna setelah login.
            </p>
          </div>

          <button
            onClick={onReset}
            className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" /> Reset Password ke "12345678"
          </button>
          <button onClick={onClose} className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Tutup</button>
        </div>
      </div>
    </div>
  );
}