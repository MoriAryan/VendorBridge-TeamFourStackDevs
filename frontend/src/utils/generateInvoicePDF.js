import jsPDF from 'jspdf';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmt(n) {
  // Use "Rs." to avoid Unicode rupee symbol which Helvetica doesn't support
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN');
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function numToWords(n) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (n === 0) return 'Zero';
  if (n < 0)   return 'Minus ' + numToWords(-n);
  let words = '';
  if (Math.floor(n / 10000000) > 0) { words += numToWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
  if (Math.floor(n / 100000) > 0)   { words += numToWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
  if (Math.floor(n / 1000) > 0)     { words += numToWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
  if (Math.floor(n / 100) > 0)      { words += numToWords(Math.floor(n / 100)) + ' Hundred '; n %= 100; }
  if (n > 0) { words += (words ? 'and ' : '') + (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')); }
  return words.trim();
}

export function generateInvoicePDF(po, invoice) {
  const pdf  = new jsPDF('p', 'pt', 'a4');
  const PW   = 595.28;   // A4 width  in pt
  const PH   = 841.89;   // A4 height in pt
  const ML   = 36;       // margin left
  const MR   = PW - 36;  // margin right
  const CX   = PW / 2;   // center X

  // ── Colour helpers ─────────────────────────────────────────────────────────
  const c = {
    accent:  [63, 55, 201],
    dark:    [20,  20,  30],
    muted:   [100, 100, 115],
    light:   [248, 248, 252],
    border:  [210, 210, 225],
    white:   [255, 255, 255],
    success: [16, 185, 129],
    warn:    [217, 119,   6],
    danger:  [220,  38,  38],
  };
  const fc = (rgb) => pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
  const bc = (rgb) => pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  const dc = (rgb) => pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);

  const status      = invoice?.status || 'Sent';
  const statusColor = status === 'Paid' ? c.success : status === 'Overdue' ? c.danger : c.warn;
  const statusLabel = { Paid: 'PAID', Overdue: 'OVERDUE', Sent: 'PENDING', Generated: 'DRAFT' }[status] || status.toUpperCase();

  let y = 0;

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TOP HEADER BAND
  // ══════════════════════════════════════════════════════════════════════════
  bc(c.accent); pdf.rect(0, 0, PW, 80, 'F');

  // Left: Company name
  fc(c.white);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20);
  pdf.text('VendorBridge Pvt. Ltd.', ML, 32);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  pdf.text('14th Floor, Prestige Trade Tower, MG Road, Bengaluru - 560001', ML, 45);
  pdf.text('GSTIN: 29AABCV1234M1Z5   |   Email: billing@vendorbridge.in', ML, 55);
  pdf.text('CIN: U74999KA2020PTC123456   |   PAN: AABCV1234M', ML, 65);

  // Right: TAX INVOICE label
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22);
  pdf.text('TAX INVOICE', MR, 32, { align: 'right' });

  // Status badge
  bc(statusColor);
  pdf.roundedRect(MR - 72, 42, 72, 22, 4, 4, 'F');
  fc(c.white);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.text(statusLabel, MR - 36, 57, { align: 'center' });

  y = 90;

  // ══════════════════════════════════════════════════════════════════════════
  // 2. INVOICE META ROW (Invoice No | Date | PO No | Due Date)
  // ══════════════════════════════════════════════════════════════════════════
  bc(c.light); pdf.rect(ML, y, MR - ML, 42, 'F');
  dc(c.border); pdf.setLineWidth(0.5);
  pdf.rect(ML, y, MR - ML, 42);

  const metaW = (MR - ML) / 4;
  const metas = [
    { label: 'INVOICE / PO NO.',    value: po?.poNumber || '-' },
    { label: 'INVOICE DATE',        value: fmtDate(invoice?.invoiceDate) },
    { label: 'PO DATE',             value: fmtDate(po?.poDate) },
    { label: 'DUE DATE',            value: fmtDate(invoice?.dueDate) },
  ];
  metas.forEach((m, i) => {
    const x = ML + i * metaW + 10;
    if (i > 0) { dc(c.border); pdf.line(ML + i * metaW, y, ML + i * metaW, y + 42); }
    fc(c.muted); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7);
    pdf.text(m.label, x, y + 14);
    fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
    pdf.text(m.value, x, y + 30);
  });

  y += 54;

  // ══════════════════════════════════════════════════════════════════════════
  // 3. BILLING SECTION (Bill To | Vendor)
  // ══════════════════════════════════════════════════════════════════════════
  const billH = 90;
  dc(c.border); pdf.rect(ML, y, MR - ML, billH);
  pdf.line(CX, y, CX, y + billH);

  // Headers
  bc(c.dark); pdf.rect(ML, y, CX - ML, 16, 'F'); pdf.rect(CX, y, MR - CX, 16, 'F');
  fc(c.white); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  pdf.text('BILL TO', ML + 8, y + 11);
  pdf.text('VENDOR / SHIP TO', CX + 8, y + 11);

  // Bill To content
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
  pdf.text(po?.billTo?.name || '-', ML + 8, y + 28);
  fc(c.muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  const btLines = pdf.splitTextToSize(po?.billTo?.address || '', CX - ML - 16);
  pdf.text(btLines, ML + 8, y + 40);
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  pdf.text('GSTIN: ' + (po?.billTo?.gstin || '-'), ML + 8, y + 72);

  // Vendor content
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
  pdf.text(po?.vendor?.name || '-', CX + 8, y + 28);
  fc(c.muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  const vLines = pdf.splitTextToSize(po?.vendor?.address || '', MR - CX - 16);
  pdf.text(vLines, CX + 8, y + 40);
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  pdf.text('GSTIN: ' + (po?.vendor?.gstin || '-'), CX + 8, y + 72);

  y += billH + 16;

  // ══════════════════════════════════════════════════════════════════════════
  // 4. LINE ITEMS TABLE
  // ══════════════════════════════════════════════════════════════════════════
  // Column X positions (pt)
  const colSno   = ML;
  const colDesc  = ML + 26;
  const colHSN   = ML + 240;
  const colQty   = ML + 295;
  const colUnit  = ML + 330;
  const colRate  = ML + 385;
  const colAmt   = MR;
  const tblW     = MR - ML;

  // Table header
  bc(c.dark); pdf.rect(ML, y, tblW, 20, 'F');
  fc(c.white); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
  pdf.text('#',            colSno + 2,  y + 13);
  pdf.text('DESCRIPTION',  colDesc,     y + 13);
  pdf.text('HSN',          colHSN,      y + 13);
  pdf.text('QTY',          colQty,      y + 13);
  pdf.text('UNIT',         colUnit,     y + 13);
  pdf.text('RATE',         colRate,     y + 13);
  pdf.text('AMOUNT',       colAmt,      y + 13, { align: 'right' });
  y += 20;

  const items = po?.lineItems || [];
  items.forEach((row, idx) => {
    const rowH = 22;
    bc(idx % 2 === 0 ? c.white : c.light);
    pdf.rect(ML, y, tblW, rowH, 'F');
    dc(c.border); pdf.setLineWidth(0.3);
    pdf.line(ML, y + rowH, MR, y + rowH);

    fc(c.dark);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
    pdf.text(String(idx + 1),             colSno + 4,  y + 14);
    // Truncate long descriptions
    const desc = pdf.splitTextToSize(row.item || '', 195);
    pdf.text(desc[0],                     colDesc,     y + 14);
    pdf.text('9403',                      colHSN,      y + 14);  // sample HSN
    pdf.text(String(row.qty || ''),       colQty,      y + 14);
    pdf.text('Nos',                       colUnit,     y + 14);

    // Rate and Amount — pure numbers, no rupee symbol
    pdf.setFont('helvetica', 'normal');
    pdf.text(Number(row.unitPrice || 0).toLocaleString('en-IN'), colRate + 44, y + 14, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(Number(row.total || 0).toLocaleString('en-IN'),     colAmt,       y + 14, { align: 'right' });
    y += rowH;
  });

  // Table bottom border
  dc(c.dark); pdf.setLineWidth(0.5);
  pdf.line(ML, y, MR, y);
  y += 12;

  // ══════════════════════════════════════════════════════════════════════════
  // 5. TOTALS (right-aligned block)
  // ══════════════════════════════════════════════════════════════════════════
  const totLX = 360;   // label left
  const totVX = MR;    // value right

  const totRows = [
    { label: 'Taxable Amount',  value: Number(po?.subtotal || 0).toLocaleString('en-IN'),  bold: false },
    { label: 'CGST @ 9%',      value: Number(po?.cgst    || 0).toLocaleString('en-IN'),    bold: false },
    { label: 'SGST @ 9%',      value: Number(po?.sgst    || 0).toLocaleString('en-IN'),    bold: false },
    { label: 'Round Off',       value: '0.00',                                              bold: false },
  ];

  totRows.forEach((t) => {
    fc(t.bold ? c.dark : c.muted);
    pdf.setFont('helvetica', t.bold ? 'bold' : 'normal'); pdf.setFontSize(9);
    pdf.text(t.label, totLX, y);
    pdf.text(t.value, totVX, y, { align: 'right' });
    y += 14;
  });

  // Grand Total box
  bc(c.accent); pdf.rect(totLX - 6, y - 2, MR - totLX + 10, 22, 'F');
  fc(c.white);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('GRAND TOTAL (INR)', totLX, y + 14);
  pdf.text(Number(po?.grandTotal || 0).toLocaleString('en-IN'), totVX, y + 14, { align: 'right' });
  y += 32;

  // ══════════════════════════════════════════════════════════════════════════
  // 6. AMOUNT IN WORDS
  // ══════════════════════════════════════════════════════════════════════════
  bc(c.light); pdf.rect(ML, y, MR - ML, 22, 'F');
  dc(c.border); pdf.rect(ML, y, MR - ML, 22);
  fc(c.muted); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7);
  pdf.text('AMOUNT IN WORDS:', ML + 6, y + 9);
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
  const words = 'Indian Rupees ' + numToWords(Math.round(po?.grandTotal || 0)) + ' Only';
  pdf.text(pdf.splitTextToSize(words, MR - ML - 90)[0], ML + 110, y + 9);
  y += 32;

  // ══════════════════════════════════════════════════════════════════════════
  // 7. TERMS & AUTHORIZED SIGNATURE
  // ══════════════════════════════════════════════════════════════════════════
  const sigBoxY = y;
  const sigBoxH = 68;
  dc(c.border); pdf.rect(ML, sigBoxY, MR - ML, sigBoxH);
  pdf.line(CX, sigBoxY, CX, sigBoxY + sigBoxH);

  // Terms
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  pdf.text('Terms & Conditions', ML + 6, sigBoxY + 12);
  fc(c.muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
  const terms = [
    '1. Payment due within 30 days of invoice date.',
    '2. Late payment attracts 2% interest per month.',
    '3. Subject to Bengaluru jurisdiction only.',
    '4. Goods once dispatched are non-returnable.',
  ];
  terms.forEach((t, i) => pdf.text(t, ML + 6, sigBoxY + 24 + i * 10));

  // Signature
  fc(c.dark); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  pdf.text('For VendorBridge Pvt. Ltd.', CX + 6, sigBoxY + 12);
  dc(c.border); pdf.line(CX + 6, sigBoxY + 56, MR - 6, sigBoxY + 56);
  fc(c.muted); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
  pdf.text('Authorized Signatory', CX + 6, sigBoxY + 64);

  y = sigBoxY + sigBoxH + 10;

  // ══════════════════════════════════════════════════════════════════════════
  // 8. PAID DIAGONAL WATERMARK
  // ══════════════════════════════════════════════════════════════════════════
  if (status === 'Paid') {
    pdf.saveGraphicsState();
    pdf.setGState(pdf.GState({ opacity: 0.08 }));
    fc(c.success);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(110);
    pdf.text('PAID', PW / 2, PH / 2, { align: 'center', angle: 45 });
    pdf.restoreGraphicsState();
  }
  if (status === 'Overdue') {
    pdf.saveGraphicsState();
    pdf.setGState(pdf.GState({ opacity: 0.07 }));
    fc(c.danger);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(90);
    pdf.text('OVERDUE', PW / 2, PH / 2, { align: 'center', angle: 45 });
    pdf.restoreGraphicsState();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 9. FOOTER BAR
  // ══════════════════════════════════════════════════════════════════════════
  bc(c.accent); pdf.rect(0, PH - 28, PW, 28, 'F');
  fc(c.white); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
  pdf.text('This is a computer-generated invoice and does not require a physical signature.', CX, PH - 16, { align: 'center' });
  pdf.text('VendorBridge Pvt. Ltd.  |  GSTIN: 29AABCV1234M1Z5  |  billing@vendorbridge.in', CX, PH - 8, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────
  pdf.save(`${po?.poNumber || 'invoice'}.pdf`);
}
