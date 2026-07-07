import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function KenaikanPangkat() {
  const [employees, setEmployees] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriode, setFilterPeriode] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [empData, ticketData] = await Promise.all([
          base44.entities.Employee.filter({ status_pegawai: 'Aktif' }, 'nama_lengkap', 500),
          base44.entities.ServiceTicket.filter({ kategori_layanan: 'Kenaikan Pangkat' }, '-tanggal_pengajuan', 200)
        ]);
        setEmployees(empData);
        setTickets(ticketData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const calonNaikPangkat = useMemo(() => {
    const now = moment();
    const twoYears = moment().add(2, 'years');
    return employees.filter(e => {
      if (!e.tmt_pangkat_terakhir) return false;
      const nextPangkat = moment(e.tmt_pangkat_terakhir).add(4, 'years');
      return nextPangkat.isAfter(now) && nextPangkat.isBefore(twoYears);
    }).map(e => {
      const nextPangkat = moment(e.tmt_pangkat_terakhir).add(4, 'years');
      const monthsUntil = nextPangkat.diff(now, 'months');
      const existingTicket = tickets.find(t => t.employee_id === e.id && t.status !== 'Selesai' && t.status !== 'Ditolak' && t.status !== 'Dibatalkan');
      return { ...e, nextPangkat, monthsUntil, existingTicket };
    }).sort((a, b) => a.monthsUntil - b.monthsUntil);
  }, [employees, tickets]);

  const filtered = filterPeriode === 'all' ? calonNaikPangkat :
    filterPeriode === '6m' ? calonNaikPangkat.filter(e => e.monthsUntil <= 6) :
    filterPeriode === '1y' ? calonNaikPangkat.filter(e => e.monthsUntil <= 12) :
    calonNaikPangkat.filter(e => e.monthsUntil <= 24);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Monitoring Kenaikan Pangkat</h1>
        <p className="text-muted-foreground mt-1">{calonNaikPangkat.length} pegawai berpotensi naik pangkat dalam 2 tahun</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">≤ 6 bulan</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{calonNaikPangkat.filter(e => e.monthsUntil <= 6).length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">≤ 1 tahun</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{calonNaikPangkat.filter(e => e.monthsUntil <= 12).length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">≤ 2 tahun</p>
          <p className="text-2xl font-bold text-primary mt-1">{calonNaikPangkat.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Sudah ada tiket</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{calonNaikPangkat.filter(e => e.existingTicket).length}</p>
        </div>
      </div>

      <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
        <option value="all">Semua Periode (2 tahun)</option>
        <option value="6m">≤ 6 bulan</option>
        <option value="1y">≤ 1 tahun</option>
        <option value="2y">≤ 2 tahun</option>
      </select>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Tidak ada pegawai berpotensi naik pangkat</p>
          </div>
        ) : (
          filtered.map(e => (
            <div key={e.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{e.nama_lengkap?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{e.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">{e.nip} · {e.jabatan} · {e.pangkat_golongan}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">TMT Pangkat: {e.tmt_pangkat_terakhir ? moment(e.tmt_pangkat_terakhir).format('DD MMM YYYY') : '-'}</span>
                      <span className="text-xs text-muted-foreground">Estimasi: {e.nextPangkat.format('DD MMM YYYY')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-sm font-bold ${e.monthsUntil <= 6 ? 'text-red-600' : e.monthsUntil <= 12 ? 'text-amber-600' : 'text-primary'}`}>{e.monthsUntil} bulan</span>
                  {e.existingTicket ? (
                    <Link to={`/tiket/${e.existingTicket.id}`} className="block text-xs text-primary hover:underline mt-1">Lihat tiket →</Link>
                  ) : (
                    <Link to={`/ajukan?service_id=`} className="block text-xs text-muted-foreground mt-1">Belum ada tiket</Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}