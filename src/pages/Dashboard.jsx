import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import {
  Ticket, Clock, AlertTriangle, CheckCircle2, FilePlus,
  TrendingUp, Users, Building2, CalendarClock, Award,
  ArrowRight, Bell, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import moment from 'moment';

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        let ticketFilter = {};
        if (user?.role === 'operator_biro' && user?.unit_id) {
          ticketFilter = { unit_id: user.unit_id };
        } else if (user?.role === 'pegawai') {
          ticketFilter = { diajukan_oleh: user.id };
        }
        const [ticketData, empData] = await Promise.all([
          base44.entities.ServiceTicket.filter(ticketFilter, '-tanggal_pengajuan', 200),
          (user?.role === 'admin_kepegawaian' || user?.role === 'super_admin')
            ? base44.entities.Employee.filter({ status_pegawai: 'Aktif' }, '-created_date', 200)
            : Promise.resolve([])
        ]);
        setTickets(ticketData);
        setEmployees(empData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const baru = tickets.filter(t => t.status === 'Dikirim Pemohon' || t.status === 'Diterima Operator Biro').length;
    const verifikasi = tickets.filter(t => t.status === 'Verifikasi Awal' || t.status === 'Verifikasi Lanjutan' || t.status === 'Diteruskan ke Kepegawaian Setda').length;
    const perbaikan = tickets.filter(t => t.status === 'Perlu Perbaikan' || t.status === 'Perbaikan Dikirim').length;
    const siapTerusan = tickets.filter(t => t.status === 'Siap Diteruskan ke BKD/BKN' || t.status === 'Disetujui Pimpinan').length;
    const selesai = tickets.filter(t => t.status === 'Selesai').length;
    const terlambat = tickets.filter(t => t.terlambat_sla && t.status !== 'Selesai' && t.status !== 'Dibatalkan' && t.status !== 'Ditolak').length;
    return { total, baru, verifikasi, perbaikan, siapTerusan, selesai, terlambat };
  }, [tickets]);

  const perStatusData = useMemo(() => {
    const statuses = ['Dikirim Pemohon', 'Verifikasi Awal', 'Perlu Perbaikan', 'Menunggu Persetujuan Pimpinan', 'Selesai', 'Ditolak'];
    const colors = ['#1e3a8a', '#f59e0b', '#f97316', '#a855f7', '#22c55e', '#ef4444'];
    return statuses.map((s, i) => ({
      name: s.length > 20 ? s.substring(0, 18) + '...' : s,
      value: tickets.filter(t => t.status === s).length,
      color: colors[i]
    })).filter(d => d.value > 0);
  }, [tickets]);

  const perUnitData = useMemo(() => {
    const unitMap = {};
    tickets.forEach(t => {
      const u = t.nama_unit || 'Lainnya';
      unitMap[u] = (unitMap[u] || 0) + 1;
    });
    return Object.entries(unitMap)
      .map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 18) + '...' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [tickets]);

  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = moment().subtract(i, 'months');
      const count = tickets.filter(t =>
        t.tanggal_pengajuan && moment(t.tanggal_pengajuan).isSame(m, 'month')
      ).length;
      months.push({ name: m.format('MMM'), count });
    }
    return months;
  }, [tickets]);

  const calonPensiun = useMemo(() => {
    if (!employees.length) return [];
    const now = moment();
    const oneYear = moment().add(1, 'year');
    return employees.filter(e => {
      if (!e.tanggal_lahir) return false;
      const bup = moment(e.tanggal_lahir).add(e.jenis_kelamin === 'Laki-laki' ? 58 : 58, 'years');
      return bup.isAfter(now) && bup.isBefore(oneYear);
    }).slice(0, 5);
  }, [employees]);

  const calonNaikPangkat = useMemo(() => {
    if (!employees.length) return [];
    const now = moment();
    const oneYear = moment().add(1, 'year');
    return employees.filter(e => {
      if (!e.tmt_pangkat_terakhir) return false;
      return moment(e.tmt_pangkat_terakhir).add(4, 'years').isBefore(oneYear) &&
             moment(e.tmt_pangkat_terakhir).add(4, 'years').isAfter(now);
    }).slice(0, 5);
  }, [employees]);

  const prioritasTiket = useMemo(() => {
    return tickets
      .filter(t => t.status !== 'Selesai' && t.status !== 'Ditolak' && t.status !== 'Dibatalkan')
      .sort((a, b) => {
        if (a.terlambat_sla && !b.terlambat_sla) return -1;
        if (!a.terlambat_sla && b.terlambat_sla) return 1;
        if (a.prioritas === 'Urgent' && b.prioritas !== 'Urgent') return -1;
        if (a.prioritas !== 'Urgent' && b.prioritas === 'Urgent') return 1;
        return new Date(a.tanggal_pengajuan) - new Date(b.tanggal_pengajuan);
      })
      .slice(0, 6);
  }, [tickets]);

  const isPimpinan = user?.role === 'pimpinan';
  const isPetugas = ['super_admin', 'admin_kepegawaian'].includes(user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">
          Selamat datang, {user?.full_name?.split(' ')[0] || 'Pengguna'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isPimpinan ? 'Ringkasan monitoring layanan kepegawaian Sekretariat Daerah' :
           isPetugas ? 'Dashboard petugas kepegawaian - pantau dan kelola tiket layanan' :
           'Pantau status permohonan layanan kepegawaian Anda'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Permohonan" value={stats.total} icon={Ticket} color="primary" />
        <StatCard title="Baru Masuk" value={stats.baru} icon={FilePlus} color="info" />
        <StatCard title="Dalam Verifikasi" value={stats.verifikasi} icon={Clock} color="warning" />
        <StatCard title="Perlu Perbaikan" value={stats.perbaikan} icon={AlertTriangle} color="danger" />
        <StatCard title="Siap Diteruskan" value={stats.siapTerusan} icon={ArrowRight} color="accent" />
        <StatCard title="Selesai" value={stats.selesai} icon={CheckCircle2} color="success" />
        <StatCard title="Terlambat SLA" value={stats.terlambat} icon={AlertTriangle} color="danger" subtitle="Perlu segera ditindaklanjuti" />
        <StatCard title="Pegawai Aktif" value={employees.length || '-'} icon={Users} color="primary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Tren Permohonan per Bulan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Permohonan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Permohonan per Status</h3>
          {perStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={perStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {perStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Priority Tickets */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Tiket Prioritas
          </h3>
          <Link to="/tiket" className="text-xs text-primary hover:underline flex items-center gap-1">
            Lihat semua <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {prioritasTiket.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada tiket prioritas</p>
          ) : (
            prioritasTiket.map(t => (
              <Link key={t.id} to={`/tiket/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.terlambat_sla ? 'bg-red-500' : t.prioritas === 'Urgent' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.nomor_tiket} — {t.nama_layanan}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.nama_pegawai} · {t.nama_unit}</p>
                </div>
                <StatusBadge status={t.status} size="xs" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Bottom Row */}
      {(isPetugas || isPimpinan) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Per Unit */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4">Permohonan per Biro/Unit</h3>
            {perUnitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perUnitData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} name="Permohonan" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
            )}
          </div>

          {/* Calon Pensiun & Naik Pangkat */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-500" />
                Pegawai Mendekati Pensiun (1 Tahun)
              </h3>
            </div>
            <div className="divide-y divide-border max-h-[200px] overflow-y-auto scrollbar-thin">
              {calonPensiun.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
              ) : (
                calonPensiun.map(e => (
                  <div key={e.id} className="px-5 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{e.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{e.nip} · {e.nama_unit}</p>
                    </div>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/ajukan" className="bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity group">
          <FilePlus className="w-6 h-6 mb-2" />
          <p className="font-semibold text-sm">Ajukan Layanan</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Buat tiket layanan baru</p>
        </Link>
        <Link to="/tiket" className="bg-accent text-accent-foreground rounded-xl p-5 hover:opacity-90 transition-opacity group">
          <Ticket className="w-6 h-6 mb-2" />
          <p className="font-semibold text-sm">Tiket Saya</p>
          <p className="text-xs text-accent-foreground/70 mt-1">Pantau status permohonan</p>
        </Link>
        <Link to="/portal" className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
          <Building2 className="w-6 h-6 mb-2 text-primary" />
          <p className="font-semibold text-sm">Portal Layanan</p>
          <p className="text-xs text-muted-foreground mt-1">Daftar & persyaratan</p>
        </Link>
        {(isPetugas || isPimpinan) && (
          <Link to="/laporan" className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <TrendingUp className="w-6 h-6 mb-2 text-primary" />
            <p className="font-semibold text-sm">Laporan</p>
            <p className="text-xs text-muted-foreground mt-1">Rekap & export data</p>
          </Link>
        )}
      </div>
    </div>
  );
}