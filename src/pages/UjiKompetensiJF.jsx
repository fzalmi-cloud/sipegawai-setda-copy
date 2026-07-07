import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Award, ChevronRight, ChevronDown, BookOpen, Paperclip, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const PERSYARATAN = [
  {
    judul: 'A. Uji Kompetensi (Pengangkatan)',
    items: [
      'Perangkat Daerah mengusulkan permohonan Uji Kompetensi JF kepada Kepala BKD Provinsi Sumatera Barat untuk selanjutnya diusulkan kepada Instansi Pembina.',
      'Usulan hanya dapat diproses apabila formasi tersedia dan calon memiliki kinerja serta potensi sesuai kebutuhan jabatan.',
      'Kepala Perangkat Daerah/Biro melakukan seleksi internal berdasarkan nilai pemetaan, nilai kinerja, masa kerja, pangkat/golongan, usia dan pengalaman.',
      'Seleksi internal dilakukan oleh Tim Penilai Kinerja Internal yang terdiri atas Pejabat Pimpinan Tinggi Pratama dan Pejabat Administrator.',
    ],
  },
  {
    judul: 'B. Persyaratan Pengangkatan Pertama dalam JF',
    items: [
      'Berstatus PNS.',
      'Memiliki integritas dan moralitas yang baik.',
      'Sehat jasmani dan rohani.',
      'Berijazah paling rendah: (a) Sarjana/Diploma IV sesuai kualifikasi untuk JF Keahlian; (b) SLTA/sederajat untuk JF Keterampilan.',
      'Memiliki nilai Predikat Kinerja paling rendah Baik dalam 1 (satu) tahun terakhir.',
      'Memenuhi persyaratan lainnya yang ditetapkan oleh Menteri.',
    ],
  },
  {
    judul: 'C. Persyaratan Perpindahan dari Jabatan Lain',
    items: [
      'Berstatus PNS.',
      'Memiliki integritas dan moralitas yang baik.',
      'Sehat jasmani dan rohani.',
      'Berijazah sesuai kualifikasi JF Keahlian/Keterampilan.',
      'Mengikuti dan lulus Uji Kompetensi sesuai standar kompetensi Instansi Pembina.',
      'Memiliki pengalaman di bidang JF yang akan diduduki paling singkat 2 (dua) tahun.',
      'Nilai Predikat Kinerja paling rendah Baik dalam 2 (dua) tahun terakhir.',
      'Usia paling tinggi: 53 thn (JF Ahli Pertama/Muda/Keterampilan); 55 thn (JF Ahli Madya); 60 thn (JF Ahli Utama bagi JPT).',
      'Tersedia formasi/kebutuhan jabatan yang ditetapkan oleh Gubernur.',
      'Mendapatkan rekomendasi dari Tim Penilai Kinerja Provinsi Sumatera Barat.',
    ],
  },
  {
    judul: 'D. Persyaratan Promosi (Kenaikan Jenjang)',
    items: [
      'Memenuhi Angka Kredit Kumulatif kenaikan jenjang jabatan.',
      'Mengikuti dan lulus Uji Kompetensi kenaikan jenjang jabatan.',
      'Memiliki Predikat Kinerja paling rendah Baik dalam 1 (satu) tahun terakhir.',
      'Promosi dilakukan setelah mendapatkan rekomendasi dari Tim Penilai Kinerja Provinsi Sumatera Barat.',
      'Khusus promosi ke atau dari JF: Predikat Kinerja paling rendah Sangat Baik dalam 2 (dua) tahun terakhir.',
      'Tidak sedang menjalani proses hukuman disiplin PNS.',
      'Tidak pernah dikenakan hukuman disiplin tingkat sedang/berat dalam kurun waktu 3 (tiga) tahun terakhir.',
    ],
  },
];

const LAMPIRAN = [
  {
    judul: 'Lampiran Wajib (Semua Jenis Pengangkatan)',
    warna: 'blue',
    items: [
      'Salinan SK CPNS',
      'Salinan Ijazah',
      'Salinan SK Kenaikan Pangkat Terakhir',
      'Salinan Dokumen Evaluasi Kinerja 2 (dua) tahun terakhir (predikat paling rendah Baik; khusus Pelaksana ke JF Ahli Muda: Sangat Baik)',
      'Bezzeting ketersediaan formasi JF ditandatangani Pejabat Pimpinan Tinggi Pratama (Kepala Biro/Perangkat Daerah)',
    ],
  },
  {
    judul: 'Lampiran Khusus Perpindahan dari Jabatan Lain & Penyesuaian',
    warna: 'amber',
    items: [
      'Surat pengalaman pelaksanaan tugas di bidang JF paling singkat 2 (dua) tahun, ditandatangani Pejabat Eselon II',
      'Salinan Persetujuan Kebutuhan JF sesuai ketentuan peraturan perundang-undangan',
    ],
  },
  {
    judul: 'Lampiran Khusus JF Keahlian (Semua Jenjang)',
    warna: 'purple',
    items: [
      'Hasil pemetaan potensi: nilai min. 62 untuk JF Keahlian Pertama/Muda; min. 70 untuk Keahlian Madya/Utama',
      'Makalah inovasi relevan dengan pelaksanaan tugas JF (unit kerja terkecil untuk Keahlian Muda; Perangkat Daerah untuk Keahlian Madya; instansi untuk Keahlian Utama)',
      'Berita Acara hasil verifikasi dan penelaahan Tim Penilai Kinerja Internal',
    ],
  },
  {
    judul: 'Lampiran Khusus JF Ahli Madya dan Ahli Utama',
    warna: 'red',
    items: [
      'Surat Pernyataan Kepala Perangkat Daerah/Kepala Biro/Direktur RS Daerah yang menyatakan kebutuhan JF dan bahwa PNS yang diusulkan memiliki kompetensi dan kinerja yang baik (format terlampir pada SE Gubernur)',
      'Perjanjian Kerja antara PNS yang diusulkan dengan atasan langsung (format terlampir pada SE Gubernur)',
    ],
  },
];

const warnaMap = {
  blue: { card: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  amber: { card: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  purple: { card: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  red: { card: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

function AccordionSection({ judul, children, icon: Icon, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-primary flex-shrink-0" />}
          <span className="font-semibold text-sm">{judul}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function UjiKompetensiJF() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pegawai');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Employee.filter({ jenis_jabatan: 'Fungsional', status_pegawai: 'Aktif' }, 'nama_lengkap', 500);
        setEmployees(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  const tabs = [
    { id: 'pegawai', label: 'Daftar Pegawai JF' },
    { id: 'persyaratan', label: 'Persyaratan' },
    { id: 'lampiran', label: 'Dokumen Lampiran' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Uji Kompetensi Jabatan Fungsional</h1>
          <p className="text-muted-foreground mt-1">Berdasarkan SE Gubernur Sumbar No. 08 Tahun 2026</p>
        </div>
        <a
          href="https://media.base44.com/files/public/6a4cf45d09845365e2875d72/dcbb5a176_SEJFTTDGub.pdf"
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-2 rounded-lg font-medium hover:bg-primary/20"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Lihat SE Gubernur
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Daftar Pegawai */}
      {activeTab === 'pegawai' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{employees.length} pegawai jabatan fungsional aktif</p>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Tidak ada pegawai jabatan fungsional</p>
            </div>
          ) : (
            employees.map(e => (
              <div key={e.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{e.nama_lengkap?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{e.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{e.nip} · {e.jabatan} · {e.pangkat_golongan}</p>
                      {e.tmt_jabatan && <p className="text-xs text-muted-foreground mt-1">TMT Jabatan: {e.tmt_jabatan}</p>}
                    </div>
                  </div>
                  <Link to="/ajukan" className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20">Usulkan</Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Persyaratan */}
      {activeTab === 'persyaratan' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Dasar Hukum</p>
            <p className="text-xs leading-relaxed">Surat Edaran Gubernur Sumatera Barat Nomor 08 Tahun 2026 tentang Pedoman Pengusulan Pengangkatan PNS ke Dalam Jabatan Fungsional di Lingkungan Pemerintah Provinsi Sumatera Barat.</p>
          </div>
          {PERSYARATAN.map((section, i) => (
            <AccordionSection key={i} judul={section.judul} icon={BookOpen} defaultOpen={i === 0}>
              <ul className="space-y-2 mt-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-foreground/80 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </AccordionSection>
          ))}
        </div>
      )}

      {/* Tab: Dokumen Lampiran */}
      {activeTab === 'lampiran' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Catatan Penting</p>
            <p className="text-xs leading-relaxed">Usulan PNS untuk mengikuti Uji Kompetensi JF yang telah memperoleh rekomendasi Tim Penilai Kinerja Internal diteruskan kepada Kepala BKD Provinsi Sumatera Barat dengan melampirkan dokumen berikut ini.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {LAMPIRAN.map((section, i) => {
              const style = warnaMap[section.warna];
              return (
                <div key={i} className={`rounded-xl border p-4 ${style.card}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 flex-shrink-0 opacity-70" />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{section.judul}</span>
                  </div>
                  <ul className="space-y-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Format Dokumen Tambahan (Lampiran SE Gubernur)</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" /> Format Makalah Inovasi (Lampiran A SE Gubernur)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" /> Format Keputusan Tim Penilai Kinerja Internal (Lampiran B SE Gubernur)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" /> Format Berita Acara Tim Penilai Kinerja Internal (Lampiran C SE Gubernur)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" /> Format Surat Pernyataan & Perjanjian Kinerja Calon JF Madya/Utama (Lampiran D SE Gubernur)</li>
            </ul>
            <a href="https://media.base44.com/files/public/6a4cf45d09845365e2875d72/dcbb5a176_SEJFTTDGub.pdf"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline font-medium">
              <ExternalLink className="w-3.5 h-3.5" /> Unduh SE Gubernur (format lengkap)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}