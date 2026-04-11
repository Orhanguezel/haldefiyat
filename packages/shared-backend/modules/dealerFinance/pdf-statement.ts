// src/modules/dealerFinance/pdf-statement.ts
import PDFDocument from 'pdfkit';
import type { DealerTransactionRow } from '@agro/shared-backend/modules/dealerFinance';

function fmtDate(d: Date | string | null | undefined): string {
  if (d == null) return '—';
  const x = typeof d === 'string' ? new Date(d) : d;
  return x.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

export function buildDealerStatementPdf(opts: {
  companyName: string;
  transactions: DealerTransactionRow[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Cari ekstre', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Firma: ${opts.companyName}`, { align: 'left' });
    doc.moveDown(1);

    doc.fontSize(8).text(
      'Tarih | Tur | Tutar | Bakiye | Vade | Aciklama',
      { continued: false },
    );
    doc.moveDown(0.3);
    doc.fontSize(7);

    for (const tx of opts.transactions) {
      const due = tx.due_date ? fmtDate(tx.due_date) : '—';
      const line = [
        fmtDate(tx.created_at),
        tx.type,
        String(tx.amount),
        String(tx.balance_after),
        due,
        (tx.description ?? '').slice(0, 40),
      ].join(' | ');
      doc.text(line, { width: 500 });
      doc.moveDown(0.2);
    }

    doc.end();
  });
}
