// services/PdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'Cairo-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Cairo-Bold.ttf');
function formatArabicText(text) {
  return text.split(' ').reverse().join('  ');
}
class PdfService {
  static _recipientTable(auth, doc) {
  const recipient = auth.recipient;
  if (!recipient || !recipient.full_name) return;

  const startY = doc.y;
  const rowHeight = 18;

  doc
    .font('Cairo-Bold')
    .fontSize(12)
    .fillColor('#12304A')
    .text('بيانات المستلم / قريب المتوفى', 50, startY);

  doc.moveDown(0.5);

  const rows = [
    ['الاسم', recipient.full_name || '—'],
    ['رقم الهوية', recipient.id_number || '—'],
    ['الهاتف', recipient.phone || '—'],
    ['صلة القرابة', recipient.relationship || '—'],
    ['العنوان', recipient.address || '—'],
    ['تم التحقق من الهوية', recipient.id_verified ? '✓ نعم' : '✗ لا'],
  ];

  const tableStartY = doc.y;
  const tableStartX = 50;

  doc
    .rect(tableStartX, tableStartY, 495, rows.length * rowHeight + 5)
    .stroke('#E5EBF2');

  rows.forEach((row, i) => {
    const y = tableStartY + i * rowHeight + 5;

    doc
      .rect(tableStartX, y - 5, 140, rowHeight)
      .fillAndStroke('#FFF3E0', '#E5EBF2');

    doc
      .font('Cairo-Bold')
      .fontSize(9)
      .fillColor('#B7791F')
      .text(row[0], tableStartX + 6, y, { width: 130 });

    doc
      .font('Cairo')
      .fontSize(10)
      .fillColor('#12304A')
      .text(row[1], tableStartX + 148, y, { width: 340 });
  });

  doc.y = tableStartY + rows.length * rowHeight + 15;
}
static _issuerTable(auth, doc) {
  const startY = doc.y;
  const rowHeight = 18;

  doc
    .font('Cairo-Bold')
    .fontSize(12)
    .fillColor('#12304A')
    .text('بيانات الجهة المُصدرة', 50, startY);

  doc.moveDown(0.5);

  const rows = [
    ['الجهة', auth.issuer_organization_name || '—'],
    ['الهاتف', auth.issuer_phone || '—'],
    ['البريد', auth.issuer_email || '—'],
    ['العنوان', auth.issuer_address || '—'],
  ];

  const tableStartY = doc.y;
  const tableStartX = 50;

  doc
    .rect(tableStartX, tableStartY, 495, rows.length * rowHeight + 5)
    .stroke('#E5EBF2');

  rows.forEach((row, i) => {
    const y = tableStartY + i * rowHeight + 5;

    doc
      .rect(tableStartX, y - 5, 120, rowHeight)
      .fillAndStroke('#F4F7FB', '#E5EBF2');

    doc
      .font('Cairo-Bold')
      .fontSize(9)
      .fillColor('#718096')
      .text(row[0], tableStartX + 6, y, { width: 110 });

    doc
      .font('Cairo')
      .fontSize(10)
      .fillColor('#12304A')
      .text(row[1], tableStartX + 128, y, { width: 360 });
  });

  doc.y = tableStartY + rows.length * rowHeight + 15;
}
  static generateAuthorization(auth, stream) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: auth.authorization_number,
      Author: 'نظام إسناد',
    },
  });

  doc.registerFont('Cairo', FONT_REGULAR);
  doc.registerFont('Cairo-Bold', FONT_BOLD);
  doc.pipe(stream);

  // ═══ الرأس ═══
  doc
    .font('Cairo-Bold')
    .fontSize(24)
    .fillColor('#12304A')
    .text('نظام إسناد', { align: 'center' });

  doc
    .moveDown(0.3)
    .font('Cairo')
    .fontSize(11)
    .fillColor('#718096')
    .text('منصة إدارة الخدمات والمعاملات', { align: 'center' });

  doc.moveDown(1);

  // خط فاصل
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#E5EBF2')
    .lineWidth(1)
    .stroke();

  doc.moveDown(1);

  // ═══ عنوان التصريح ═══
  doc
    .font('Cairo-Bold')
    .fontSize(22)
    .fillColor('#087E8B')
    .text('تصريح رسمي', { align: 'center' });

  doc.moveDown(1);

  // ═══ رقم التصريح ═══
  doc
    .font('Cairo-Bold')
    .fontSize(16)
    .fillColor('#12304A')
    .text(`رقم التصريح: ${auth.authorization_number}`, { align: 'center' });

  doc.moveDown(2);

  // ═══ المعلومات ═══
  const info = [
    ['النوع', auth.authorization_type_name || '—'],
    ['الجهة المُصدِرة', auth.issuer_organization_name || '—'],
    ['صادر بواسطة', auth.issued_by_user_name || '—'],
    ['تاريخ الإصدار', PdfService._fmtDateTime(auth.issued_at)],
    ['صالحة من', PdfService._fmtDateTime(auth.valid_from)],
    ['صالحة حتى', PdfService._fmtDateTime(auth.valid_until)],
    ['الحالة', PdfService._statusLabel(auth.status)],
  ];

  info.forEach(([label, value]) => {
    doc
      .font('Cairo-Bold')
      .fontSize(11)
      .fillColor('#718096')
      .text(`${label}:`, 50, doc.y, { width: 150 });

    doc
      .font('Cairo')
      .fontSize(12)
      .fillColor('#12304A')
      .text(value, 200, doc.y - 2, { width: 345 });

    doc.moveDown(0.5);
  });

  doc.moveDown(2);

  // ═══ الملاحظات ═══
  if (auth.notes) {
    doc
      .font('Cairo-Bold')
      .fontSize(13)
      .fillColor('#12304A')
      .text('ملاحظات');

    doc.moveDown(0.5);

    doc
      .font('Cairo')
      .fontSize(11)
      .fillColor('#4A5568')
      .text(auth.notes, { align: 'right' });

    doc.moveDown(2);
  }

  
PdfService._issuerTable(auth, doc);
doc.moveDown(1);
PdfService._recipientTable(auth, doc);
doc.moveDown(2);

  // ═══ التوقيع ═══
  doc.moveDown(4);

  doc
    .moveTo(400, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#12304A')
    .lineWidth(0.5)
    .stroke();

  doc
    .font('Cairo')
    .fontSize(10)
    .fillColor('#718096')
    .text('الختم الرسمي', 400, doc.y + 5, { width: 145, align: 'center' });

  // ═══ التذييل ═══
  doc
    .font('Cairo')
    .fontSize(8)
    .fillColor('#A0AEC0')
    .text(
      'هذا التصريح صادر إلكترونياً من نظام إسناد • لا يحتاج إلى ختم يدوي',
      50,
      780,
      { width: 495, align: 'center' },
    );

  doc.end();
}

static _statusLabel(status) {
  const map = {
    'draft': 'مسودة',
    'active': 'نشط',
    'expired': 'منتهي',
    'revoked': 'ملغى',
  };
  return map[status] || status;
}
  /**
   * توليد PDF لتقرير
   * @param {Object} report - بيانات التقرير (report + data)
   * @param {WritableStream} stream - الاستجابة (res)
   */
  static generateReport(report, stream) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: report.report_number,
        Author:( 'نظام إسناد'),
        Subject: report.report_type_name || 'تقرير',
      },
    });

    // الخطوط
    doc.registerFont('Cairo', FONT_REGULAR);
    doc.registerFont('Cairo-Bold', FONT_BOLD);

    // ربط بالـ stream
    doc.pipe(stream);

    // ─────── الرأس ───────
    PdfService._header(doc, report);

    // ─────── معلومات التقرير ───────
    PdfService._reportInfo(doc, report);

    // ─────── الملخص ───────
    if (report.data?.summary) {
      PdfService._summary(doc, report.data.summary);
    }

    // ─────── الجدول ───────
    if (report.data?.columns && report.data?.rows) {
      PdfService._table(doc, report.data.columns, report.data.rows);
    }

    // ─────── التذييل ───────
    PdfService._footer(doc);

    doc.end();
  }


// ══════════════════════════════════════════════
// الرأس
// ══════════════════════════════════════════════
static _header(doc, report) {
  const arabicLines = [
    'الجمهورية اليمنية',
    'وزارة الدفاع' ,
    'رئاسة الهيئة والأركان العامة',
    'دائرة الخدمات الطبية العسكرية',
    'المستشفى العسكري العام تعز',
  ];

  const englishLines = [
    'Republic of Yemen',
    'Ministry of Defense',
    'Presidency of the General Staff',
    'Military Medical Services Department',
    'General Military Hospital - Taiz',
  ];

  const pageWidth = doc.page.width;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const columnWidth = 175;
  const topY = doc.y;

  // ══════════════════════════════════════════════
  // الجهة اليسرى: English
  // ══════════════════════════════════════════════
  doc
    .font('Cairo-Bold')
    .fontSize(10)
    .fillColor('#12304A');

  englishLines.forEach((line, index) => {
    doc.text(line, margin, topY + index * 17, {
      width: columnWidth,
      align: 'left',
      lineBreak: false,
    });
  });

  // ══════════════════════════════════════════════
  // الجهة اليمنى: العربية
  // ══════════════════════════════════════════════
  doc
    .font('Cairo')
    .fontSize(9)
    .fillColor('#12304A');
arabicLines.forEach((line, index) => {
  doc
    .font('Cairo-Bold')
    .fontSize(12)
    .fillColor('#12304A')
    .text(
      formatArabicText(line),
      pageWidth - margin - columnWidth,
      topY + index * 17,
      {
        width: columnWidth,
        align: 'right',
        lineBreak: false,
      }
    );
});
  // ══════════════════════════════════════════════
  // الوسط: شعار النظام
  // ══════════════════════════════════════════════
  const centerX = margin + columnWidth;
  const centerWidth = contentWidth - columnWidth * 2;

  doc
    .font('Cairo-Bold')
    .fontSize(20)
    .fillColor('#12304A')
    .text(formatArabicText('نظام إسناد'), centerX, topY + 11, {
      width: centerWidth,
      align: 'center',
    });

  doc
    .font('Cairo')
    .fontSize(8)
    .fillColor('#718096')
    .text(formatArabicText('منصة إدارة الخدمات والمعاملات'), centerX, topY + 55, {
      width: centerWidth,
      align: 'center',
    });

  // ══════════════════════════════════════════════
  // الخط الفاصل أسفل الرأس
  // ══════════════════════════════════════════════
  const headerBottom = topY + 100;

  doc
    .moveTo(margin, headerBottom)
    .lineTo(pageWidth - margin, headerBottom)
    .strokeColor('#E5EBF2')
    .lineWidth(1)
    .stroke();

  doc.y = headerBottom + 20;
}



  // ══════════════════════════════════════════════
  // معلومات التقرير
  // ══════════════════════════════════════════════
  static _reportInfo(doc, report) {
    doc
      .font('Cairo-Bold')
      .fontSize(16)
      .fillColor('#12304A')
      .text(report.report_type_name || 'تقرير', { align: 'right' });

    doc.moveDown(0.5);

    const items = [
      { label:formatArabicText ('رقم التقرير'), value: report.report_number },
      { label: 'الجهة', value: formatArabicText(report.organization_name) || '—' },
      { label: formatArabicText('من تاريخ'), value: PdfService._fmtDate(report.period_from) },
      { label: formatArabicText('إلى تاريخ'), value: PdfService._fmtDate(report.period_to) },
      { label: formatArabicText('أنشئ في'), value: PdfService._fmtDateTime(report.generated_at) },
      { label: formatArabicText('بواسطة'), value: report.generated_by_name || '—' },
    ];

    const startY = doc.y;
    let colX = 300;

    doc.font('Cairo').fontSize(10);

    const rightX = 465;
const leftX = 250;

items.forEach((item, i) => {
  const x = i % 2 === 0 ? rightX : leftX;
  const y = startY + Math.floor(i / 2) * 22;

  doc
    .font('Cairo')
    .fontSize(10)
    .fillColor('#718096')
    .text(`${item.label}:`, x, y, {
      width: 80,
      align: 'right',
      lineBreak: false,
    });

  doc
    .font('Cairo')
    .fontSize(10)
    .fillColor('#12304A')
    .text(String(item.value ?? '—'), x - 165, y, {
      width: 155,
      align: 'right',
      lineBreak: false,
    });
});

    doc.moveDown(4);
  }

  // ══════════════════════════════════════════════
  // الملخص
  // ══════════════════════════════════════════════
  static _summary(doc, summary) {
    doc
      .font('Cairo-Bold')
      .fontSize(12)
      .fillColor('#12304A')
      .text('الملخص');
    doc.moveDown(0.3);

    const entries = Object.entries(summary);
    if (entries.length === 0) {
      doc.font('Cairo').fontSize(10).fillColor('#718096').text('لا يوجد ملخص');
      doc.moveDown(1);
      return;
    }

    // بطاقات بسيطة
    const cardWidth = 120;
    const cardHeight = 50;
    const gap = 10;
    const pageWidth = doc.page.width;
    const margin = 50;
    const startX = pageWidth - margin - cardWidth;
    const startY = doc.y;

    entries.forEach(([key, value], i) => {
      const x = startX - (i % 4) * (cardWidth + gap);
      const y = startY + Math.floor(i / 4) * (cardHeight + gap);

      doc
        .roundedRect(x, y, cardWidth, cardHeight, 6)
        .fillAndStroke('#F4F7FB', '#E5EBF2');

      doc
        .font('Cairo-Bold')
        .fontSize(16)
        .fillColor('#087E8B')
        .text(String(value), x + 10, y + 8, { width: cardWidth - 20, align: 'center' });

      doc
        .font('Cairo')
        .fontSize(9)
        .fillColor('#718096')
        .text(PdfService._humanize(key), x + 10, y + 30, {
          width: cardWidth - 20,
          align: 'center',
        });
    });

    doc.y = startY + Math.ceil(entries.length / 4) * (cardHeight + gap);
    doc.moveDown(1);
  }

  // ══════════════════════════════════════════════
  // الجدول
  // ══════════════════════════════════════════════
  static _table(doc, columns, rows) {
    if (rows.length === 0) {
      doc
        .font('Cairo')
        .fontSize(10)
        .fillColor('#718096')
        .text(formatArabicText('لا توجد بيانات'));
      return;
    }

    const tableX = 50;
    const tableWidth = 495;
    const rowHeight = 22;
    const headerHeight = 26;
    const colWidth = tableWidth / columns.length;
    const columnX = (i) => tableX + tableWidth - (i + 1) * colWidth;

    // ─────── Header ───────
    doc
      .rect(tableX, doc.y, tableWidth, headerHeight)
      .fill('#12304A');

    const headerY = doc.y;
    doc.font('Cairo-Bold').fontSize(9).fillColor('#FFFFFF');

    columns.forEach((col, i) => {
      doc.text(formatArabicText(col.label), columnX(i) + 4, headerY + 8, {
        width: colWidth - 8,
        align: 'right',
      });
    });

    doc.y = headerY + headerHeight;

    // ─────── Rows ───────
    rows.forEach((row, rowIdx) => {
      // صفحه جديدة إذا تجاوزنا الحد
      if (doc.y + rowHeight > 750) {
        doc.addPage();
        // أعد رسم الهيدر
        doc
          .rect(tableX, doc.y, tableWidth, headerHeight)
          .fill('#12304A');
        const newHeaderY = doc.y;
        doc.font('Cairo-Bold').fontSize(9).fillColor('#FFFFFF');
        columns.forEach((col, i) => {
          doc.text(col.label, columnX(i) + 4, newHeaderY + 8, {
            width: colWidth - 8,
            align: 'right',
          });
        });
        doc.y = newHeaderY + headerHeight;
      }

      const bg = rowIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc
        .rect(tableX, doc.y, tableWidth, rowHeight)
        .fill(bg)
        .strokeColor('#E5EBF2')
        .lineWidth(0.5)
        .stroke();

      const rowY = doc.y;
      doc.font('Cairo').fontSize(8).fillColor('#12304A');

      columns.forEach((col, i) => {
        const value = PdfService._formatCell(row[col.key]);
        doc.text(value, columnX(i) + 4, rowY + 7, {
          width: colWidth - 8,
          align: 'right',
          ellipsis: true,
        });
      });

      doc.y = rowY + rowHeight;
    });
  }

  // ══════════════════════════════════════════════
  // التذييل
  // ══════════════════════════════════════════════
  static _footer(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc
        .font('Cairo')
        .fontSize(8)
        .fillColor('#A0AEC0')
        .text(
          `نظام إسناد • صفحة ${i + 1} من ${range.count}`,
          50,
          800,
          { width: 495, align: 'center' },
        );
    }
  }

  // ══════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════
  static _fmtDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  static _fmtDateTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    return `${PdfService._fmtDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  static _formatCell(value) {
    if (value == null) return '—';
    if (value instanceof Date) return PdfService._fmtDate(value);
    const s = String(value);
    if (s.includes('T') && s.length >= 10) return s.split('T')[0];
    return s;
  }

  static _humanize(key) {
    const map = {
      total: 'الإجمالي',
      active: 'نشط',
      pending: 'قيد الانتظار',
      completed: 'مكتمل',
      open: 'مفتوحة',
      closed: 'مغلقة',
      new: 'جديد',
      preserved: 'محفوظ',
      handed_over: 'تم التسليم',
    };
    return map[key] || key;
  }
}

module.exports = PdfService;