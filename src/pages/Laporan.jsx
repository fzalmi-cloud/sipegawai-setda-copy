import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { BarChart3, Download, Filter } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import moment from 'moment';

export default function Laporan() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterKategori, setFilterKategori] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, u] = await Promise.all([
          base44.entities.ServiceTicket.filter({}, '-tanggal_pengajuan', 500),
          base44.entities.Unit.filter({ aktif: true }, 'urutan', 50)
        ]);
        setTickets(t);
        setUnits(u);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (filterUnit !== 'all' && t.unit_id !== filterUnit) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterKategori !== 'all' && t.kategori_layanan !== filterKategori) return false;
      if (dateFrom && t.tanggal_pengajuan && moment(t.tanggal_pengajuan).isBefore(moment(dateFrom))) return false;
      if (dateTo && t.tanggal_pengajuan && moment(t.tanggal_pengajuan).isAfter(moment(dateTo).endOf('day'))) return false;
      return true;
    });
  }, [tickets, filterUnit, filterStatus, filterKategori, dateFrom, dateTo]);

  const perKategori = useMemo(() => {
    const map = {};
    filtered.forEach(t => { map[t.kategori_layanan] = (map[t.kategori_layanan] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const perUnit = useMemo(() => {
    const map = {};
    filtered.forEach(t => { const u = t.nama_unit || 'Lainnya'; map[u] = (map[u] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 23) + '...' : name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filtered]);

  const colors = ['#1e3a8a', '#f59e0b', '#22c55e', '#a855f7', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Laporan & Rekap Layanan</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} tiket dalam filter</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Unit/Biro</label>
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
            <option value="all">Semua Unit</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Kategori Layanan</label>
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
            <option value="all">Semua Kategori</option>
            {['Pensiun', 'Kenaikan Pangkat', 'Jabatan Fungsional', 'Pelantikan', 'Cuti', 'Mutasi', 'Data Kepegawaian', 'Surat Keterangan', 'KGB', 'Disiplin', 'Pengembangan Kompetensi', 'Lainnya'].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
            <option value="all">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Tiket</p>
          <p className="text-2xl font-bold mt-1">{filtered.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Selesai</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{filtered.filter(t => t.status === 'Selesai').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Terlambat SLA</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{filtered.filter(t => t.terlambat_sla).length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Ditolak</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{filtered.filter(t => t.status === 'Ditolak').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Per Kategori Layanan</h3>
          {perKategori.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={perKategori} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} className="text-xs" />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>}
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Per Unit/Biro</h3>
          {perUnit.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={perUnit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {perUnit.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Detail Tiket</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">No. Tiket</th>
                <th className="text-left px-4 py-3 font-semibold">Pegawai</th>
                <th className="text-left px-4 py-3 font-semibold">Layanan</th>
                <th className="text-left px-4 py-3 font-semibold">Unit</th>
                <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 50).map(t => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3"><Link to={`/tiket/${t.id}`} className="font-medium text-primary hover:underline">{t.nomor_tiket}</Link></td>
                  <td className="px-4 py-3 text-xs">{t.nama_pegawai}</td>
                  <td className="px-4 py-3 text-xs">{t.nama_layanan}</td>
                  <td className="px-4 py-3 text-xs">{t.nama_unit}</td>
                  <td className="px-4 py-3 text-xs">{t.tanggal_pengajuan ? moment(t.tanggal_pengajuan).format('DD MMM YYYY') : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} size="xs" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && <p className="text-xs text-muted-foreground text-center py-3">Menampilkan 50 dari {filtered.length} tiket</p>}
      </div>
    </div>
  );
}