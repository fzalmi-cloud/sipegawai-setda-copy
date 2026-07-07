import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import { DollarSign, CalendarClock, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import moment from 'moment';

export default function KGB() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [empData, recData, ticketData] = await Promise.all([
        base44.entities.Employee.filter({ deleted: false, status_pegawai: 'Aktif' }, 'nama_lengkap', 500),
        base44.entities.KgbRecord.filter({}, '-tmt_kgb', 200),
        base44.entities.ServiceTicket.filter({ kategori_layanan: 'KGB', deleted: false }, '-tanggal_pengajuan', 200),
      ]);
      setEmployees(empData);
      setRecords(recData);
      setTickets(ticketData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // KGB interval is typically every 2 years based on TMT pangkat
  const candidates = useMemo(() => {
    const now = moment();
    return employees
      .filter(e => e.tmt_pangkat_terakhir && e.pangkat_golongan)
      .map(e => {
        const tmt = moment(e.tmt_pangkat_terakhir);
        // KGB every 2 years from TMT pangkat
        let nextKgb = tmt.clone();
        while (nextKgb <= now) {
          nextKgb.add(2, 'years');
        }
        const monthsUntil = nextKgb.diff(now, 'months');

        // Check if there's an existing ticket
        const existingTicket = tickets.find(t =>
          t.employee_id === e.id && t.status !== 'Selesai' && t.status !== 'Ditolak' && t.status !== 'Dibatalkan'
        );

        // Check KGB records history
        const history = records.filter(r => r.employee_id === e.id);

        return {
          ...e,
          next_kgb_date: nextKgb.format('YYYY-MM-DD'),
          months_until: monthsUntil,
          last_kgb: tmt.format('YYYY-MM-DD'),
          existing_ticket: existingTicket,
          history_count: history.length,
        };
      })
      .filter(e => e.months_until <= 24)
      .sort((a, b) => a.months_until - b.months_until);
  }, [employees, tickets, records]);

  const filtered = useMemo(() => {
    if (filterPeriod === 'all') return candidates;
    const months = { '3bulan': 3, '6bulan': 6, '1tahun': 12, '2tahun': 24 };
    return candidates.filter(e => e.months_until <= months[filterPeriod]);
  }, [candidates, filterPeriod]);

  const stats = useMemo(() => ({
    total: candidates.length,
    '3bulan': candidates.filter(e => e.months_until <= 3).length,
    '6bulan': candidates.filter(e => e.months_until <= 6).length,
    '1tahun': candidates.filter(e => e.months_until <= 12).length,
  }), [candidates]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Kenaikan Gaji Berkala (KGB)</h1>
        <p className="text-muted-foreground mt-1">Monitoring jadwal KGB pegawai berdasarkan TMT pangkat terakhir</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total KGB Mendekati" value={stats.total} icon={DollarSign} color="primary" />
        <StatCard title="≤ 3 Bulan" value={stats['3bulan']} icon={Clock} color="danger" />
        <StatCard title="≤ 6 Bulan" value={stats['6bulan']} icon={CalendarClock} color="warning" />
        <StatCard title="≤ 1 Tahun" value={stats['1tahun']} icon={TrendingUp} color="accent" />
      </div>

      <div className="flex items-center gap-3">
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
          <option value="all">Semua Periode</option>
          <option value="3bulan">≤ 3 Bulan</option>
          <option value="6bulan">≤ 6 Bulan</option>
          <option value="1tahun">≤ 1 Tahun</option>
          <option value="2tahun">≤ 2 Tahun</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Tidak ada pegawai dengan KGB mendekati pada periode ini</p>
          </div>
        ) : (
          filtered.map(e => (
            <div key={e.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{e.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">{e.nip} · {e.nama_unit}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Pangkat: <span className="font-medium text-foreground">{e.pangkat_golongan}</span></span>
                      <span className="text-xs text-muted-foreground">TMT Pangkat: {moment(e.tmt_pangkat_terakhir).format('DD MMM YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">KGB Berikutnya: <span className="font-medium text-foreground">{moment(e.next_kgb_date).format('DD MMM YYYY')}</span></span>
                      <span className={`text-xs font-medium ${e.months_until <= 3 ? 'text-red-600' : e.months_until <= 6 ? 'text-amber-600' : 'text-primary'}`}>
                        {e.months_until <= 0 ? 'Sudah due' : `${e.months_until} bulan lagi`}
                      </span>
                      {e.history_count > 0 && <span className="text-xs text-muted-foreground">Riwayat: {e.history_count} KGB</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {e.existing_ticket ? (
                    <Link to={`/tiket/${e.existing_ticket.id}`} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                      Tiket aktif <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <Link to={`/ajukan?service_id=kgb`} className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90">
                      Usulkan KGB
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {records.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-heading font-bold mb-3">Riwayat KGB</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Pegawai</th>
                    <th className="text-left px-4 py-3 font-medium">Golongan</th>
                    <th className="text-left px-4 py-3 font-medium">TMT KGB</th>
                    <th className="text-left px-4 py-3 font-medium">Masa Kerja</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 20).map(r => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3">{r.nama_pegawai}</td>
                      <td className="px-4 py-3">{r.golongan_lama} → {r.golongan_baru}</td>
                      <td className="px-4 py-3">{r.tmt_kgb ? moment(r.tmt_kgb).format('DD MMM YYYY') : '-'}</td>
                      <td className="px-4 py-3">{r.masa_kerja_tahun} thn {r.masa_kerja_bulan} bln</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'Selesai' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}