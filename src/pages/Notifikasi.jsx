import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, BellOff } from 'lucide-react';
import moment from 'moment';

export default function Notifikasi() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Notification.filter({ user_id: user.id }, '-tanggal', 100);
        setNotifications(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await base44.entities.Notification.update(id, { dibaca: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, dibaca: true } : n));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.dibaca);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { dibaca: true })));
      setNotifications(prev => prev.map(n => ({ ...n, dibaca: true })));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.dibaca) : notifications.filter(n => n.tipe === filter);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Notifikasi</h1>
          <p className="text-muted-foreground mt-1">{notifications.filter(n => !n.dibaca).length} belum dibaca</p>
        </div>
        {notifications.some(n => !n.dibaca) && (
          <button onClick={handleMarkAllRead} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary">
        <option value="all">Semua Notifikasi</option>
        <option value="unread">Belum Dibaca</option>
        <option value="Tiket Baru">Tiket Baru</option>
        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
        <option value="Persetujuan Pimpinan">Persetujuan Pimpinan</option>
        <option value="SLA Terlampaui">SLA Terlampaui</option>
        <option value="Hasil Tersedia">Hasil Tersedia</option>
        <option value="Pensiun">Pensiun</option>
        <option value="Naik Pangkat">Naik Pangkat</option>
      </select>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <BellOff className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Tidak ada notifikasi</p>
          </div>
        ) : (
          filtered.map(n => (
            <div key={n.id} className={`bg-card rounded-xl border p-4 ${!n.dibaca ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.dibaca ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Bell className={`w-4 h-4 ${!n.dibaca ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.dibaca ? 'font-semibold' : 'font-medium'}`}>{n.judul}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{n.tipe}</span>
                    {!n.dibaca && <span className="w-2 h-2 rounded-full bg-primary ml-auto" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.pesan}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{n.tanggal ? moment(n.tanggal).fromNow() : ''}</span>
                    {n.ticket_id && <Link to={`/tiket/${n.ticket_id}`} className="text-xs text-primary hover:underline">Lihat tiket →</Link>}
                    {!n.dibaca && <button onClick={() => handleMarkRead(n.id)} className="text-xs text-muted-foreground hover:text-primary">Tandai dibaca</button>}
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