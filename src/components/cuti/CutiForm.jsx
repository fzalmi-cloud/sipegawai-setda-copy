import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

const JENIS_CUTI = [
  'Cuti Tahunan', 'Cuti Besar', 'Cuti Sakit', 'Cuti Melahirkan',
  'Cuti Karena Alasan Penting', 'Cuti Bersama', 'Cuti di Luar Tanggungan Negara'
];

export default function CutiForm({ open, onClose, onSaved, employees, existingLeaves }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'pegawai';

  const [form, setForm] = useState({
    employee_id: '',
    jenis_cuti: 'Cuti Tahunan',
    tanggal_mulai: '',
    tanggal_selesai: '',
    alasan: '',
    atasan_langsung: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overlap, setOverlap] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && isStaff && employees.length === 1) {
      setForm(f => ({ ...f, employee_id: employees[0].id, atasan_langsung: employees[0].atasan_langsung || '' }));
    }
  }, [open, isStaff, employees]);

  const selectedEmp = employees.find(e => e.id === form.employee_id);

  // Calculate working days (exclude weekends)
  const calcHari = () => {
    if (!form.tanggal_mulai || !form.tanggal_selesai) return 0;
    const start = moment(form.tanggal_mulai);
    const end = moment(form.tanggal_selesai);
    if (end < start) return 0;
    let count = 0;
    let cur = start.clone();
    while (cur <= end) {
      const day = cur.day();
      if (day !== 0 && day !== 6) count++;
      cur.add(1, 'day');
    }
    return count;
  };

  // Check overlap in same unit
  useEffect(() => {
    if (!form.tanggal_mulai || !form.tanggal_selesai || !selectedEmp) {
      setOverlap(null);
      return;
    }
    const start = moment(form.tanggal_mulai);
    const end = moment(form.tanggal_selesai);
    const conflicts = existingLeaves.filter(l =>
      l.id !== form.id &&
      l.nama_unit === selectedEmp.nama_unit &&
      l.status_kepegawaian !== 'Ditolak' &&
      moment(l.tanggal_selesai) >= start &&
      moment(l.tanggal_mulai) <= end
    );
    if (conflicts.length > 0) {
      setOverlap(conflicts);
    } else {
      setOverlap(null);
    }
  }, [form.tanggal_mulai, form.tanggal_selesai, form.employee_id, selectedEmp, existingLeaves]);

  const handleSubmit = async () => {
    setError('');
    if (!form.employee_id) { setError('Pilih pegawai terlebih dahulu'); return; }
    if (!form.tanggal_mulai || !form.tanggal_selesai) { setError('Isi tanggal mulai dan selesai'); return; }
    if (calcHari() <= 0) { setError('Tanggal selesai tidak boleh sebelum tanggal mulai'); return; }

    setSaving(true);
    try {
      let file_url = '';
      let nama_file = '';
      if (file) {
        const res = await base44.integrations.Core.UploadFile({ file });
        file_url = res.file_url;
        nama_file = file.name;
      }

      // Find cuti service
      const services = await base44.entities.Service.filter({ kategori: 'Cuti', aktif: true }, 'urutan', 20);
      const svc = services.find(s => s.nama_layanan === form.jenis_cuti) || services[0];

      // Generate ticket number
      const year = new Date().getFullYear();
      const count = existingLeaves.length + 1;
      const nomor_tiket = `PEG-SETDA-${year}-${String(count).padStart(4, '0')}`;

      // Create ticket
      const ticket = await base44.entities.ServiceTicket.create({
        nomor_tiket,
        employee_id: form.employee_id,
        nama_pegawai: selectedEmp.nama_lengkap,
        nip_pegawai: selectedEmp.nip,
        unit_id: selectedEmp.unit_id,
        nama_unit: selectedEmp.nama_unit,
        service_id: svc?.id,
        nama_layanan: form.jenis_cuti,
        kategori_layanan: 'Cuti',
        status: 'Dikirim Pemohon',
        diajukan_oleh: user.id,
        nama_pengaju: user.full_name,
        role_pengaju: user.role,
        tanggal_pengajuan: new Date().toISOString(),
        batas_waktu_sla: moment().add(svc?.sla_hari || 2, 'days').toISOString(),
        prioritas: 'Normal',
      });

      // Create leave request
      await base44.entities.LeaveRequest.create({
        employee_id: form.employee_id,
        nama_pegawai: selectedEmp.nama_lengkap,
        nip_pegawai: selectedEmp.nip,
        unit_id: selectedEmp.unit_id,
        nama_unit: selectedEmp.nama_unit,
        jenis_cuti: form.jenis_cuti,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        jumlah_hari: calcHari(),
        alasan: form.alasan,
        file_url,
        nama_file,
        atasan_langsung: form.atasan_langsung || selectedEmp.atasan_langsung,
        status_atasan: 'Menunggu',
        status_kepegawaian: 'Menunggu',
        ticket_id: ticket.id,
        diajukan_oleh: user.id,
        tanggal_pengajuan: new Date().toISOString(),
      });

      // Create status history
      await base44.entities.TicketStatusHistory.create({
        ticket_id: ticket.id,
        nomor_tiket,
        status_sesudah: 'Dikirim Pemohon',
        diubah_oleh: user.id,
        nama_pengubah: user.full_name,
        role_pengubah: user.role,
        catatan: 'Pengajuan cuti dikirim oleh pemohon',
        tanggal: new Date().toISOString(),
      });

      // Notify kepegawaian staff
      const staffUsers = await base44.entities.User.filter({ role: { $in: ['admin_kepegawaian', 'super_admin'] } }, null, 50);
      await base44.entities.Notification.bulkCreate(
        staffUsers.map(u => ({
          user_id: u.id,
          ticket_id: ticket.id,
          nomor_tiket,
          judul: 'Pengajuan Cuti Baru',
          pesan: `${selectedEmp.nama_lengkap} mengajukan ${form.jenis_cuti} (${calcHari()} hari)`,
          tipe: 'Cuti',
          tanggal: new Date().toISOString(),
        }))
      );

      onSaved();
      setForm({ employee_id: '', jenis_cuti: 'Cuti Tahunan', tanggal_mulai: '', tanggal_selesai: '', alasan: '', atasan_langsung: '' });
      setFile(null);
      onClose();
    } catch (e) {
      setError(e.message || 'Gagal menyimpan pengajuan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajukan Cuti</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isStaff && (
            <div>
              <Label>Pegawai</Label>
              <select
                value={form.employee_id}
                onChange={e => {
                  const emp = employees.find(em => em.id === e.target.value);
                  setForm({ ...form, employee_id: e.target.value, atasan_langsung: emp?.atasan_langsung || '' });
                }}
                className="w-full mt-1 px-3 py-2 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
              >
                <option value="">Pilih pegawai...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.nama_lengkap} — {e.nip}</option>)}
              </select>
            </div>
          )}

          <div>
            <Label>Jenis Cuti</Label>
            <select
              value={form.jenis_cuti}
              onChange={e => setForm({ ...form, jenis_cuti: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
            >
              {JENIS_CUTI.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={form.tanggal_mulai} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={form.tanggal_selesai} onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })} className="mt-1" />
            </div>
          </div>

          {calcHari() > 0 && (
            <div className="text-sm bg-primary/5 text-primary rounded-lg px-3 py-2 font-medium">
              <CheckCircle2 className="w-4 h-4 inline mr-1" /> {calcHari()} hari kerja
            </div>
          )}

          {overlap && (
            <div className="text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Tumpang tindih cuti di unit yang sama</p>
                <p className="text-xs mt-0.5">{overlap.map(o => `${o.nama_pegawai} (${moment(o.tanggal_mulai).format('DD MMM')} - ${moment(o.tanggal_selesai).format('DD MMM')})`).join(', ')}</p>
              </div>
            </div>
          )}

          <div>
            <Label>Alasan Cuti</Label>
            <Textarea value={form.alasan} onChange={e => setForm({ ...form, alasan: e.target.value })} rows={2} className="mt-1" placeholder="Alasan pengajuan cuti..." />
          </div>

          <div>
            <Label>Atasan Langsung</Label>
            <Input value={form.atasan_langsung} onChange={e => setForm({ ...form, atasan_langsung: e.target.value })} className="mt-1" placeholder="Nama atasan langsung" />
          </div>

          <div>
            <Label>Surat Permohonan / Dokumen Pendukung</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById('cuti-file').click()}>
              {file ? (
                <p className="text-sm text-primary font-medium">{file.name}</p>
              ) : (
                <>
                  <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Klik untuk unggah (PDF/JPG, max 5MB)</p>
                </>
              )}
              <input id="cuti-file" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}