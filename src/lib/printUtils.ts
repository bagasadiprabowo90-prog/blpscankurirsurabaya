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
  if (records.length === 0) {
    return '';
  }
  
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

  // Maksimal 51 baris per kolom (maksimal 102 resi per lembar A4).
  const MAX_PER_COLUMN = 51;
  const MAX_PER_PAGE = MAX_PER_COLUMN * 2; // 102 resi per halaman
  
  const pagesData: ResiRecord[][] = [];
  if (records.length === 0) {
    pagesData.push([]);
  } else {
    for (let i = 0; i < records.length; i += MAX_PER_PAGE) {
      pagesData.push(records.slice(i, i + MAX_PER_PAGE));
    }
  }

  const totalPages = pagesData.length;
  let globalStartIndex = 0;

  const pagesHtml = pagesData.map((pageRecords, pageIdx) => {
    const isLastPage = pageIdx === totalPages - 1;
    const pageStartIndex = globalStartIndex;
    globalStartIndex += pageRecords.length;

    // Selalu bagi rata antara kolom kiri dan kolom kanan agar simetris
    const half = Math.ceil(pageRecords.length / 2);
    const leftRecords = pageRecords.slice(0, half);
    const rightRecords = pageRecords.slice(half);

    const leftTable = buildTableHtml(leftRecords, pageStartIndex);
    const rightTable = buildTableHtml(rightRecords, pageStartIndex + half);

    const footerHtml = isLastPage ? `
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
    ` : '';

    const pageNumberHtml = totalPages > 1 ? `
      <div class="page-number">Halaman ${pageIdx + 1} dari ${totalPages}</div>
    ` : '';

    const contentHtml = pageRecords.length === 0 ? `
      <div style="text-align: center; padding: 40px; color: #888; font-size: 11px;">
        Tidak ada data resi untuk dicetak
      </div>
    ` : `
      <div class="columns">
        <div class="column">
          ${leftTable}
        </div>
        <div class="column">
          ${rightTable}
        </div>
      </div>
    `;

    return `
      <div class="print-page ${isLastPage ? 'last-page' : ''}">
        <div class="header">
          <h1>BLP BEAUTY SURABAYA</h1>
          <div class="header-info">
            <div class="print-date">${tanggal}</div>
            <div class="category-badge">${categoryName.toUpperCase()}</div>
            <div class="total">Total: ${records.length} Resi</div>
          </div>
        </div>

        ${contentHtml}

        ${footerHtml}
        ${pageNumberHtml}
      </div>
    `;
  }).join('');

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Resi - ${categoryName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: a4 portrait;
          margin: 8mm 10mm 10mm 10mm;
        }
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 11px;
          background: white;
          color: #333;
          padding: 0;
        }
        .print-page {
          width: 100%;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
        }
        .print-page.last-page {
          page-break-after: auto;
          break-after: auto;
        }
        .header {
          text-align: center;
          padding-bottom: 6px;
          border-bottom: 2px solid #333;
          margin-bottom: 6px;
        }
        .header h1 {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-bottom: 2px;
          letter-spacing: 1px;
        }
        .header .header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }
        .header .print-date {
          font-size: 11px;
          color: #555;
          flex: 1;
          text-align: left;
        }
        .header .category-badge {
          display: inline-block;
          background: ${categoryColor};
          color: white;
          padding: 2px 12px;
          font-size: 11px;
          font-weight: bold;
          border-radius: 3px;
        }
        .header .total {
          font-size: 12px;
          color: #333;
          font-weight: bold;
          flex: 1;
          text-align: right;
        }

        .columns {
          display: flex;
          gap: 10px;
          width: 100%;
        }
        .column {
          flex: 1;
          min-width: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
          table-layout: fixed;
        }
        thead {
          display: table-header-group;
        }
        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        th {
          background: #f0f0f0;
          color: #333;
          padding: 3px 6px;
          text-align: left;
          font-weight: bold;
          font-size: 9.5px;
          border: 1px solid #bbb;
          white-space: nowrap;
        }
        th.no { text-align: center; width: 28px; }
        th.waktu { text-align: center; width: 95px; }
        td {
          padding: 2.6px 6px;
          border: 1px solid #ccc;
          vertical-align: middle;
          line-height: 1.25;
        }
        td.no { text-align: center; font-weight: bold; font-size: 9px; }
        td.resi { 
          font-family: 'Courier New', monospace; 
          font-weight: bold;
          font-size: 9.5px;
          word-break: break-all;
        }
        td.waktu { text-align: center; font-size: 8.5px; white-space: nowrap; }
        tr:nth-child(even) { background: #fafafa; }

        .footer {
          width: 100%;
          margin-top: 10px;
          padding-top: 6px;
          border-top: 2px solid #333;
          font-size: 10.5px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
        }
        .footer-left { text-align: left; }
        .footer-left .location {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .footer-left .pic {
          margin-top: 35px;
          font-weight: bold;
          font-size: 11px;
        }
        .footer-right { text-align: right; }
        .footer-right .kurir {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .footer-right .ttd {
          margin-top: 35px;
          font-weight: bold;
          font-size: 11px;
        }

        .page-number {
          text-align: center;
          font-size: 9px;
          color: #777;
          margin-top: 6px;
        }

        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .print-page {
            page-break-after: always;
            break-after: page;
          }
          .print-page.last-page {
            page-break-after: auto;
            break-after: auto;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    let hasPrinted = false;
    const triggerPrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      printWindow.focus();
      printWindow.print();
    };

    printWindow.onload = triggerPrint;
    setTimeout(triggerPrint, 300);
  }
}
