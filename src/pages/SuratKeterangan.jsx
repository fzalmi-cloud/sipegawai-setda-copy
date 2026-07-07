import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import { FileText, Plus, ChevronRight, Search, Download } from 'lucide-react';
import moment from 'moment';

export default function SuratKeterangan() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [ticketData, tmplData] = await Promise.all([
        base44.entities.ServiceTicket.filter({ kategori_layanan: 'Surat Keterangan', deleted: false }, '-tanggal_pengajuan', 200),
        base44.entities.DocumentTemplate.filter({ kategori: 'Surat Keterangan', aktif: true }, null, 50),
      ]);
      setTickets(ticketData);
      setTemplates(tmplData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = !search ||
        t.nama_pegawai?.toLowerCase().includes(search.toLowerCase()) ||
        t.nomor_tiket?.toLowerCase().includes(search.toLowerCase()) ||
        t.nama_layanan?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tickets, search, filterStatus]);

  const stats = {
    total: tickets.length,
    proses: tickets.filter(t => !['Selesai', 'Ditolak', 'Dibatalkan'].includes(t.status)).length,
    selesai: tickets.filter(t => t.status === 'Selesai').length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Surat Keterangan</h1>
          <p className="text-muted-foreground mt-1">Pengajuan dan penerbitan surat keterangan kepegawaian</p>
        </div>
        <Link to="/ajukan?kategori=Surat%20Keterangan" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Ajukan Surat
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard title="Total Pengajuan" value={stats.total} icon={FileText} color="primary" />
        <StatCard title="Dalam Proses" value={stats.proses} icon={FileText} color="warning" />
        <StatCard title="Selesai" value={stats.selesai} icon={FileText} color="success" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, nomor tiket, jenis surat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Status</option>
          <option value="Draft">Draft</option>
          <option value="Dikirim Pemohon">Dikirim Pemohon</option>
          <option value="Verifikasi Awal">Verifikasi</option>
          <option value="Selesai">Selesai</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada pengajuan surat keterangan</p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{t.nama_layanan}</p>
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">{t.nomor_tiket}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.nama_pegawai} · {t.nama_unit}</p>
                    <p className="text-xs text-muted-foreground mt-1">Diajukan: {moment(t.tanggal_pengajuan).format('DD MMM YYYY')}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <StatusBadge status={t.status} size="xs" />
                  <Link to={`/tiket/${t.id}`} className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline mt-1">
                    Detail <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {templates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-heading font-bold mb-3">Template Tersedia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tmpl.nama_template}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.variabel_tersedia?.substring(0, 80)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}