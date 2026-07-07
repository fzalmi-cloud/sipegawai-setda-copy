import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, FileText, FileType2, ChevronDown, Loader2 } from 'lucide-react';

export default function ImportExportBar({ onImport, onExport, importing = false }) {
  const [showExport, setShowExport] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onImport(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv,.pdf"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2 disabled:opacity-50"
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {importing ? 'Memproses...' : 'Import'}
      </button>
      <div className="relative">
        <button
          onClick={() => setShowExport(!showExport)}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export
          <ChevronDown className="w-3 h-3" />
        </button>
        {showExport && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
            <div className="absolute right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 w-48 py-1">
              <button
                onClick={() => { onExport('excel'); setShowExport(false); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel (.xls)
              </button>
              <button
                onClick={() => { onExport('pdf'); setShowExport(false); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-red-600" /> PDF (.pdf)
              </button>
              <button
                onClick={() => { onExport('word'); setShowExport(false); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
              >
                <FileType2 className="w-4 h-4 text-blue-600" /> Word (.doc)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}