import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileCheck, Plus, X, Calendar, MapPin } from 'lucide-react';
import moment from 'moment';

export default function Pelantikan() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ServiceTicket.filter({ kategori_layanan: 'Pelantikan' }, '-tanggal_pengajuan', 100);
        setTickets(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Pelantikan</h1>
        <p className="text-muted-foreground mt-1">{tickets.length} agenda pelantikan</p>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada agenda pelantikan</p>
            <p className="text-xs mt-1">Agenda pelantikan dibuat melalui pengajuan layanan Pelantikan.</p>
          </div>
        ) : (
          tickets.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t.nama_layanan}</p>
                  <p className="text-xs text-muted-foreground">{t.nama_pegawai} · {t.nama_unit}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.tanggal_pengajuan ? moment(t.tanggal_pengajuan).format('DD MMM YYYY') : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}