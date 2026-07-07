import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Send, Sparkles, Loader2, FileText, ClipboardList, Mail, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const quickActions = [
  { icon: FileText, label: 'Jelaskan Persyaratan Layanan', prompt: 'Jelaskan persyaratan untuk pengajuan cuti tahunan ASN berdasarkan PP 11/2017 jo. PP 17/2020 dan Peraturan BKN 24/2017 jo. Peraturan BKN 7/2021. Sebutkan dokumen yang wajib dilampirkan.' },
  { icon: ClipboardList, label: 'Draft Catatan Perbaikan', prompt: 'Buatkan draft catatan perbaikan berkas yang sopan untuk pemohon yang dokumennya belum lengkap. Sebutkan bahwa SK pangkat terakhir dan SKP 2 tahun terakhir masih belum diunggah.' },
  { icon: Mail, label: 'Draft Surat Pengantar BKD', prompt: 'Buatkan konsep surat pengantar ke Badan Kepegawaian Daerah Provinsi Sumatera Barat untuk pengusulan kenaikan pangkat pegawai. Gunakan format surat resmi instansi pemerintah.' },
  { icon: BarChart3, label: 'Ringkasan Laporan Bulanan', prompt: 'Buatkan kerangka ringkasan laporan bulanan layanan kepegawaian Sekretariat Daerah yang mencakup: jumlah permohonan masuk, selesai, tertunda, terlambat SLA, dan rekomendasi tindak lanjut.' },
];

const systemPrompt = `Anda adalah AI Assistant internal untuk SIPEGAWAI SETDA - Sistem Pelayanan Kepegawaian Sekretariat Daerah Provinsi Sumatera Barat. 

Tugas Anda:
1. Membantu menjelaskan persyaratan layanan kepegawaian berdasarkan regulasi yang berlaku.
2. Membantu membuat ringkasan catatan verifikasi berkas.
3. Membantu menyusun konsep surat pengantar, surat keterangan, dan nota dinas.
4. Membantu membuat catatan kekurangan berkas dengan bahasa yang sopan dan profesional.
5. Membantu membuat ringkasan laporan bulanan layanan kepegawaian.
6. Memberikan rekomendasi tindak lanjut berdasarkan status tiket.

Dasar hukum utama:
- Cuti ASN: PP 11/2017 jo. PP 17/2020 dan Peraturan BKN 24/2017 jo. Peraturan BKN 7/2021
- Manajemen PNS: PP 49/2018, UU 5/2014 ASN, UU 11/2014
- Hukuman disiplin: PP 94/2021

Penting:
- Gunakan bahasa Indonesia formal yang sesuai untuk instansi pemerintah.
- Anda hanya memberikan saran, ringkasan, dan draft. Keputusan final tetap oleh petugas kepegawaian/pimpinan.
- Semua hasil Anda dapat diedit oleh petugas.
- Jangan mengambil keputusan final atas nama petugas atau pimpinan.
- Berikan jawaban yang ringkas, jelas, dan actionable.`;

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const conversation = [...messages, userMsg]
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nRiwayat percakapan:\n${conversation}\n\nAssistant:`,
        model: 'gemini_3_flash',
        add_context_from_internet: true,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-heading font-bold">AI Assistant Kepegawaian</h1>
          <p className="text-xs text-muted-foreground">Bantuan persyaratan, draft surat, catatan verifikasi &amp; laporan</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex-shrink-0">
          <p className="text-sm font-medium text-muted-foreground mb-3">Pilih bantuan cepat atau ketik pertanyaan Anda:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-start gap-3 bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.prompt}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 bg-card rounded-xl border border-border p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:font-heading prose-p:my-1 prose-li:my-0">{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Menyusun jawaban...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ketik pertanyaan atau permintaan bantuan..."
          className="flex-1 px-4 py-2.5 text-sm bg-card rounded-lg border border-input outline-none focus:border-primary"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center flex-shrink-0">
        AI hanya memberikan saran dan draft. Keputusan final tetap oleh petugas kepegawaian/pimpinan.
      </p>
    </div>
  );
}