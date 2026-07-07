import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { FilePlus, Search, Clock, ChevronRight, Info, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function PortalLayanan() {
  const [services, setServices] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [svcData, reqData] = await Promise.all([
          base44.entities.Service.filter({ aktif: true }, 'urutan', 100),
          base44.entities.ServiceRequirement.filter({ aktif: true }, 'urutan', 500)
        ]);
        setServices(svcData);
        const reqMap = {};
        reqData.forEach(r => {
          if (!reqMap[r.service_id]) reqMap[r.service_id] = [];
          reqMap[r.service_id].push(r);
        });
        setRequirements(reqMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kategoriList = ['all', 'Pensiun', 'Kenaikan Pangkat', 'Jabatan Fungsional', 'Pelantikan', 'Cuti', 'Mutasi', 'Data Kepegawaian', 'Surat Keterangan', 'KGB', 'Disiplin', 'Pengembangan Kompetensi', 'Lainnya'];

  const filtered = services.filter(s => {
    const matchSearch = s.nama_layanan?.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === 'all' || s.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 lg:p-8 text-primary-foreground">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Portal Layanan Kepegawaian</h1>
        <p className="text-primary-foreground/80 mt-2 max-w-2xl">
          Seluruh layanan kepegawaian internal Sekretariat Daerah Provinsi Sumatera Barat.
          Lihat persyaratan, estimasi waktu, dan ajukan permohonan secara online.
        </p>
        <Link
          to="/ajukan"
          className="inline-flex items-center gap-2 mt-4 bg-accent text-accent-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <FilePlus className="w-4 h-4" /> Ajukan Layanan
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari layanan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterKategori}
          onChange={e => setFilterKategori(e.target.value)}
          className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
        >
          {kategoriList.map(k => (
            <option key={k} value={k}>{k === 'all' ? 'Semua Kategori' : k}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Tidak ada layanan ditemukan</p>
          </div>
        ) : (
          filtered.map(svc => {
            const reqs = requirements[svc.id] || [];
            const wajibCount = reqs.filter(r => r.wajib).length;
            return (
              <div key={svc.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <Accordion type="single" collapsible>
                  <AccordionItem value={svc.id} className="border-0">
                    <AccordionTrigger className="px-5 py-4 hover:bg-muted/50 no-underline">
                      <div className="flex items-start gap-4 text-left flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{svc.nama_layanan}</p>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{svc.kategori}</span>
                          </div>
                          {svc.deskripsi && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{svc.deskripsi}</p>}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {svc.estimasi_waktu || `${svc.sla_hari || 3} hari kerja`}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Info className="w-3 h-3" /> {wajibCount} persyaratan wajib
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="border-t border-border pt-3 mt-1 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Persyaratan</p>
                        {reqs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Belum ada checklist persyaratan untuk layanan ini.</p>
                        ) : (
                          reqs.map((r, i) => (
                            <div key={r.id} className="flex items-start gap-2 py-1.5">
                              <span className="text-xs font-bold text-primary mt-0.5">{i + 1}.</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{r.nama_item}</p>
                                  {r.wajib ? (
                                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Wajib</span>
                                  ) : (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Opsional</span>
                                  )}
                                </div>
                                {r.keterangan && <p className="text-xs text-muted-foreground mt-0.5">{r.keterangan}</p>}
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] text-muted-foreground">Format: {r.format_diterima}</span>
                                  <span className="text-[10px] text-muted-foreground">Max: {r.max_ukuran_mb}MB</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {svc.dasar_hukum && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-semibold text-muted-foreground">Dasar Hukum</p>
                            <p className="text-xs mt-1">{svc.dasar_hukum}</p>
                          </div>
                        )}
                        <Link
                          to={`/ajukan?service_id=${svc.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-2"
                        >
                          Ajukan layanan ini <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}