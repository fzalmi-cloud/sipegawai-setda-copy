import React from 'react';
import { HelpCircle, FileText, Clock, Phone, Mail, MapPin } from 'lucide-react';

const faqs = [
  { q: 'Bagaimana cara mengajukan layanan kepegawaian?', a: 'Klik menu "Ajukan Layanan" di sidebar, lalu ikuti langkah: pilih pegawai → pilih jenis layanan → unggah dokumen → kirim permohonan. Sistem akan membuat nomor tiket otomatis.' },
  { q: 'Berapa lama proses layanan?', a: 'Setiap layanan memiliki SLA (Service Level Agreement) yang berbeda. Cuti: 1-3 hari kerja, Surat Keterangan: 1-2 hari kerja, KGB: 3-5 hari kerja, Naik Pangkat: 5-10 hari kerja, Pensiun: 10-20 hari kerja. Estimasi waktu ditampilkan pada setiap layanan.' },
  { q: 'Apa yang harus saya lakukan jika dokumen dikembalikan untuk perbaikan?', a: 'Anda akan menerima notifikasi dengan catatan kekurangan. Buka tiket Anda, lihat catatan perbaikan pada tab Checklist, unggah dokumen yang diperbaiki, dan petugas akan memverifikasi ulang.' },
  { q: 'Bagaimana saya memantau status permohonan?', a: 'Buka menu "Tiket Layanan" untuk melihat semua permohonan Anda. Klik tiket untuk melihat detail, riwayat status, dan dokumen.' },
  { q: 'Di mana saya bisa melihat persyaratan setiap layanan?', a: 'Buka menu "Portal Layanan" untuk melihat daftar lengkap layanan beserta persyaratan, estimasi waktu, dan dasar hukum.' },
  { q: 'Apakah data saya aman?', a: 'Ya. Aplikasi menggunakan login wajib dan role-based access control. Pegawai hanya bisa melihat data sendiri, operator biro hanya data bironya. Semua aktivitas tercatat dalam audit trail.' },
  { q: 'Dasar hukum apa yang digunakan?', a: 'Layanan cuti ASN mengacu pada PP 11/2017 jo. PP 17/2020 dan Peraturan BKN 24/2017 jo. Peraturan BKN 7/2021. Detail dasar hukum tersedia pada setiap jenis layanan dan dapat dilihat di menu Pengaturan.' },
];

export default function Bantuan() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Bantuan & FAQ</h1>
        <p className="text-muted-foreground mt-1">Pertanyaan yang sering diajukan dan informasi kontak</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <Phone className="w-5 h-5 text-primary mb-2" />
          <p className="font-semibold text-sm">Telepon</p>
          <p className="text-xs text-muted-foreground mt-1">(0751) 000-0000</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <Mail className="w-5 h-5 text-primary mb-2" />
          <p className="font-semibold text-sm">Email</p>
          <p className="text-xs text-muted-foreground mt-1">kepegawaian@setda.sumbarprov.go.id</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <MapPin className="w-5 h-5 text-primary mb-2" />
          <p className="font-semibold text-sm">Alamat</p>
          <p className="text-xs text-muted-foreground mt-1">Biro Administrasi Pimpinan Sekretariat Daerah Provinsi Sumatera Barat</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {faqs.map((faq, i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{faq.q}</p>
                <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}