import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import CutiForm from '@/components/cuti/CutiForm';
import { CalendarDays, Plus, ChevronRight, AlertTriangle, FileDown } from 'lucide-react';
import moment from 'moment';

export default function Cuti() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [filterUnit, setFilterUnit] = useState('all');

  const canSubmit = ['pegawai', 'operator_biro', 'admin_kepegawaian', 'super_admin'].includes(user?.role);

  useEffect(() => { load(); }, [user]);
  const load = async () => {
    try {
      const [leaveData, empData] = await Promise.all([
        base44.entities.LeaveRequest.filter({}, '-tanggal_pengajuan', 200),
        base44.entities.Employee.filter({ deleted: false }, 'nama_lengkap', 500),
      ]);
      setLeaves(leaveData);
      setEmployees(empData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const units = useMemo(() => {
    const u = [...new Set(leaves.map(l => l.nama_unit).filter(Boolean))];
    return u.sort();
  }, [leaves]);

  const filtered = useMemo(() => {
    return leaves.filter(l => {
      const matchStatus = filterStatus === 'all' || l.status_kepegawaian === filterStatus;
      const matchUnit = filterUnit === 'all' || l.nama_unit === filterUnit;
      return matchStatus && matchUnit;
    });
  }, [leaves, filterStatus, filterUnit]);

  // Detect overlapping leaves per unit
  const overlaps = useMemo(() => {
    const result = [];
    const byUnit = {};
    leaves.forEach(l => {
      if (l.status_kepegawaian === 'Ditolak') return;
      if (!byUnit[l.nama_unit]) byUnit[l.nama_unit] = [];
      byUnit[l.nama_unit].push(l);
    });
    Object.entries(byUnit).forEach(([unit, items]) => {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          if (moment(a.tanggal_selesai) >= moment(b.tanggal_mulai) && moment(a.tanggal_mulai) <= moment(b.tanggal_selesai)) {
            result.push({ a, b, unit });
          }
        }
      }
    });
    return result;
  }, [leaves]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  const stats = {
    total: leaves.length,
    menunggu: leaves.filter(l => l.status_kepegawaian === 'Menunggu').length,
    disetujui: leaves.filter(l => l.status_kepegawaian === 'Disetujui').length,
    ditolak: leaves.filter(l => l.status_kepegawaian === 'Ditolak').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Layanan Cuti</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} pengajuan cuti</p>
        </div>
        {canSubmit && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Ajukan Cuti
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold font-heading mt-1">{stats.total}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Menunggu</p>
          <p className="text-2xl font-bold font-heading mt-1 text-amber-600">{stats.menunggu}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Disetujui</p>
          <p className="text-2xl font-bold font-heading mt-1 text-green-600">{stats.disetujui}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Ditolak</p>
          <p className="text-2xl font-bold font-heading mt-1 text-red-600">{stats.ditolak}</p>
        </div>
      </div>

      {overlaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Tumpang Tindih Cuti ({overlaps.length})</p>
          </div>
          <div className="space-y-1">
            {overlaps.slice(0, 5).map((o, i) => (
              <p key={i} className="text-xs text-amber-700">
                <span className="font-medium">{o.unit}</span>: {o.a.nama_pegawai} ({moment(o.a.tanggal_mulai).format('DD MMM')}) &amp; {o.b.nama_pegawai} ({moment(o.b.tanggal_mulai).format('DD MMM')})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Unit</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada pengajuan cuti</p>
          </div>
        ) : (
          filtered.map(l => (
            <div key={l.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{l.nama_pegawai}</p>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{l.jenis_cuti}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.nama_unit}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{moment(l.tanggal_mulai).format('DD MMM')} - {moment(l.tanggal_selesai).format('DD MMM YYYY')}</span>
                      <span className="text-xs text-muted-foreground">{l.jumlah_hari} hari</span>
                    </div>
                    {l.alasan && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{l.alasan}</p>}
                    {l.file_url && (
                      <a href={l.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                        <FileDown className="w-3 h-3" /> Lampiran
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status_kepegawaian === 'Disetujui' ? 'bg-green-50 text-green-700' : l.status_kepegawaian === 'Ditolak' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{l.status_kepegawaian}</span>
                  <p className="text-xs text-muted-foreground mt-1">Atasan: <span className={`font-medium ${l.status_atasan === 'Disetujui' ? 'text-green-600' : l.status_atasan === 'Ditolak' ? 'text-red-600' : 'text-amber-600'}`}>{l.status_atasan}</span></p>
                  {l.ticket_id && (
                    <Link to={`/tiket/${l.ticket_id}`} className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline mt-1">
                      Detail <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CutiForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={load}
        employees={employees}
        existingLeaves={leaves}
      />
    </div>
  );
}