import ExcelJS from 'exceljs';
import { ResiRecord } from './db';
import { COURIER_CATEGORIES, CourierCategory, getCategoryConfig } from './courierCategories';

export async function exportToExcel(records: ResiRecord[], filename: string = 'resi-export'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Resi Manager';
  workbook.created = new Date();
  
  // Group records by category
  const grouped: Record<CourierCategory, ResiRecord[]> = {} as Record<CourierCategory, ResiRecord[]>;
  
  for (const category of COURIER_CATEGORIES) {
    grouped[category.id] = [];
  }
  
  for (const record of records) {
    grouped[record.category].push(record);
  }
  
  // Create a sheet for each category
  for (const category of COURIER_CATEGORIES) {
    const categoryRecords = grouped[category.id];
    const config = getCategoryConfig(category.id);
    
    const worksheet = workbook.addWorksheet(config.shortName);
    
    // Add headers
    worksheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Nomor Resi', key: 'resi', width: 25 },
      { header: 'Tanggal/Waktu', key: 'waktu', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Synced', key: 'synced', width: 10 },
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add data rows
    for (let i = 0; i < categoryRecords.length; i++) {
      const record = categoryRecords[i];
      worksheet.addRow({
        no: record.rowNumber,
        resi: record.resi,
        waktu: new Date(record.timestamp).toLocaleString('id-ID'),
        status: record.isDuplicate ? 'DUPLIKAT' : 'OK',
        synced: record.syncedToSheet ? 'Ya' : 'Tidak',
      });
    }
  }
  
  // Generate and download file
  const date = new Date().toISOString().split('T')[0];
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${date}.xlsx`;
  link.click();
  
  URL.revokeObjectURL(url);
}

export function parseExcelFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        
        const resiNumbers: string[] = [];
        
        workbook.eachSheet((worksheet) => {
          worksheet.eachRow((row) => {
            row.eachCell((cell) => {
              const value = cell.value;
              if (typeof value === 'string' && value.trim()) {
                resiNumbers.push(value.trim());
              } else if (typeof value === 'number') {
                resiNumbers.push(String(value));
              }
            });
          });
        });
        
        resolve(resiNumbers);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseCSV(text: string): string[] {
  const lines = text.split(/[\n\r]+/);
  const resiNumbers: string[] = [];
  
  for (const line of lines) {
    const cells = line.split(/[,;\t]/);
    for (const cell of cells) {
      const trimmed = cell.trim().replace(/^["']|["']$/g, '');
      if (trimmed) {
        resiNumbers.push(trimmed);
      }
    }
  }
  
  return resiNumbers;
}
