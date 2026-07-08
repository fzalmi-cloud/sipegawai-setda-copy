import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { Search, Filter, Ticket, ChevronRight, AlertTriangle, Clock, Download, Archive, ArchiveRestore, ArchiveX } from 'lucide-react';
import moment from 'moment';

const TIKET_COLUMNS = [
  { key: 'nomor_tiket', label: 'No. Tiket' },
  { key: 'nama_pegawai', label: 'Nama Pegawai' },
  { key: 'nip_pegawai', label: 'NIP' },
  { key: 'nama_layanan', label: 'Layanan' },
  { key: 'kategori_layanan', label: 'Kategori' },
  { key: 'nama_unit', label: 'Unit/Biro' },
  { key: 'status', label: 'Status' },
  { key: 'prioritas', label: 'Prioritas' },
  { key: 'terlambat_sla', label: 'Terlambat SLA' },
  { key: 'persentase_kelengkapan', label: 'Kelengkapan (%)' },
  { key: 'tanggal_pengajuan', label: 'Tanggal Pengajuan' },
  { key: 'tanggal_selesai', label: 'Tanggal Selesai' },
  { key: 'nama_pengaju', label: 'Diajukan Oleh' },
  { key: 'nama_petugas', label: 'Petugas' },
];

function exportTiketExcel(data) {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"><style>td,th{font-family:Arial;font-size:10px;border:1px solid #333;padding:4px;white-space:nowrap}th{background:#1e3a5f;color:#fff;font-weight:bold}</style></head><body>';
  html += '<table><thead><tr>';
  TIKET_COLUMNS.forEach(col => { html += `<th>${col.label}</th>`; });
  html += '</tr></thead><tbody>';
  data.forEach(t => {
    html += '<tr>';
    TIKET_COLUMNS.forEach(col => {
      let val = t[col.key] ?? '';
      if (col.key === 'tanggal_pengajuan' || col.key === 'tanggal_selesai') {
        val = val ? moment(val).format('DD MMM YYYY HH:mm') : '';
      } else if (col.key === 'terlambat_sla') {
        val = val ? 'Ya' : 'Tidak';
      }
      html += `<td>${String(val).replace(/</g, '&lt;')}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Daftar_Tiket_Layanan_${moment().format('YYYYMMDD_HHmm')}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TiketLayanan() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('aktif');
  const [archiving, setArchiving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let filter = { deleted: view === 'arsip' };
      if (user?.role === 'operator_biro' && user?.unit_id) {
        filter = { ...filter, unit_id: user.unit_id };
      } else if (user?.role === 'pegawai') {
        filter = { ...filter, diajukan_oleh: user.id };
      }
      const data = await base44.entities.ServiceTicket.filter(filter, '-tanggal_pengajuan', 200);
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user, view]);

  const handleArchive = async (id) => {
    setArchiving(true);
    try {
      await base44.entities.ServiceTicket.update(id, { deleted: true });
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (e) { alert('Gagal mengarsipkan: ' + e.message); }
    finally { setArchiving(false); }
  };

  const handleUnarchive = async (id) => {
    setArchiving(true);
    try {
      await base44.entities.ServiceTicket.update(id, { deleted: false });
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (e) { alert('Gagal memulihkan: ' + e.message); }
    finally { setArchiving(false); }
  };

  const handleArchiveAllCompleted = async () => {
    const completed = filtered.filter(t => t.status === 'Selesai');
    if (completed.length === 0) { alert('Tidak ada tiket berstatus Selesai untuk diarsipkan.'); return; }
    if (!confirm(`Arsipkan ${completed.length} tiket berstatus "Selesai"? Tiket akan dipindahkan ke arsip dan tidak tampil di daftar aktif.`)) return;
    setArchiving(true);
    try {
      await base44.entities.ServiceTicket.bulkUpdate(completed.map(t => ({ id: t.id, deleted: true })));
      setTickets(prev => prev.filter(t => !completed.some(c => c.id === t.id)));
      alert(`${completed.length} tiket berhasil diarsipkan.`);
    } catch (e) { alert('Gagal mengarsipkan: ' + e.message); }
    finally { setArchiving(false); }
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          {view === 'aktif' && (
            <>
              <button
                onClick={() => exportTiketExcel(filtered)}
                disabled={filtered.length === 0}
                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Ekspor Excel
              </button>
              <button
                onClick={handleArchiveAllCompleted}
                disabled={archiving || filtered.filter(t => t.status === 'Selesai').length === 0}
                className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50 flex items-center gap-2"
              >
                <ArchiveX className="w-4 h-4" /> Arsipkan Selesai
              </button>
            </>
          )}
          <Link to="/ajukan" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            + Ajukan Baru
          </Link>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setView('aktif')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${view === 'aktif' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
        >
          <Ticket className="w-4 h-4" /> Tiket Aktif
        </button>
        <button
          onClick={() => setView('arsip')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${view === 'arsip' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
        >
          <Archive className="w-4 h-4" /> Arsip
        </button>
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
                    <div className="flex items-center gap-1">
                      {view === 'aktif' && t.status === 'Selesai' && (
                        <button
                          onClick={() => handleArchive(t.id)}
                          disabled={archiving}
                          title="Arsipkan Tiket"
                          className="p-1.5 text-muted-foreground hover:text-amber-600"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {view === 'arsip' && (
                        <button
                          onClick={() => handleUnarchive(t.id)}
                          disabled={archiving}
                          title="Pulihkan ke Aktif"
                          className="p-1.5 text-muted-foreground hover:text-green-600"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      )}
                      <Link to={`/tiket/${t.id}`} className="text-muted-foreground hover:text-primary">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
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
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Tidak ada tiket ditemukan
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-4">
              <Link to={`/tiket/${t.id}`} className="block">
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
              {view === 'aktif' && t.status === 'Selesai' && (
                <button
                  onClick={() => handleArchive(t.id)}
                  disabled={archiving}
                  className="mt-3 w-full px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium hover:bg-amber-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Archive className="w-3 h-3" /> Arsipkan
                </button>
              )}
              {view === 'arsip' && (
                <button
                  onClick={() => handleUnarchive(t.id)}
                  disabled={archiving}
                  className="mt-3 w-full px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ArchiveRestore className="w-3 h-3" /> Pulihkan ke Aktif
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}