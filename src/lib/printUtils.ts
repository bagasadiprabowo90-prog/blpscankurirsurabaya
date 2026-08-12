import { ResiRecord } from './db';
import { COURIER_CATEGORIES, CourierCategory } from './courierCategories';

function formatRecord(record: ResiRecord) {
  const recordDate = new Date(record.timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = recordDate.getDate().toString().padStart(2, '0');
  const month = months[recordDate.getMonth()];
  const year = recordDate.getFullYear();
  const tgl = day + ' ' + month + ' ' + year;
  const wkt = recordDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return { tgl, wkt };
}

function buildTableHtml(records: ResiRecord[], startIndex: number): string {
  if (records.length === 0) return '';
  
  let rows = '';
  records.forEach((record, i) => {
    const { tgl, wkt } = formatRecord(record);
    const no = startIndex + i + 1;
    rows += '<tr>' +
      '<td class="no">' + no + '</td>' +
      '<td class="resi">' + record.resi + '</td>' +
      '<td class="waktu">' + tgl + ' ' + wkt + '</td>' +
      '</tr>';
  });

  return '<table>' +
    '<thead><tr>' +
    '<th class="no">NO</th>' +
    '<th class="resi">NOMOR RESI</th>' +
    '<th class="waktu">WAKTU</th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>';
}

export function printReport(records: ResiRecord[], category: CourierCategory) {
  const categoryConfig = COURIER_CATEGORIES.find(c => c.id === category);
  const categoryName = categoryConfig?.name || category;
  const categoryColor = categoryConfig?.color || 'hsl(220, 9%, 46%)';
  
  const now = new Date();
  const tanggal = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const waktu = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Split records into left and right columns
  const half = Math.ceil(records.length / 2);
  const leftRecords = records.slice(0, half);
  const rightRecords = records.slice(half);

  const leftTable = buildTableHtml(leftRecords, 0);
  const rightTable = buildTableHtml(rightRecords, half);

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Resi - ${categoryName}</title>
      <style>
        @page {
          size: A4;
          margin: 12mm;
        }
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #333;
          margin-bottom: 12px;
        }
        .header h1 {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        .header .category-badge {
          display: inline-block;
          background: ${categoryColor};
          color: white;
          padding: 4px 16px;
          font-size: 12px;
          font-weight: bold;
          border-radius: 3px;
          margin-top: 4px;
        }
        .header .total {
          font-size: 13px;
          color: #333;
          margin-top: 6px;
          font-weight: bold;
        }

        .columns {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .column {
          flex: 1;
          min-width: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th {
          background: #f0f0f0;
          color: #333;
          padding: 5px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 10px;
          border: 1px solid #ccc;
          white-space: nowrap;
        }
        th.no { text-align: center; width: 30px; }
        th.waktu { text-align: center; }
        td {
          padding: 3px 8px;
          border: 1px solid #ccc;
          vertical-align: middle;
          line-height: 1.3;
        }
        td.no { text-align: center; font-weight: bold; font-size: 9px; }
        td.resi { 
          font-family: 'Courier New', monospace; 
          font-weight: bold;
          font-size: 10px;
        }
        td.waktu { text-align: center; font-size: 9px; white-space: nowrap; }
        tr:nth-child(even) { background: #fafafa; }

        .footer {
          width: 100%;
          margin-top: 24px;
          padding-top: 12px;
          border-top: 2px solid #333;
          font-size: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
        }
        .footer-left { text-align: left; }
        .footer-left .location {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .footer-left .pic {
          margin-top: 70px;
          font-weight: bold;
          font-size: 14px;
        }
        .footer-right { text-align: right; }
        .footer-right .kurir {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .footer-right .ttd {
          margin-top: 70px;
          font-weight: bold;
          font-size: 14px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BLP BEAUTY</h1>
        <div class="category-badge">${categoryName.toUpperCase()}</div>
        <div class="total">Total: ${records.length} Resi</div>
      </div>
      
      <div class="columns">
        <div class="column">
          ${leftTable}
        </div>
        <div class="column">
          ${rightTable}
        </div>
      </div>

      <div class="footer">
        <div class="footer-content">
          <div class="footer-left">
            <div class="location">Surabaya, ${tanggal}</div>
            <div class="location">Pukul ${waktu}</div>
            <div class="pic">PIC BLP</div>
          </div>
          <div class="footer-right">
            <div class="kurir">Kurir: ${categoryName}</div>
            <div class="ttd">TTD</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
