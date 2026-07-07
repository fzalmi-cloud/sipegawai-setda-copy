import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';

const EMPLOYEE_COLUMNS = [
  { key: 'nama_lengkap', label: 'Nama Lengkap' },
  { key: 'nip', label: 'NIP' },
  { key: 'nik', label: 'NIK' },
  { key: 'tempat_lahir', label: 'Tempat Lahir' },
  { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
  { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
  { key: 'agama', label: 'Agama' },
  { key: 'status_asn', label: 'Status ASN' },
  { key: 'nama_unit', label: 'Unit Kerja' },
  { key: 'jabatan', label: 'Jabatan' },
  { key: 'jenis_jabatan', label: 'Jenis Jabatan' },
  { key: 'pangkat_golongan', label: 'Pangkat/Golongan' },
  { key: 'tmt_cpns', label: 'TMT CPNS' },
  { key: 'tmt_pns', label: 'TMT PNS' },
  { key: 'tmt_pangkat_terakhir', label: 'TMT Pangkat' },
  { key: 'tmt_jabatan', label: 'TMT Jabatan' },
  { key: 'pendidikan_terakhir', label: 'Pendidikan' },
  { key: 'no_hp', label: 'No HP' },
  { key: 'email', label: 'Email' },
  { key: 'status_perkawinan', label: 'Status Perkawinan' },
  { key: 'jumlah_anak', label: 'Jumlah Anak' },
  { key: 'status_pegawai', label: 'Status Pegawai' },
];

const PDF_COLUMNS = [
  { key: 'nama_lengkap', label: 'Nama', width: 50 },
  { key: 'nip', label: 'NIP', width: 35 },
  { key: 'jabatan', label: 'Jabatan', width: 40 },
  { key: 'pangkat_golongan', label: 'Pangkat/Gol', width: 30 },
  { key: 'nama_unit', label: 'Unit Kerja', width: 50 },
  { key: 'status_pegawai', label: 'Status', width: 25 },
];

function formatDate() {
  return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function exportToExcel(data, filename = 'Data_Pegawai') {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"><style>td,th{font-family:Arial;font-size:10px;border:1px solid #333;padding:4px;white-space:nowrap}th{background:#1e3a5f;color:#fff;font-weight:bold}</style></head><body>';
  html += `<table><thead><tr>`;
  EMPLOYEE_COLUMNS.forEach(col => { html += `<th>${col.label}</th>`; });
  html += '</tr></thead><tbody>';
  data.forEach(emp => {
    html += '<tr>';
    EMPLOYEE_COLUMNS.forEach(col => {
      const val = emp[col.key];
      html += `<td>${val !== null && val !== undefined ? String(val) : ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';

  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(data, filename = 'Data_Pegawai') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text('DATA PEGAWAI', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Sekretariat Daerah Provinsi Sumatera Barat', pageWidth / 2, 20, { align: 'center' });
  doc.text(`Tanggal Export: ${formatDate()}  |  Total: ${data.length} pegawai`, pageWidth / 2, 25, { align: 'center' });

  let y = 32;
  const rowH = 7;
  const startX = 14;
  const totalWidth = PDF_COLUMNS.reduce((s, c) => s + c.width, 0);
  const scale = (pageWidth - 28) / totalWidth;
  const colWidths = PDF_COLUMNS.map(c => c.width * scale);

  doc.setFillColor(30, 58, 95);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(8);
  let x = startX;
  PDF_COLUMNS.forEach((col, i) => {
    doc.rect(x, y, colWidths[i], rowH, 'F');
    doc.text(col.label, x + 1, y + 5);
    x += colWidths[i];
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  y += rowH;

  data.forEach((emp, idx) => {
    if (y > 190) {
      doc.addPage();
      y = 20;
      doc.setFillColor(30, 58, 95);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      x = startX;
      PDF_COLUMNS.forEach((col, i) => {
        doc.rect(x, y, colWidths[i], rowH, 'F');
        doc.text(col.label, x + 1, y + 5);
        x += colWidths[i];
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      y += rowH;
    }

    x = startX;
    if (idx % 2 === 0) {
      doc.setFillColor(240, 240, 245);
      doc.rect(x, y, colWidths.reduce((s, w) => s + w, 0), rowH, 'F');
    }
    PDF_COLUMNS.forEach((col, i) => {
      const val = emp[col.key];
      const text = val ? String(val) : '';
      doc.text(text.substring(0, Math.floor(colWidths[i] / 1.8)), x + 1, y + 5);
      x += colWidths[i];
    });
    doc.setDrawColor(200, 200, 200);
    x = startX;
    PDF_COLUMNS.forEach((_, i) => {
      doc.rect(x, y, colWidths[i], rowH);
      x += colWidths[i];
    });
    y += rowH;
  });

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`SIPEGAWAI SETDA - Dicetak pada ${formatDate()}`, pageWidth / 2, 200, { align: 'center' });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToWord(data, filename = 'Data_Pegawai') {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"><style>';
  html += '@page{size:landscape;margin:1cm} body{font-family:Arial;font-size:10px}';
  html += 'table{border-collapse:collapse;width:100%} th,td{border:1px solid #333;padding:4px}';
  html += 'th{background-color:#1e3a5f;color:white;text-align:left} h2{text-align:center} p.meta{text-align:center;font-size:9px;color:#666}';
  html += '</style></head><body>';
  html += '<h2>DATA PEGAWAI</h2>';
  html += '<p class="meta">Sekretariat Daerah Provinsi Sumatera Barat</p>';
  html += `<p class="meta">Tanggal Export: ${formatDate()} | Total: ${data.length} pegawai</p>`;
  html += '<table><thead><tr>';
  EMPLOYEE_COLUMNS.forEach(col => { html += `<th>${col.label}</th>`; });
  html += '</tr></thead><tbody>';
  data.forEach(emp => {
    html += '<tr>';
    EMPLOYEE_COLUMNS.forEach(col => {
      const val = emp[col.key];
      html += `<td>${val !== null && val !== undefined ? String(val) : ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importEmployeesFromFile(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
    file_url,
    json_schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nama_lengkap: { type: "string" },
              nip: { type: "string" },
              nik: { type: "string" },
              tempat_lahir: { type: "string" },
              tanggal_lahir: { type: "string" },
              jenis_kelamin: { type: "string" },
              agama: { type: "string" },
              status_asn: { type: "string" },
              nama_unit: { type: "string" },
              jabatan: { type: "string" },
              jenis_jabatan: { type: "string" },
              pangkat_golongan: { type: "string" },
              tmt_cpns: { type: "string" },
              tmt_pns: { type: "string" },
              tmt_pangkat_terakhir: { type: "string" },
              tmt_jabatan: { type: "string" },
              pendidikan_terakhir: { type: "string" },
              no_hp: { type: "string" },
              email: { type: "string" },
              alamat: { type: "string" },
              status_perkawinan: { type: "string" },
              jumlah_anak: { type: "number" },
              status_pegawai: { type: "string" },
            }
          }
        }
      }
    }
  });

  let employees = [];
  if (result.output) {
    if (Array.isArray(result.output)) {
      employees = result.output;
    } else if (result.output.data && Array.isArray(result.output.data)) {
      employees = result.output.data;
    } else if (Array.isArray(result.output.employees)) {
      employees = result.output.employees;
    }
  }

  return employees;
}