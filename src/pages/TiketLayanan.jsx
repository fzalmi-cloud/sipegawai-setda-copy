import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { Search, Filter, Ticket, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import moment from 'moment';

export default function TiketLayanan() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        let filter = {};
        if (user?.role === 'operator_biro' && user?.unit_id) {
          filter = { unit_id: user.unit_id };
        } else if (user?.role === 'pegawai') {
          filter = { diajukan_oleh: user.id };
        }
        const data = await base44.entities.ServiceTicket.filter(filter, '-tanggal_pengajuan', 200);
        setTickets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const statusList = ['all', 'Dikirim Pemohon', 'Diterima Operator Biro', 'Diteruskan ke Kepegawaian Setda', 'Verifikasi Awal', 'Perlu Perbaikan', 'Perbaikan Dikirim', 'Verifikasi Lanjutan', 'Menunggu Persetujuan Pimpinan', 'Disetujui Pimpinan', 'Siap Diteruskan ke BKD/BKN', 'Dalam Proses Eksternal', 'Hasil Diterima', 'Selesai', 'Ditolak', 'Dibatalkan'];

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = !search ||
        t.nomor_tiket?.toLowerCase().includes(search.toLowerCase()) ||
        t.nama_pegawai?.toLowerCase().includes(search.toLowerCase()) ||
        t.nama_layanan?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tickets, search, filterStatus]);

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
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Tiket Layanan</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} tiket ditemukan</p>
        </div>
        <Link to="/ajukan" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          + Ajukan Baru
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nomor tiket, pegawai, layanan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
        >
          {statusList.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'Semua Status' : s}</option>
          ))}
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">No. Tiket</th>
              <th className="text-left px-4 py-3 font-semibold">Pegawai</th>
              <th className="text-left px-4 py-3 font-semibold">Layanan</th>
              <th className="text-left px-4 py-3 font-semibold">Unit</th>
              <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
              <th className="text-left px-4 py-3 font-semibold">SLA</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  Tidak ada tiket ditemukan
                </td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/tiket/${t.id}`} className="font-medium text-primary hover:underline">{t.nomor_tiket}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.nama_pegawai}</p>
                    <p className="text-xs text-muted-foreground">{t.nip_pegawai}</p>
                  </td>
                  <td className="px-4 py-3">{t.nama_layanan}</td>
                  <td className="px-4 py-3 text-xs">{t.nama_unit}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {t.tanggal_pengajuan ? moment(t.tanggal_pengajuan).format('DD MMM YYYY') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {t.terlambat_sla && t.status !== 'Selesai' && t.status !== 'Ditolak' && t.status !== 'Dibatalkan' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Terlambat
                      </span>
                    ) : t.batas_waktu_sla && t.status !== 'Selesai' && t.status !== 'Ditolak' && t.status !== 'Dibatalkan' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {moment(t.batas_waktu_sla).fromNow()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} size="xs" /></td>
                  <td className="px-4 py-3">
                    <Link to={`/tiket/${t.id}`} className="text-muted-foreground hover:text-primary">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
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
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Tidak ada tiket ditemukan
          </div>
        ) : (
          filtered.map(t => (
            <Link key={t.id} to={`/tiket/${t.id}`} className="block bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-primary text-sm">{t.nomor_tiket}</p>
                <StatusBadge status={t.status} size="xs" />
              </div>
              <p className="text-sm font-medium">{t.nama_pegawai}</p>
              <p className="text-xs text-muted-foreground">{t.nama_layanan}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{t.nama_unit}</span>
                <span className="text-xs text-muted-foreground">
                  {t.tanggal_pengajuan ? moment(t.tanggal_pengajuan).format('DD MMM YYYY') : '-'}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}