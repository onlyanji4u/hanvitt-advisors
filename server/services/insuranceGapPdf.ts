import PDFDocument from 'pdfkit';
import type { Response } from 'express';

const GOLD = '#D4AF37';
const DARK = '#1a1a2e';
const GRAY = '#4a4a6a';
const RED = '#dc2626';
const GREEN = '#059669';

const myths = [
  {
    myth: 'Company insurance is enough.',
    fact: 'Limited coverage (₹2-5L), stops after job change, no long-term continuity.',
  },
  {
    myth: 'I can buy insurance later.',
    fact: 'Premium increases sharply after 40, waiting periods apply, pre-existing conditions may not be covered.',
  },
  {
    myth: 'Employer policy covers everything.',
    fact: 'Room rent limits, co-pay clauses, sub-limits on treatments, and several exclusions apply.',
  },
  {
    myth: 'My employer will always provide insurance.',
    fact: 'Layoffs remove coverage instantly. No retirement protection. Your family is left unprotected.',
  },
  {
    myth: 'Group insurance is better because it\'s cheaper.',
    fact: 'No portability, no no-claim bonus, no customization. You lose it when you leave.',
  },
];

const comparisonRows = [
  ['Coverage Amount', '₹2-5 Lakh (fixed)', '₹5-50 Lakh+ (your choice)'],
  ['Portability', 'Lost on job change', 'Lifetime coverage'],
  ['No-Claim Bonus', 'Not available', 'Up to 50-100% bonus'],
  ['Customization', 'Fixed by employer', 'Fully customizable'],
  ['Post-Retirement', 'No coverage', 'Continues for life'],
  ['Room Rent', 'Sub-limits apply', 'No limits (plan-based)'],
  ['Family Coverage', 'Limited dependents', 'Full family floater'],
];

export function generateInsuranceGapPdf(res: Response) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Hanvitt-Insurance-Gap-Guide.pdf"');
  doc.pipe(res);

  const pageWidth = doc.page.width - 100;

  doc.rect(0, 0, doc.page.width, 120).fill(DARK);
  doc.fontSize(28).font('Helvetica-Bold').fillColor(GOLD).text('HANVITT ADVISORS', 50, 35, { width: pageWidth });
  doc.fontSize(10).font('Helvetica').fillColor('#aaaacc').text('Guiding Wealth. Securing Generations.', 50, 70, { width: pageWidth });
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff').text('Employer vs Personal Insurance - Fact vs Myth', 50, 90, { width: pageWidth });

  doc.moveDown(3);
  doc.y = 140;

  doc.fontSize(11).font('Helvetica').fillColor(GRAY)
    .text('Is your company insurance really enough? This guide breaks down the 5 most dangerous myths salaried employees believe about employer insurance, and reveals the facts you need to protect your family.', 50, doc.y, { width: pageWidth, lineGap: 4 });

  doc.moveDown(1.5);

  doc.fontSize(18).font('Helvetica-Bold').fillColor(DARK).text('5 Myths vs Facts', 50, doc.y);
  doc.moveDown(0.5);

  myths.forEach((item, i) => {
    if (doc.y > 680) {
      doc.addPage();
      doc.y = 50;
    }

    doc.fontSize(12).font('Helvetica-Bold').fillColor(RED).text(`Myth #${i + 1}: `, 50, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(DARK).text(item.myth);
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(GREEN).text('Fact: ', 50, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(GRAY).text(item.fact, { width: pageWidth, lineGap: 2 });
    doc.moveDown(0.8);
  });

  doc.moveDown(1);

  if (doc.y > 500) {
    doc.addPage();
    doc.y = 50;
  }

  doc.fontSize(18).font('Helvetica-Bold').fillColor(DARK).text('Coverage Comparison', 50, doc.y);
  doc.moveDown(0.8);

  const colWidths = [pageWidth * 0.32, pageWidth * 0.34, pageWidth * 0.34];
  const startX = 50;
  let currentY = doc.y;

  doc.rect(startX, currentY, pageWidth, 25).fill(DARK);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Feature', startX + 8, currentY + 7, { width: colWidths[0] });
  doc.text('Employer Insurance', startX + colWidths[0] + 8, currentY + 7, { width: colWidths[1] });
  doc.text('Personal Insurance', startX + colWidths[0] + colWidths[1] + 8, currentY + 7, { width: colWidths[2] });
  currentY += 25;

  comparisonRows.forEach((row, i) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    const bgColor = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
    doc.rect(startX, currentY, pageWidth, 22).fill(bgColor);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK);
    doc.text(row[0], startX + 8, currentY + 6, { width: colWidths[0] });
    doc.font('Helvetica').fillColor(RED);
    doc.text(row[1], startX + colWidths[0] + 8, currentY + 6, { width: colWidths[1] });
    doc.fillColor(GREEN);
    doc.text(row[2], startX + colWidths[0] + colWidths[1] + 8, currentY + 6, { width: colWidths[2] });
    currentY += 22;
  });

  doc.rect(startX, currentY, pageWidth, 0.5).fill('#cccccc');

  doc.moveDown(3);
  doc.y = currentY + 30;

  if (doc.y > 600) {
    doc.addPage();
    doc.y = 50;
  }

  doc.rect(50, doc.y, pageWidth, 80).lineWidth(1).stroke(GOLD);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text('Key Takeaway', 65, doc.y + 12, { width: pageWidth - 30 });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor(GRAY)
    .text('Medical costs are rising 10-15% annually. A ₹5 Lakh employer cover today could be worth less than ₹2 Lakh in real terms within 10 years. Personal insurance gives you control, portability, and lifetime protection.', 65, doc.y, { width: pageWidth - 30, lineGap: 3 });

  doc.y += 60;
  doc.moveDown(2);

  if (doc.y > 650) {
    doc.addPage();
    doc.y = 50;
  }

  doc.rect(0, doc.y, doc.page.width, 90).fill(DARK);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(GOLD)
    .text('"At Hanvitt, we don\'t just sell policies - we protect financial futures."', 50, doc.y + 15, { width: pageWidth, align: 'center' });
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica').fillColor('#aaaacc')
    .text('Get your FREE personalized coverage gap analysis', 50, doc.y + 10, { width: pageWidth, align: 'center' });
  doc.fontSize(10).fillColor('#ffffff')
    .text('Visit: hanvitt.com | Call: 9256 192939', 50, doc.y + 25, { width: pageWidth, align: 'center' });

  doc.end();
}
