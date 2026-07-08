import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, UserPlus, AlertCircle } from 'lucide-react';

const roleInfo = {
  super_admin: 'Super Admin',
  pimpinan: 'Unsur Pimpinan',
  admin_kepegawaian: 'Admin Kepegawaian Setda',
  operator_biro: 'Operator Biro',
  pegawai: 'Pegawai / ASN',
  bendahara: 'Bendahara / Pejabat Rangkap',
};

const pimpinanOptions = [
  'Sekretaris Daerah',
  'Asisten Sekda - Pemerintahan dan Kesra',
  'Asisten Sekda - Perekonomian dan Pembangunan',
  'Asisten Sekda - Administrasi',
  'Kepala Biro',
];

export default function ManualUserForm({ units, onClose, onSaved }) {
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('pegawai');
  const [unitId, setUnitId] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [noHp, setNoHp] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama) return;
    setSaving(true);
    try {
      const unit = units.find(u => u.id === unitId);
      const finalEmail = email || `${nama.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@setda.sumbarprov.go.id`;

      // Step 1: Invite user (creates the auth user record)
      await base44.users.inviteUser(finalEmail, 'user');

      // Step 2: Update custom fields via backend function (with retry for propagation delay)
      let lastError = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
        try {
          const res = await base44.functions.invoke('updateInvitedUser', {
            email: finalEmail,
            nama_lengkap: nama,
            role,
            nip,
            unit_id: unitId || '',
            nama_unit: unit?.nama_unit || '',
            jabatan,
            no_hp: noHp,
          });
          if (res.data?.success) {
            onSaved();
            return;
          }
        } catch (e) {
          lastError = e;
        }
      }
      throw new Error(lastError?.response?.data?.error || 'Gagal memperbarui data pengguna setelah undangan');
    } catch (err) {
      alert('Gagal menambah pengguna: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Tambah Pengguna
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Cukup isi nama lengkap. Jika email dikosongkan, sistem akan membuat email otomatis dari nama. Password default <strong>12345678</strong>.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
            <input type="text" value={nama} onChange={e => setNama(e.target.value)} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">NIP</label>
            <input type="text" value={nip} onChange={e => setNip(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Email <span className="text-muted-foreground/60">(opsional)</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@setda.sumbarprov.go.id"
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
            <p className="text-[11px] text-muted-foreground mt-1">Jika dikosongkan, email otomatis dibuat dari nama.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Role <span className="text-red-500">*</span></label>
            <select value={role} onChange={e => setRole(e.target.value)} required
              className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
              {Object.entries(roleInfo).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
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
              {saving ? 'Menyimpan...' : 'Tambah Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}