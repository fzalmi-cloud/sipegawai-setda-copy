import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Check, ChevronRight, ChevronLeft, User, FileText, Send, AlertCircle, CheckCircle2, X, FolderArchive, ExternalLink } from 'lucide-react';

const findMatchingArchive = (req, archives) => {
  const namaItem = (req.nama_item || '').toLowerCase().trim();
  if (!namaItem || archives.length === 0) return null;
  const sorted = [...archives].sort((a, b) => {
    if (a.status_validasi === 'Terverifikasi' && b.status_validasi !== 'Terverifikasi') return -1;
    if (b.status_validasi === 'Terverifikasi' && a.status_validasi !== 'Terverifikasi') return 1;
    return new Date(b.tanggal_unggah || 0) - new Date(a.tanggal_unggah || 0);
  });
  return sorted.find(a => {
    const jenis = (a.jenis_dokumen || '').toLowerCase();
    const namaDoc = (a.nama_dokumen || '').toLowerCase();
    if (!jenis) return false;
    return namaItem.includes(jenis) || (namaDoc.length > 3 && namaItem.includes(namaDoc));
  });
};

export default function AjukanLayanan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetServiceId = searchParams.get('service_id');

  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedSvc, setSelectedSvc] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [empArchives, setEmpArchives] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        let empFilter = {};
        if (user?.role === 'operator_biro' && user?.unit_id) {
          empFilter = { unit_id: user.unit_id, status_pegawai: 'Aktif' };
        } else if (user?.role === 'pegawai') {
          empFilter = { email: user.email };
        }
        const [empData, svcData, reqData] = await Promise.all([
          base44.entities.Employee.filter(empFilter, 'nama_lengkap', 500),
          base44.entities.Service.filter({ aktif: true }, 'urutan', 200),
          base44.entities.ServiceRequirement.filter({ aktif: true }, 'urutan', 500)
        ]);
        setEmployees(empData);
        setServices(svcData);
        const reqMap = {};
        reqData.forEach(r => {
          if (!reqMap[r.service_id]) reqMap[r.service_id] = [];
          reqMap[r.service_id].push(r);
        });
        setRequirements(reqMap);

        if (presetServiceId) {
          const svc = svcData.find(s => s.id === presetServiceId);
          if (svc) {
            setSelectedSvc(svc);
            setStep(2);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, presetServiceId]);

  const filteredEmployees = employees.filter(e =>
    e.nama_lengkap?.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.nip?.includes(empSearch)
  );

  const currentReqs = selectedSvc ? (requirements[selectedSvc.id] || []) : [];
  const wajibReqs = currentReqs.filter(r => r.wajib);
  const uploadedWajib = wajibReqs.filter(r => uploadedDocs[r.id]).length;
  const persentase = wajibReqs.length > 0 ? Math.round((uploadedWajib / wajibReqs.length) * 100) : 0;

  const kelengkapanLabel = persentase === 100 ? 'Lengkap' : persentase >= 75 ? 'Hampir Lengkap' : persentase >= 50 ? 'Perlu Dilengkapi' : 'Belum Layak Diproses';
  const kelengkapanColor = persentase === 100 ? 'text-green-600' : persentase >= 75 ? 'text-amber-600' : persentase >= 50 ? 'text-orange-600' : 'text-red-600';

  const handleUpload = async (reqId, file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedDocs(prev => ({ ...prev, [reqId]: { file_url, nama_file: file.name, ukuran: file.size } }));
    } catch (e) {
      alert('Gagal mengunggah file: ' + e.message);
    }
  };

  const handleRemoveUpload = (reqId) => {
    setUploadedDocs(prev => {
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });
  };

  const handleUseFromArchive = (reqId, archiveDoc) => {
    setUploadedDocs(prev => ({ ...prev, [reqId]: {
      file_url: archiveDoc.file_url,
      nama_file: archiveDoc.nama_dokumen || archiveDoc.jenis_dokumen,
      ukuran: 0,
      fromArchive: true,
      archiveId: archiveDoc.id,
    }}));
  };

  useEffect(() => {
    if (step !== 3 || !selectedSvc || empArchives.length === 0) return;
    const reqs = requirements[selectedSvc.id] || [];
    setUploadedDocs(prev => {
      const updated = { ...prev };
      reqs.forEach(req => {
        if (updated[req.id]) return;
        const match = findMatchingArchive(req, empArchives);
        if (match) {
          updated[req.id] = {
            file_url: match.file_url,
            nama_file: match.nama_dokumen || match.jenis_dokumen,
            ukuran: 0,
            fromArchive: true,
            archiveId: match.id,
          };
        }
      });
      return updated;
    });
  }, [step, selectedSvc, empArchives]);

  const handleSubmit = async () => {
    if (!selectedEmp || !selectedSvc) return;
    setSubmitting(true);
    try {
      const year = new Date().getFullYear();
      const existing = await base44.entities.ServiceTicket.filter({}, '-created_date', 1);
      const count = existing.length + 1;
      const nomorTiket = `PEG-SETDA-${year}-${String(count).padStart(4, '0')}`;

      const slaDays = selectedSvc.sla_hari || 3;
      const batasWaktu = new Date();
      batasWaktu.setDate(batasWaktu.getDate() + slaDays);

      const ticket = await base44.entities.ServiceTicket.create({
        nomor_tiket: nomorTiket,
        employee_id: selectedEmp.id,
        nama_pegawai: selectedEmp.nama_lengkap,
        nip_pegawai: selectedEmp.nip,
        unit_id: selectedEmp.unit_id,
        nama_unit: selectedEmp.nama_unit,
        service_id: selectedSvc.id,
        nama_layanan: selectedSvc.nama_layanan,
        kategori_layanan: selectedSvc.kategori,
        status: 'Dikirim Pemohon',
        diajukan_oleh: user.id,
        nama_pengaju: user.full_name,
        role_pengaju: user.role,
        tanggal_pengajuan: new Date().toISOString(),
        batas_waktu_sla: batasWaktu.toISOString(),
        persentase_kelengkapan: persentase,
      });

      // Create checklist items
      const checklistItems = currentReqs.map(r => ({
        ticket_id: ticket.id,
        nomor_tiket: nomorTiket,
        requirement_id: r.id,
        nama_item: r.nama_item,
        wajib: r.wajib,
        status: uploadedDocs[r.id] ? 'Sudah Diunggah' : 'Belum Diunggah',
      }));
      if (checklistItems.length > 0) {
        await base44.entities.TicketChecklist.bulkCreate(checklistItems);
      }

      // Upload documents
      const docPromises = Object.entries(uploadedDocs).map(([reqId, doc]) => {
        const req = currentReqs.find(r => r.id === reqId);
        return base44.entities.TicketDocument.create({
          ticket_id: ticket.id,
          nomor_tiket: nomorTiket,
          requirement_id: reqId,
          nama_item: req?.nama_item || '',
          file_url: doc.file_url,
          nama_file: doc.nama_file,
          ukuran_file: doc.ukuran,
          diunggah_oleh: user.id,
          nama_pengunggah: user.full_name,
          tanggal_unggah: new Date().toISOString(),
          status_validasi: 'Belum Diverifikasi',
        });
      });
      await Promise.all(docPromises);

      // Status history
      await base44.entities.TicketStatusHistory.create({
        ticket_id: ticket.id,
        nomor_tiket: nomorTiket,
        status_sebelum: 'Draft',
        status_sesudah: 'Dikirim Pemohon',
        diubah_oleh: user.id,
        nama_pengubah: user.full_name,
        role_pengubah: user.role,
        catatan: 'Permohonan dikirim oleh pemohon',
        tanggal: new Date().toISOString(),
      });

      // Notify kepegawaian staff
      try {
        const staff = await base44.entities.User.filter({ role: { $in: ['admin_kepegawaian', 'super_admin'] } }, '-created_date', 20);
        const notifs = staff.map(s => ({
          user_id: s.id,
          ticket_id: ticket.id,
          nomor_tiket: nomorTiket,
          judul: 'Permohonan Baru Masuk',
          pesan: `${nomorTiket} — ${selectedSvc.nama_layanan} (${selectedEmp.nama_lengkap})`,
          tipe: 'Tiket Baru',
          dibaca: false,
          tanggal: new Date().toISOString(),
        }));
        if (notifs.length > 0) {
          await base44.entities.Notification.bulkCreate(notifs);
        }
      } catch (e) {
        // non-critical
      }

      navigate(`/tiket/${ticket.id}`);
    } catch (e) {
      alert('Gagal mengirim permohonan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Pilih Pegawai', icon: User },
    { num: 2, label: 'Pilih Layanan', icon: FileText },
    { num: 3, label: 'Unggah Dokumen', icon: Upload },
    { num: 4, label: 'Konfirmasi', icon: Send },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Ajukan Layanan Kepegawaian</h1>
        <p className="text-muted-foreground mt-1">Lengkapi langkah berikut untuk mengajukan permohonan layanan</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
        {/* Step 1: Pilih Pegawai */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Pilih Pegawai Pemohon</h2>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'pegawai' ? 'Data diri Anda' : 'Cari dan pilih pegawai yang mengajukan layanan'}
            </p>
            {user?.role !== 'pegawai' && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama atau NIP..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary"
                />
              </div>
            )}
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {filteredEmployees.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Tidak ada pegawai ditemukan</p>
              ) : (
                filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={async () => {
                      setSelectedEmp(emp);
                      setUploadedDocs({});
                      setEmpArchives([]);
                      try {
                        const archData = await base44.entities.DocumentArchive.filter({ employee_id: emp.id }, '-tanggal_unggah', 200);
                        setEmpArchives(archData);
                      } catch(e) { console.error(e); }
                      setStep(2);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary ${
                      selectedEmp?.id === emp.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {emp.nama_lengkap?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.nip} · {emp.jabatan} · {emp.nama_unit}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Pilih Layanan */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Pilih Jenis Layanan</h2>
            <div className="p-3 bg-primary/5 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {selectedEmp?.nama_lengkap?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{selectedEmp?.nama_lengkap}</p>
                <p className="text-xs text-muted-foreground">{selectedEmp?.nip} · {selectedEmp?.nama_unit}</p>
              </div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedSvc(svc); setStep(3); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary ${
                    selectedSvc?.id === svc.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{svc.nama_layanan}</p>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{svc.kategori}</span>
                      </div>
                      {svc.deskripsi && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{svc.deskripsi}</p>}
                      <p className="text-xs text-muted-foreground mt-1">Estimasi: {svc.estimasi_waktu || `${svc.sla_hari || 3} hari kerja`}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
          </div>
        )}

        {/* Step 3: Unggah Dokumen */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Unggah Dokumen Persyaratan</h2>
            {empArchives.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FolderArchive className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">Dokumen yang sudah tersedia di arsip pegawai akan otomatis ditautkan. Anda tetap dapat mengunggah file baru jika diperlukan.</p>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{selectedSvc?.nama_layanan}</p>
                <p className="text-xs text-muted-foreground">{selectedEmp?.nama_lengkap} · {selectedEmp?.nip}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${kelengkapanColor}`}>{persentase}%</p>
                <p className={`text-xs font-medium ${kelengkapanColor}`}>{kelengkapanLabel}</p>
              </div>
            </div>
            <div className="space-y-3">
              {currentReqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada checklist persyaratan untuk layanan ini.</p>
                  <p className="text-xs">Anda dapat langsung melanjutkan ke konfirmasi.</p>
                </div>
              ) : (
                currentReqs.map((req, i) => {
                  const uploaded = uploadedDocs[req.id];
                  return (
                    <div key={req.id} className={`p-4 rounded-lg border ${uploaded ? 'border-green-300 bg-green-50/50' : 'border-border'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-primary mt-1">{i + 1}.</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{req.nama_item}</p>
                            {req.wajib ? (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Wajib</span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Opsional</span>
                            )}
                          </div>
                          {req.keterangan && <p className="text-xs text-muted-foreground mt-1">{req.keterangan}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">Format: {req.format_diterima} · Max: {req.max_ukuran_mb}MB</p>
                          {uploaded ? (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              {uploaded.fromArchive && <FolderArchive className="w-3.5 h-3.5 text-blue-500" />}
                              <span className="text-xs text-green-700 font-medium truncate max-w-[200px]">{uploaded.nama_file}</span>
                              {uploaded.fromArchive && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Dari Arsip</span>
                              )}
                              {uploaded.fromArchive && (
                                <a href={uploaded.file_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700" title="Lihat dokumen arsip">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button onClick={() => handleRemoveUpload(req.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            (() => {
                              const match = findMatchingArchive(req, empArchives);
                              return match ? (
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <button onClick={() => handleUseFromArchive(req.id, match)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                                    <FolderArchive className="w-3.5 h-3.5" /> Gunakan dari Arsip
                                  </button>
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{match.nama_dokumen || match.jenis_dokumen}</span>
                                  <span className="text-xs text-muted-foreground">atau</span>
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                                    <Upload className="w-3.5 h-3.5" /> Upload Baru
                                    <input type="file" className="hidden" accept={`.${(req.format_diterima || 'pdf').toLowerCase()}`} onChange={e => handleUpload(req.id, e.target.files[0])} />
                                  </label>
                                </div>
                              ) : (
                                <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                                  <Upload className="w-3.5 h-3.5" /> Pilih File
                                  <input type="file" className="hidden" accept={`.${(req.format_diterima || 'pdf').toLowerCase()}`} onChange={e => handleUpload(req.id, e.target.files[0])} />
                                </label>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Lanjut <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Konfirmasi */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Konfirmasi Permohonan</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Pegawai</p>
                <p className="font-medium">{selectedEmp?.nama_lengkap}</p>
                <p className="text-sm text-muted-foreground">{selectedEmp?.nip} · {selectedEmp?.nama_unit} · {selectedEmp?.jabatan}</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Jenis Layanan</p>
                <p className="font-medium">{selectedSvc?.nama_layanan}</p>
                <p className="text-sm text-muted-foreground">{selectedSvc?.kategori} · Estimasi: {selectedSvc?.estimasi_waktu || `${selectedSvc?.sla_hari || 3} hari kerja`}</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Kelengkapan Berkas</p>
                  <span className={`text-sm font-bold ${kelengkapanColor}`}>{persentase}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${persentase === 100 ? 'bg-green-500' : persentase >= 75 ? 'bg-amber-500' : persentase >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${persentase}%` }} />
                </div>
                <p className={`text-xs mt-1 ${kelengkapanColor}`}>{kelengkapanLabel}</p>
                <p className="text-xs text-muted-foreground mt-2">{uploadedWajib} dari {wajibReqs.length} dokumen wajib terunggah</p>
              </div>
              {persentase < 100 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Beberapa dokumen wajib belum diunggah. Permohonan masih dapat dikirim, namun petugas dapat meminta pelengkapan dokumen.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(3)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</>
                ) : (
                  <><Send className="w-4 h-4" /> Kirim Permohonan</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}