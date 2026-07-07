import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, FileText, FilePlus, Ticket, CheckSquare,
  Users, FolderArchive, TrendingUp, Clock, CalendarDays,
  Award, FileCheck, BarChart3, FileType, Settings, HelpCircle,
  Building2, ListChecks, Bell, X, DollarSign, Sparkles
} from 'lucide-react';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin_kepegawaian', 'bendahara', 'operator_biro', 'pegawai', 'pimpinan'] },
  { to: '/portal', label: 'Portal Layanan', icon: FileText, roles: ['super_admin', 'admin_kepegawaian', 'bendahara', 'operator_biro', 'pegawai', 'pimpinan'] },
  { to: '/ajukan', label: 'Ajukan Layanan', icon: FilePlus, roles: ['super_admin', 'admin_kepegawaian', 'bendahara', 'operator_biro', 'pegawai'] },
  { to: '/tiket', label: 'Tiket Layanan', icon: Ticket, roles: ['super_admin', 'admin_kepegawaian', 'bendahara', 'operator_biro', 'pegawai', 'pimpinan'] },
  { to: '/verifikasi', label: 'Verifikasi Berkas', icon: CheckSquare, roles: ['super_admin', 'admin_kepegawaian', 'bendahara'] },
  { to: '/pegawai', label: 'Master Pegawai', icon: Users, roles: ['super_admin', 'admin_kepegawaian', 'operator_biro'] },
  { to: '/arsip', label: 'Arsip Pegawai', icon: FolderArchive, roles: ['super_admin', 'admin_kepegawaian', 'operator_biro'] },
  { to: '/kenaikan-pangkat', label: 'Kenaikan Pangkat', icon: TrendingUp, roles: ['super_admin', 'admin_kepegawaian', 'pimpinan'] },
  { to: '/pensiun', label: 'Pensiun', icon: Clock, roles: ['super_admin', 'admin_kepegawaian', 'pimpinan'] },
  { to: '/cuti', label: 'Cuti', icon: CalendarDays, roles: ['super_admin', 'admin_kepegawaian', 'operator_biro', 'pegawai', 'pimpinan'] },
  { to: '/kgb', label: 'KGB', icon: DollarSign, roles: ['super_admin', 'admin_kepegawaian', 'pimpinan'] },
  { to: '/surat-keterangan', label: 'Surat Keterangan', icon: FileText, roles: ['super_admin', 'admin_kepegawaian', 'operator_biro', 'pegawai'] },
  { to: '/uji-kompetensi', label: 'Uji Kompetensi JF', icon: Award, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/pelantikan', label: 'Pelantikan', icon: FileCheck, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/laporan', label: 'Laporan', icon: BarChart3, roles: ['super_admin', 'admin_kepegawaian', 'pimpinan'] },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, roles: ['super_admin', 'admin_kepegawaian', 'operator_biro', 'pegawai'] },
  { to: '/template', label: 'Template Dokumen', icon: FileType, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/master-layanan', label: 'Master Layanan', icon: FileText, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/master-checklist', label: 'Master Checklist', icon: ListChecks, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/master-unit', label: 'Master Unit Kerja', icon: Building2, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/notifikasi', label: 'Notifikasi', icon: Bell, roles: ['super_admin', 'admin_kepegawaian', 'bendahara', 'operator_biro', 'pegawai', 'pimpinan'] },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings, roles: ['super_admin', 'admin_kepegawaian'] },
  { to: '/bantuan', label: 'Bantuan / FAQ', icon: HelpCircle, roles: ['super_admin', 'admin_kepegawaian', 'bendahara', 'operator_biro', 'pegawai', 'pimpinan'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const userRole = user?.role || 'pegawai';

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  const roleLabels = {
    super_admin: 'Super Admin',
    admin_kepegawaian: 'Admin Kepegawaian',
    bendahara: 'Bendahara/Pejabang Rangkap',
    operator_biro: 'Operator Biro',
    pegawai: 'Pegawai/ASN',
    pimpinan: 'Pimpinan'
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-sidebar z-50 transform transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } flex flex-col`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-yellow-600 flex items-center justify-center shadow-lg">
            <span className="font-bold text-sidebar text-lg">SP</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-sidebar-foreground text-sm leading-tight truncate">SIPEGAWAI SETDA</h1>
            <p className="text-xs text-sidebar-foreground/50">Sistem Pelayanan Kepegawaian</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/50">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar text-sm font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name || 'Pengguna'}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabels[userRole]}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar font-semibold shadow-md'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40 text-center">© 2026 Setda Prov. Sumbar</p>
        </div>
      </aside>
    </>
  );
}