import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Building2, Award, Users } from 'lucide-react';

const CHART_COLORS = [
  '#1e3a5f', '#f59e0b', '#2dd4bf', '#a855f7', '#ef4444',
  '#3b82f6', '#10b981', '#f97316', '#ec4899', '#8b5cf6',
  '#14b8a6', '#eab308',
];

export default function PegawaiCharts({ employees, units }) {
  const totalSetda = employees.length;

  const perBiro = useMemo(() => {
    const counts = {};
    employees.forEach(emp => {
      const name = emp.nama_unit || 'Tanpa Unit';
      counts[name] = (counts[name] || 0) + 1;
    });
    const unitOrder = units.reduce((acc, u, i) => {
      acc[u.nama_unit] = u.urutan ?? i;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, urutan: unitOrder[name] ?? 999 }))
      .sort((a, b) => a.urutan - b.urutan);
  }, [employees, units]);

  const perGolongan = useMemo(() => {
    const counts = {};
    employees.forEach(emp => {
      const gol = emp.pangkat_golongan?.trim() || 'Belum Diisi';
      counts[gol] = (counts[gol] || 0) + 1;
    });
    // Sort golongan in a logical order (I/a - IV/e)
    const golOrder = (g) => {
      const m = g.match(/([IV]+)\/([a-e])/i);
      if (!m) return 99;
      const rom = { I: 1, II: 2, III: 3, IV: 4 };
      return (rom[m[1].toUpperCase()] || 9) * 10 + (m[2].toLowerCase().charCodeAt(0) - 96);
    };
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, order: golOrder(name) }))
      .sort((a, b) => a.order - b.order);
  }, [employees]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Pegawai Setda</p>
            <p className="text-xl font-bold">{totalSetda}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Jumlah Biro/Unit</p>
            <p className="text-xl font-bold">{perBiro.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variasi Golongan</p>
            <p className="text-xl font-bold">{perGolongan.length}</p>
          </div>
        </div>
      </div>

      {/* Chart: Per Biro vs Total Setda */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm mb-1">Perbandingan Jumlah Pegawai per Biro vs Total Setda</h3>
        <p className="text-xs text-muted-foreground mb-4">Garis merah menunjukkan total seluruh pegawai Setda</p>
        <ResponsiveContainer width="100%" height={Math.max(300, perBiro.length * 40)}>
          <BarChart data={perBiro} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} interval={0} />
            <Tooltip
              formatter={(value) => [`${value} pegawai`, 'Jumlah']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" name="Pegawai per Biro" fill="#1e3a5f" radius={[0, 4, 4, 0]}>
              {perBiro.map((entry, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-red-500 inline-block" style={{ borderTop: '2px dashed #ef4444' }}></span>
            Total Setda: {totalSetda} pegawai
          </span>
        </div>
      </div>

      {/* Chart: Per Golongan vs Total Setda */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm mb-1">Perbandingan Jumlah Pegawai per Golongan vs Total Setda</h3>
        <p className="text-xs text-muted-foreground mb-4">Garis merah menunjukkan total seluruh pegawai Setda</p>
        <ResponsiveContainer width="100%" height={Math.max(300, perGolongan.length * 40)}>
          <BarChart data={perGolongan} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} interval={0} />
            <Tooltip
              formatter={(value) => [`${value} pegawai`, 'Jumlah']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" name="Pegawai per Golongan" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-red-500 inline-block" style={{ borderTop: '2px dashed #ef4444' }}></span>
            Total Setda: {totalSetda} pegawai
          </span>
        </div>
      </div>
    </div>
  );
}