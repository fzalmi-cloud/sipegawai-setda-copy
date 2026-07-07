import React from 'react';

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
  'Dikirim Pemohon': 'bg-blue-50 text-blue-700 border-blue-200',
  'Diterima Operator Biro': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Diteruskan ke Kepegawaian Setda': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Verifikasi Awal': 'bg-amber-50 text-amber-700 border-amber-200',
  'Perlu Perbaikan': 'bg-orange-50 text-orange-700 border-orange-200',
  'Perbaikan Dikirim': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Verifikasi Lanjutan': 'bg-amber-50 text-amber-700 border-amber-200',
  'Menunggu Persetujuan Pimpinan': 'bg-purple-50 text-purple-700 border-purple-200',
  'Disetujui Pimpinan': 'bg-violet-50 text-violet-700 border-violet-200',
  'Siap Diteruskan ke BKD/BKN': 'bg-teal-50 text-teal-700 border-teal-200',
  'Dalam Proses Eksternal': 'bg-sky-50 text-sky-700 border-sky-200',
  'Hasil Diterima': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Selesai': 'bg-green-50 text-green-700 border-green-200',
  'Ditolak': 'bg-red-50 text-red-700 border-red-200',
  'Dibatalkan': 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function StatusBadge({ status, size = 'sm' }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap ${colorClass} ${sizeClass}`}>
      {status}
    </span>
  );
}