import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
// Add page imports here
import Dashboard from '@/pages/Dashboard';
import PortalLayanan from '@/pages/PortalLayanan';
import AjukanLayanan from '@/pages/AjukanLayanan';
import TiketLayanan from '@/pages/TiketLayanan';
import DetailTiket from '@/pages/DetailTiket';
import VerifikasiBerkas from '@/pages/VerifikasiBerkas';
import MasterPegawai from '@/pages/MasterPegawai';
import ArsipPegawai from '@/pages/ArsipPegawai';
import KenaikanPangkat from '@/pages/KenaikanPangkat';
import Pensiun from '@/pages/Pensiun';
import Cuti from '@/pages/Cuti';
import UjiKompetensiJF from '@/pages/UjiKompetensiJF';
import Pelantikan from '@/pages/Pelantikan';
import Laporan from '@/pages/Laporan';
import TemplateDokumen from '@/pages/TemplateDokumen';
import MasterLayanan from '@/pages/MasterLayanan';
import MasterChecklist from '@/pages/MasterChecklist';
import MasterUnitKerja from '@/pages/MasterUnitKerja';
import Pengguna from '@/pages/Pengguna';
import Notifikasi from '@/pages/Notifikasi';
import Pengaturan from '@/pages/Pengaturan';
import Bantuan from '@/pages/Bantuan';
import KGB from '@/pages/KGB';
import SuratKeterangan from '@/pages/SuratKeterangan';
import AIAssistant from '@/pages/AIAssistant';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portal" element={<PortalLayanan />} />
        <Route path="/ajukan" element={<AjukanLayanan />} />
        <Route path="/tiket" element={<TiketLayanan />} />
        <Route path="/tiket/:id" element={<DetailTiket />} />
        <Route path="/verifikasi" element={<VerifikasiBerkas />} />
        <Route path="/pegawai" element={<MasterPegawai />} />
        <Route path="/arsip" element={<ArsipPegawai />} />
        <Route path="/kenaikan-pangkat" element={<KenaikanPangkat />} />
        <Route path="/pensiun" element={<Pensiun />} />
        <Route path="/cuti" element={<Cuti />} />
        <Route path="/kgb" element={<KGB />} />
        <Route path="/surat-keterangan" element={<SuratKeterangan />} />
        <Route path="/uji-kompetensi" element={<UjiKompetensiJF />} />
        <Route path="/pelantikan" element={<Pelantikan />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/template" element={<TemplateDokumen />} />
        <Route path="/master-layanan" element={<MasterLayanan />} />
        <Route path="/master-checklist" element={<MasterChecklist />} />
        <Route path="/master-unit" element={<MasterUnitKerja />} />
        <Route path="/pengguna" element={<Pengguna />} />
        <Route path="/notifikasi" element={<Notifikasi />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
        <Route path="/bantuan" element={<Bantuan />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App