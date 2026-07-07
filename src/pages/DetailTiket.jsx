import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import {
  ArrowLeft, User, FileText, Upload, Clock, CheckCircle2, XCircle,
  AlertCircle, MessageSquare, History, Send, Download, Settings,
  AlertTriangle, ChevronRight, FileCheck
} from 'lucide-react';
import moment from 'moment';

const statusFlow = [
  'Draft', 'Dikirim Pemohon', 'Diterima Operator Biro', 'Diteruskan ke Kepegawaian Setda',
  'Verifikasi Awal', 'Perlu Perbaikan', 'Perbaikan Dikirim', 'Verifikasi Lanjutan',
  'Menunggu Persetujuan Pimpinan', 'Disetujui Pimpinan', 'Siap Diteruskan ke BKD/BKN',
  'Dalam Proses Eksternal', 'Hasil Diterima', 'Selesai', 'Ditolak', 'Dibatalkan'
];

export default function DetailTiket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checklist');
  const [newStatus, setNewStatus] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [resultFile, setResultFile] = useState(null);

  const isPetugas = ['super_admin', 'admin_kepegawaian', 'bendahara'].includes(user?.role);
  const isPimpinan = user?.role === 'pimpinan';

  useEffect(() => {
    const load = async () => {
      try {
        const [t, cl, docs, hist, coms] = await Promise.all([
          base44.entities.ServiceTicket.get(id),
          base44.entities.TicketChecklist.filter({ ticket_id: id }, 'urutan', 100),
          base44.entities.TicketDocument.filter({ ticket_id: id }, '-tanggal_unggah', 100),
          base44.entities.TicketStatusHistory.filter({ ticket_id: id }, 'tanggal', 100),
          base44.entities.TicketComment.filter({ ticket_id: id }, 'tanggal', 100),
        ]);
        setTicket(t);
        setChecklist(cl);
        setDocuments(docs);
        setHistory(hist);
        setComments(coms);
        setNewStatus(t.status);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUploadDoc = async (requirementId, file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const req = checklist.find(c => c.requirement_id === requirementId);
      const newDoc = await base44.entities.TicketDocument.create({
        ticket_id: id,
        nomor_tiket: ticket.nomor_tiket,
        requirement_id: requirementId,
        nama_item: req?.nama_item || '',
        file_url,
        nama_file: file.name,
        ukuran_file: file.size,
        diunggah_oleh: user.id,
        nama_pengunggah: user.full_name,
        tanggal_unggah: new Date().toISOString(),
        status_validasi: 'Belum Diverifikasi',
      });
      setDocuments(prev => [...prev, newDoc]);

      // Update checklist status
      if (req) {
        await base44.entities.TicketChecklist.update(req.id, { status: 'Sudah Diunggah', document_id: newDoc.id });
        setChecklist(prev => prev.map(c => c.requirement_id === requirementId ? { ...c, status: 'Sudah Diunggah', document_id: newDoc.id } : c));
      }

      // Recalculate percentage
      const reqs = await base44.entities.ServiceRequirement.filter({ service_id: ticket.service_id, aktif: true }, 'urutan', 100);
      const wajibIds = reqs.filter(r => r.wajib).map(r => r.id);
      const allDocs = await base44.entities.TicketDocument.filter({ ticket_id: id }, '-tanggal_unggah', 100);
      const uploadedWajib = wajibIds.filter(wid => allDocs.some(d => d.requirement_id === wid)).length;
      const pct = wajibIds.length > 0 ? Math.round((uploadedWajib / wajibIds.length) * 100) : 0;
      await base44.entities.ServiceTicket.update(id, { persentase_kelengkapan: pct });
      setTicket(prev => ({ ...prev, persentase_kelengkapan: pct }));
    } catch (e) {
      alert('Gagal mengunggah: ' + e.message);
    }
  };

  const handleVerifyChecklist = async (checklistId, status, catatan) => {
    try {
      await base44.entities.TicketChecklist.update(checklistId, {
        status,
        catatan_verifikator: catatan,
        diverifikasi_oleh: user.id,
        tanggal_verifikasi: new Date().toISOString(),
      });
      setChecklist(prev => prev.map(c => c.id === checklistId ? { ...c, status, catatan_verifikator: catatan, diverifikasi_oleh: user.id } : c));
    } catch (e) {
      alert('Gagal memperbarui: ' + e.message);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === ticket.status) {
      setShowStatusModal(false);
      return;
    }
    try {
      const updates = { status: newStatus };
      if (newStatus === 'Selesai') {
        updates.tanggal_selesai = new Date().toISOString();
      }
      await base44.entities.ServiceTicket.update(id, updates);

      await base44.entities.TicketStatusHistory.create({
        ticket_id: id,
        nomor_tiket: ticket.nomor_tiket,
        status_sebelum: ticket.status,
        status_sesudah: newStatus,
        diubah_oleh: user.id,
        nama_pengubah: user.full_name,
        role_pengubah: user.role,
        catatan: newComment || `Status diubah ke ${newStatus}`,
        tanggal: new Date().toISOString(),
      });

      if (newComment) {
        await base44.entities.TicketComment.create({
          ticket_id: id,
          nomor_tiket: ticket.nomor_tiket,
          user_id: user.id,
          nama_user: user.full_name,
          role_user: user.role,
          komentar: newComment,
          tipe: 'Disposisi',
          tanggal: new Date().toISOString(),
        });
        setComments(prev => [...prev, {
          ticket_id: id, nomor_tiket: ticket.nomor_tiket, user_id: user.id,
          nama_user: user.full_name, role_user: user.role, komentar: newComment,
          tipe: 'Disposisi', tanggal: new Date().toISOString()
        }]);
      }

      // Notify applicant
      try {
        await base44.entities.Notification.create({
          user_id: ticket.diajukan_oleh,
          ticket_id: id,
          nomor_tiket: ticket.nomor_tiket,
          judul: 'Status Tiket Diperbarui',
          pesan: `${ticket.nomor_tiket} — Status sekarang: ${newStatus}`,
          tipe: newStatus === 'Perlu Perbaikan' ? 'Perlu Perbaikan' : newStatus === 'Selesai' ? 'Hasil Tersedia' : 'Umum',
          dibaca: false,
          tanggal: new Date().toISOString(),
        });
      } catch (e) {}

      setTicket(prev => ({ ...prev, status: newStatus }));
      setHistory(prev => [...prev, {
        status_sebelum: ticket.status, status_sesudah: newStatus,
        nama_pengubah: user.full_name, role_pengubah: user.role,
        catatan: newComment || `Status diubah ke ${newStatus}`, tanggal: new Date().toISOString()
      }]);
      setNewComment('');
      setShowStatusModal(false);
    } catch (e) {
      alert('Gagal mengubah status: ' + e.message);
    }
  };

  const handleUploadResult = async () => {
    if (!resultFile) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: resultFile });
      await base44.entities.TicketDocument.create({
        ticket_id: id,
        nomor_tiket: ticket.nomor_tiket,
        nama_item: 'Dokumen Hasil Layanan',
        file_url,
        nama_file: resultFile.name,
        ukuran_file: resultFile.size,
        diunggah_oleh: user.id,
        nama_pengunggah: user.full_name,
        tanggal_unggah: new Date().toISOString(),
        status_validasi: 'Sesuai',
      });

      // Also save to employee's document archive
      await base44.entities.DocumentArchive.create({
        employee_id: ticket.employee_id,
        nama_pegawai: ticket.nama_pegawai,
        nip_pegawai: ticket.nip_pegawai,
        nama_dokumen: `Hasil ${ticket.nama_layanan}`,
        jenis_dokumen: 'Dokumen Layanan Lainnya',
        tanggal_unggah: new Date().toISOString(),
        file_url,
        diunggah_oleh: user.id,
        nama_pengunggah: user.full_name,
        status_validasi: 'Terverifikasi',
        ticket_id: id,
      });

      await base44.entities.ServiceTicket.update(id, { status: 'Selesai', tanggal_selesai: new Date().toISOString() });
      await base44.entities.TicketStatusHistory.create({
        ticket_id: id, nomor_tiket: ticket.nomor_tiket,
        status_sebelum: ticket.status, status_sesudah: 'Selesai',
        diubah_oleh: user.id, nama_pengubah: user.full_name, role_pengubah: user.role,
        catatan: 'Dokumen hasil diunggah, layanan selesai',
        tanggal: new Date().toISOString(),
      });

      try {
        await base44.entities.Notification.create({
          user_id: ticket.diajukan_oleh, ticket_id: id, nomor_tiket: ticket.nomor_tiket,
          judul: 'Hasil Layanan Tersedia',
          pesan: `${ticket.nomor_tiket} — Hasil ${ticket.nama_layanan} telah tersedia untuk diunduh.`,
          tipe: 'Hasil Tersedia', dibaca: false, tanggal: new Date().toISOString(),
        });
      } catch (e) {}

      setResultFile(null);
      setTicket(prev => ({ ...prev, status: 'Selesai', tanggal_selesai: new Date().toISOString() }));
      setDocuments(prev => [...prev, {
        ticket_id: id, nomor_tiket: ticket.nomor_tiket, nama_item: 'Dokumen Hasil Layanan',
        file_url, nama_file: resultFile.name, tanggal_unggah: new Date().toISOString(), status_validasi: 'Sesuai'
      }]);
    } catch (e) {
      alert('Gagal mengunggah hasil: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Tiket tidak ditemukan</p>
        <Link to="/tiket" className="text-primary hover:underline mt-2 inline-block">Kembali ke daftar tiket</Link>
      </div>
    );
  }

  const wajibChecklist = checklist.filter(c => c.wajib);
  const verifiedCount = wajibChecklist.filter(c => c.status === 'Sesuai').length;
  const pct = wajibChecklist.length > 0 ? Math.round((verifiedCount / wajibChecklist.length) * 100) : (ticket.persentase_kelengkapan || 0);

  const tabs = [
    { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
    { id: 'documents', label: 'Dokumen', icon: FileText },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'comments', label: 'Catatan', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl lg:text-2xl font-heading font-bold">{ticket.nomor_tiket}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-lg font-semibold">{ticket.nama_layanan}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {ticket.nama_pegawai} ({ticket.nip_pegawai})</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {ticket.nama_unit}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ticket.tanggal_pengajuan ? moment(ticket.tanggal_pengajuan).format('DD MMM YYYY, HH:mm') : '-'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Kelengkapan Berkas</p>
            <p className={`text-3xl font-bold ${pct === 100 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : pct >= 50 ? 'text-orange-600' : 'text-red-600'}`}>{pct}%</p>
            {ticket.terlambat_sla && ticket.status !== 'Selesai' && ticket.status !== 'Ditolak' && ticket.status !== 'Dibatalkan' && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
                <AlertTriangle className="w-3 h-3" /> Terlambat SLA
              </span>
            )}
            {ticket.batas_waktu_sla && ticket.status !== 'Selesai' && ticket.status !== 'Ditolak' && ticket.status !== 'Dibatalkan' && !ticket.terlambat_sla && (
              <p className="text-xs text-muted-foreground mt-1">Batas: {moment(ticket.batas_waktu_sla).format('DD MMM YYYY')}</p>
            )}
          </div>
        </div>

        {/* Action Bar */}
        {(isPetugas || isPimpinan) && ticket.status !== 'Selesai' && ticket.status !== 'Ditolak' && ticket.status !== 'Dibatalkan' && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap">
            {isPetugas && (
              <>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Ubah Status
                </button>
                {ticket.status === 'Verifikasi Lanjutan' || ticket.status === 'Disetujui Pimpinan' || ticket.status === 'Siap Diteruskan ke BKD/BKN' || ticket.status === 'Dalam Proses Eksternal' || ticket.status === 'Hasil Diterima' ? (
                  <label className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" /> Unggah Hasil & Selesaikan
                    <input type="file" className="hidden" onChange={e => { setResultFile(e.target.files[0]); if (e.target.files[0]) { setTimeout(handleUploadResult, 100); } }} />
                  </label>
                ) : null}
              </>
            )}
            {isPimpinan && ticket.status === 'Menunggu Persetujuan Pimpinan' && (
              <>
                <button
                  onClick={async () => {
                    await base44.entities.ServiceTicket.update(id, { status: 'Disetujui Pimpinan' });
                    await base44.entities.TicketStatusHistory.create({
                      ticket_id: id, nomor_tiket: ticket.nomor_tiket,
                      status_sebelum: ticket.status, status_sesudah: 'Disetujui Pimpinan',
                      diubah_oleh: user.id, nama_pengubah: user.full_name, role_pengubah: user.role,
                      catatan: 'Disetujui oleh pimpinan', tanggal: new Date().toISOString(),
                    });
                    setTicket(prev => ({ ...prev, status: 'Disetujui Pimpinan' }));
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Setujui
                </button>
                <button
                  onClick={async () => {
                    await base44.entities.ServiceTicket.update(id, { status: 'Verifikasi Lanjutan' });
                    await base44.entities.TicketStatusHistory.create({
                      ticket_id: id, nomor_tiket: ticket.nomor_tiket,
                      status_sebelum: ticket.status, status_sesudah: 'Verifikasi Lanjutan',
                      diubah_oleh: user.id, nama_pengubah: user.full_name, role_pengubah: user.role,
                      catatan: 'Dikembalikan oleh pimpinan untuk verifikasi lanjutan', tanggal: new Date().toISOString(),
                    });
                    setTicket(prev => ({ ...prev, status: 'Verifikasi Lanjutan' }));
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Kembalikan
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-xl border border-border">
        {activeTab === 'checklist' && (
          <div className="p-5 space-y-3">
            {checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Tidak ada checklist untuk tiket ini</p>
            ) : (
              checklist.map((c, i) => {
                const doc = documents.find(d => d.requirement_id === c.requirement_id);
                return (
                  <div key={c.id} className={`p-4 rounded-lg border ${c.status === 'Sesuai' ? 'border-green-200 bg-green-50/50' : c.status === 'Belum Sesuai' ? 'border-red-200 bg-red-50/50' : c.status === 'Perlu Klarifikasi' ? 'border-amber-200 bg-amber-50/50' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-primary mt-1">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{c.nama_item}</p>
                          {c.wajib ? (
                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Wajib</span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Opsional</span>
                          )}
                          <StatusBadge status={c.status} size="xs" />
                        </div>
                        {c.catatan_verifikator && <p className="text-xs text-muted-foreground mt-1 italic">Catatan: {c.catatan_verifikator}</p>}
                        {doc && (
                          <div className="flex items-center gap-2 mt-2">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {doc.nama_file}
                            </a>
                          </div>
                        )}
                        {/* Upload for applicant */}
                        {!isPetugas && !isPimpinan && c.status !== 'Sesuai' && (
                          <label className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded text-xs font-medium cursor-pointer hover:bg-primary/20">
                            <Upload className="w-3 h-3" /> {doc ? 'Ganti' : 'Unggah'}
                            <input type="file" className="hidden" onChange={e => handleUploadDoc(c.requirement_id, e.target.files[0])} />
                          </label>
                        )}
                        {/* Verify for petugas */}
                        {isPetugas && doc && (
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => handleVerifyChecklist(c.id, 'Sesuai', c.catatan_verifikator || '')} className="px-2 py-1 text-[11px] bg-green-100 text-green-700 rounded font-medium hover:bg-green-200">Sesuai</button>
                            <button onClick={() => handleVerifyChecklist(c.id, 'Belum Sesuai', c.catatan_verifikator || '')} className="px-2 py-1 text-[11px] bg-red-100 text-red-700 rounded font-medium hover:bg-red-200">Belum Sesuai</button>
                            <button onClick={() => {
                              const catatan = prompt('Catatan klarifikasi:', c.catatan_verifikator || '');
                              if (catatan !== null) handleVerifyChecklist(c.id, 'Perlu Klarifikasi', catatan);
                            }} className="px-2 py-1 text-[11px] bg-amber-100 text-amber-700 rounded font-medium hover:bg-amber-200">Klarifikasi</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-5 space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada dokumen diunggah</p>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.nama_item || doc.nama_file}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.nama_file} · {doc.tanggal_unggah ? moment(doc.tanggal_unggah).format('DD MMM YYYY') : ''}</p>
                  </div>
                  <StatusBadge status={doc.status_validasi} size="xs" />
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-5">
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada riwayat aktivitas</p>
              ) : (
                history.slice().reverse().map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                      {i < history.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{h.status_sesudah}</span>
                        {h.status_sebelum && <span className="text-xs text-muted-foreground">dari {h.status_sebelum}</span>}
                      </div>
                      {h.catatan && <p className="text-xs text-muted-foreground mt-0.5">{h.catatan}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {h.nama_pengubah} · {h.tanggal ? moment(h.tanggal).format('DD MMM YYYY, HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="p-5">
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada catatan</p>
              ) : (
                comments.slice().reverse().map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.nama_user}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c.tipe}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{c.tanggal ? moment(c.tanggal).format('DD MMM, HH:mm') : ''}</span>
                    </div>
                    <p className="text-sm">{c.komentar}</p>
                  </div>
                ))
              )}
            </div>
            {(isPetugas || isPimpinan) && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tulis catatan..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary"
                />
                <button
                  onClick={async () => {
                    if (!newComment.trim()) return;
                    try {
                      const c = await base44.entities.TicketComment.create({
                        ticket_id: id, nomor_tiket: ticket.nomor_tiket,
                        user_id: user.id, nama_user: user.full_name, role_user: user.role,
                        komentar: newComment, tipe: 'Catatan', tanggal: new Date().toISOString(),
                      });
                      setComments(prev => [...prev, c]);
                      setNewComment('');
                    } catch (e) { alert('Gagal: ' + e.message); }
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-card rounded-xl border border-border p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Ubah Status Tiket</h3>
            <div className="space-y-3">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary">
                {statusFlow.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <textarea
                placeholder="Catatan (opsional)..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-muted/60 rounded-lg border border-input outline-none focus:border-primary resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Batal</button>
                <button onClick={handleStatusChange} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}