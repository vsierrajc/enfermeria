import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [66, 153, 225] as [number, number, number],
  headerBg: [237, 242, 247] as [number, number, number],
  text: [45, 55, 72] as [number, number, number],
  textLight: [113, 128, 150] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [229, 62, 62] as [number, number, number],
  green: [72, 187, 120] as [number, number, number],
  orange: [237, 137, 54] as [number, number, number],
  purple: [159, 122, 234] as [number, number, number],
};

export function createPdf(title: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'letter');
  doc.setFont('helvetica', 'normal');
  return doc;
}

export function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle || new Date().toLocaleDateString('es-CO'), 14, 23);

  doc.setTextColor(...COLORS.text);
  return 35;
}

export function addFooter(doc: jsPDF, pageNum: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Sistema de Control de Enfermeria', 14, pageHeight - 10);
  doc.text(`Pagina ${pageNum}`, pageWidth - 30, pageHeight - 10);
}

export function drawTable(
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: (string | number)[][],
): number {
  autoTable(doc, {
    startY,
    head,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.text,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: COLORS.text,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
  });
  return (doc as any).lastAutoTable?.finalY || startY + 10;
}

export function drawLabelValue(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  labelWidth: number = 40,
) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textLight);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(value || '-', x + labelWidth, y);
}

export function formatDate(date?: string): string {
  if (!date) return '-';
  return date.split('T')[0];
}

export function formatDateTime(date?: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('es-CO');
}

export { COLORS };
