// services/PdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'Cairo-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Cairo-Bold.ttf');

class PdfService {
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
        Author: 'نظام إسناد',
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
    // شعار
    doc
      .font('Cairo-Bold')
      .fontSize(20)
      .fillColor('#12304A')
      .text('نظام إسناد', { align: 'center' });

    doc
      .moveDown(0.3)
      .font('Cairo')
      .fontSize(10)
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
      { label: 'رقم التقرير', value: report.report_number },
      { label: 'الجهة', value: report.organization_name || '—' },
      { label: 'من تاريخ', value: PdfService._fmtDate(report.period_from) },
      { label: 'إلى تاريخ', value: PdfService._fmtDate(report.period_to) },
      { label: 'أنشئ في', value: PdfService._fmtDateTime(report.generated_at) },
      { label: 'بواسطة', value: report.generated_by_name || '—' },
    ];

    const startY = doc.y;
    let colX = 300;

    doc.font('Cairo').fontSize(10);

    items.forEach((item, i) => {
      const x = i % 2 === 0 ? colX : 50;
      const y = startY + Math.floor(i / 2) * 22;

      doc
        .fillColor('#718096')
        .text(`${item.label}:`, x, y, { width: 80 });

      doc
        .fillColor('#12304A')
        .text(item.value, x + 85, y, { width: 160 });
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
    const startX = 50;
    const startY = doc.y;

    entries.forEach(([key, value], i) => {
      const x = startX + (i % 4) * (cardWidth + gap);
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
        .text('لا توجد بيانات');
      return;
    }

    const tableX = 50;
    const tableWidth = 495;
    const rowHeight = 22;
    const headerHeight = 26;
    const colWidth = tableWidth / columns.length;

    // ─────── Header ───────
    doc
      .rect(tableX, doc.y, tableWidth, headerHeight)
      .fill('#12304A');

    const headerY = doc.y;
    doc.font('Cairo-Bold').fontSize(9).fillColor('#FFFFFF');

    columns.forEach((col, i) => {
      doc.text(col.label, tableX + i * colWidth + 4, headerY + 8, {
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
          doc.text(col.label, tableX + i * colWidth + 4, newHeaderY + 8, {
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
        doc.text(value, tableX + i * colWidth + 4, rowY + 7, {
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