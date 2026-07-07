import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Bell, Menu, LogOut, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadNotifs = async () => {
      try {
        const data = await base44.entities.Notification.filter(
          { user_id: user.id, dibaca: false },
          '-tanggal', 10
        );
        setNotifications(data);
      } catch (e) {
        // silent
      }
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border h-16 flex items-center gap-4 px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari pegawai, tiket, layanan..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/60 rounded-lg border border-transparent focus:border-primary focus:bg-card outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifikasi</h3>
                    <Link to="/notifikasi" onClick={() => setShowNotif(false)} className="text-xs text-primary hover:underline">
                      Lihat semua
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">Tidak ada notifikasi</p>
                    ) : (
                      notifications.map(n => (
                        <Link
                          key={n.id}
                          to={n.ticket_id ? `/tiket/${n.ticket_id}` : '/notifikasi'}
                          onClick={() => setShowNotif(false)}
                          className="block px-4 py-3 hover:bg-muted border-b border-border/50 transition-colors"
                        >
                          <p className="text-sm font-medium">{n.judul}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.pesan}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => logout()}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}