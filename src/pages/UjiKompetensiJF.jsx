import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UjiKompetensiJF() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Uji Kompetensi Jabatan Fungsional</h1>
        <p className="text-muted-foreground mt-1">{employees.length} pegawai jabatan fungsional</p>
      </div>

      <div className="space-y-2">
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
    </div>
  );
}