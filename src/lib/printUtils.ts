import { ResiRecord } from './db';
import { COURIER_CATEGORIES, CourierCategory } from './courierCategories';

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

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Resi - ${categoryName}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          background: white;
          color: #333;
        }
        .page {
          width: 100%;
        }
        .header {
          text-align: center;
          padding-bottom: 15px;
          border-bottom: 3px solid ${categoryColor};
          margin-bottom: 15px;
          break-after: avoid-page;
          page-break-after: avoid;
        }
        .header h1 {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .header .category-badge {
          display: inline-block;
          background: ${categoryColor};
          color: white;
          padding: 6px 20px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 4px;
          margin-top: 5px;
        }
        .header .total {
          font-size: 16px;
          color: #333;
          margin-top: 8px;
          font-weight: bold;
        }
        .content {
          display: block;
          break-before: avoid-page;
          page-break-before: avoid;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          page-break-inside: auto;
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th {
          background: white;
          color: #2563eb;
          padding: 8px 14px;
          text-align: left;
          font-weight: bold;
          font-size: 11px;
          border: 1px solid #ddd;
          white-space: nowrap;
        }
        th.no { text-align: center; padding: 8px 12px; }
        th.resi { }
        th.waktu { text-align: center; }
        td {
          padding: 5px 14px;
          border: 1px solid #ddd;
          vertical-align: middle;
          line-height: 1.3;
        }
        td.no { text-align: center; font-weight: bold; font-size: 10px; padding: 5px 12px; }
        td.resi { 
          font-family: 'Courier New', monospace; 
          font-weight: bold;
          font-size: 11px;
        }
        td.waktu { text-align: center; font-size: 10px; white-space: nowrap; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #333;
          font-size: 12px;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
        }
        .footer-left {
          text-align: left;
        }
        .footer-left .location {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .footer-left .pic {
          margin-top: 70px;
          font-weight: bold;
        }
        .footer-right {
          text-align: right;
        }
        .footer-right .kurir {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .footer-right .ttd {
          margin-top: 70px;
          font-weight: bold;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>BLP BEAUTY</h1>
          <div class="category-badge">${categoryName.toUpperCase()}</div>
          <div class="total">Total: ${records.length} Resi</div>
        </div>
        
        <div class="content">
          <table id="resi-table">
            <thead>
              <tr>
                <th class="no">NO</th>
                <th class="resi">NOMOR RESI</th>
                <th class="waktu">WAKTU</th>
                <th class="no" style="border-left: 2px solid #333;">NO</th>
                <th class="resi">NOMOR RESI</th>
                <th class="waktu">WAKTU</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: Math.ceil(records.length / 2) }).map((_, i) => {
                const renderCell = (record: ResiRecord | undefined, index: number, isRight: boolean) => {
                  if (!record) return '<td class="no"' + (isRight ? ' style="border-left: 2px solid #333;"' : '') + '></td><td class="resi"></td><td class="waktu"></td>';
                  const recordDate = new Date(record.timestamp);
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                  const day = recordDate.getDate().toString().padStart(2, '0');
                  const month = months[recordDate.getMonth()];
                  const year = recordDate.getFullYear();
                  const tgl = day + ' ' + month + ' ' + year;
                  const wkt = recordDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  return '<td class="no"' + (isRight ? ' style="border-left: 2px solid #333;"' : '') + '>' + (index + 1) + '</td>' +
                         '<td class="resi">' + record.resi + '</td>' +
                         '<td class="waktu">' + tgl + ' ' + wkt + '</td>';
                };
                
                return '<tr>' + 
                  renderCell(records[i * 2], i * 2, false) + 
                  renderCell(records[i * 2 + 1], i * 2 + 1, true) + 
                  '</tr>';
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer" id="report-footer">
            <div class="footer-content">
              <div class="footer-left">
                <div class="location">Bogor, ${tanggal}</div>
                <div class="location">Pukul ${waktu}</div>
                <div class="pic">PIC BLP</div>
              </div>
              <div class="footer-right">
                <div class="kurir">Kurir: ${categoryName}</div>
                <div class="ttd">TTD</div>
              </div>
            </div>
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
      const table = printWindow.document.getElementById('resi-table');
      const footer = printWindow.document.getElementById('report-footer');
      if (table && footer) footer.style.width = `${table.getBoundingClientRect().width}px`;
      printWindow.print();
    };
  }
}
