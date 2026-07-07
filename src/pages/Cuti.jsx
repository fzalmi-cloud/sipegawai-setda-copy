import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Plus, ChevronRight } from 'lucide-react';
import moment from 'moment';

export default function Cuti() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { load(); }, [user]);
  const load = async () => {
    try {
      const data = await base44.entities.LeaveRequest.filter({}, '-tanggal_pengajuan', 200);
      setLeaves(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = filterStatus === 'all' ? leaves : leaves.filter(l => l.status_kepegawaian === filterStatus);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Layanan Cuti</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} pengajuan cuti</p>
        </div>
      </div>

      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
        <option value="all">Semua Status</option>
        <option value="Menunggu">Menunggu</option>
        <option value="Disetujui">Disetujui</option>
        <option value="Ditolak">Ditolak</option>
      </select>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada pengajuan cuti</p>
          </div>
        ) : (
          filtered.map(l => (
            <div key={l.id} className="bg-card rounded-xl border border-border p-4">
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
                    {l.alasan && <p className="text-xs text-muted-foreground mt-1 italic">{l.alasan}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status_kepegawaian === 'Disetujui' ? 'bg-green-50 text-green-700' : l.status_kepegawaian === 'Ditolak' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{l.status_kepegawaian}</span>
                  <p className="text-xs text-muted-foreground mt-1">Atasan: <span className={`font-medium ${l.status_atasan === 'Disetujui' ? 'text-green-600' : l.status_atasan === 'Ditolak' ? 'text-red-600' : 'text-amber-600'}`}>{l.status_atasan}</span></p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}