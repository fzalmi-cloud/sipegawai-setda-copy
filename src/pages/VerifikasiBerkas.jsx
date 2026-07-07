import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { CheckSquare, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import moment from 'moment';

export default function VerifikasiBerkas() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ServiceTicket.filter({}, '-tanggal_pengajuan', 200);
        const needVerification = data.filter(t =>
          ['Dikirim Pemohon', 'Diterima Operator Biro', 'Diteruskan ke Kepegawaian Setda', 'Verifikasi Awal', 'Perlu Perbaikan', 'Perbaikan Dikirim', 'Verifikasi Lanjutan'].includes(t.status)
        );
        setTickets(needVerification);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Verifikasi Berkas</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} tiket menunggu verifikasi</p>
      </div>

      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
        <option value="all">Semua Status Verifikasi</option>
        <option value="Dikirim Pemohon">Dikirim Pemohon</option>
        <option value="Diteruskan ke Kepegawaian Setda">Diteruskan ke Kepegawaian</option>
        <option value="Verifikasi Awal">Verifikasi Awal</option>
        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
        <option value="Perbaikan Dikirim">Perbaikan Dikirim</option>
        <option value="Verifikasi Lanjutan">Verifikasi Lanjutan</option>
      </select>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Tidak ada tiket yang perlu diverifikasi</p>
          </div>
        ) : (
          filtered.map(t => (
            <Link key={t.id} to={`/tiket/${t.id}`} className="block bg-card rounded-xl border border-border p-4 hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-primary text-sm">{t.nomor_tiket}</p>
                    <StatusBadge status={t.status} size="xs" />
                    {t.terlambat_sla && <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-medium"><AlertTriangle className="w-3 h-3" /> SLA</span>}
                  </div>
                  <p className="text-sm font-medium">{t.nama_layanan}</p>
                  <p className="text-xs text-muted-foreground">{t.nama_pegawai} · {t.nama_unit}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Kelengkapan:</span>
                      <span className={`text-xs font-bold ${t.persentase_kelengkapan === 100 ? 'text-green-600' : t.persentase_kelengkapan >= 75 ? 'text-amber-600' : t.persentase_kelengkapan >= 50 ? 'text-orange-600' : 'text-red-600'}`}>{t.persentase_kelengkapan || 0}%</span>
                    </div>
                    {t.batas_waktu_sla && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {moment(t.batas_waktu_sla).fromNow()}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}