const ExcelJS = require('exceljs');

const { pool } = require('../config/db');
class ExcelService {
/**
 * دالة تصدير قائمة المصابين إلى ملف Excel
 */
static async  exportInjuredCasesToExcel(req, res) {
   const sourceOrgId = req.currentOrganizationId;
   if (!sourceOrgId) {
        return res.status(409).json({
          success: false,
          message: 'معرف الجهة مطلوب   ',
        });
      }
  try {
    // 1. استعلام الجلب من قاعدة البيانات للحالات المخزنة
    const query = `
      SELECT 
        c.case_number,
        p.full_name,
        p.national_id,
        p.gender,
        p.phone,
        c.case_status,
        c.priority,
        c.arrival_datetime,
        c.current_location,
        org.name AS hospital_name,
        c.notes
      FROM cases c
      LEFT JOIN persons p ON c.person_id = p.id
      LEFT JOIN organizations org ON c.organization_id = org.id
      WHERE c.organization_id = $1
      ORDER BY c.arrival_datetime DESC;
    `;

    const { rows } = await pool.query(query,[sourceOrgId]);

    // 2. إنشاء كتاب عمل ورقة جديدة
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('سجل المصابين', {
      views: [{ rightToLeft: true }] // دعم الاتجاه من اليمين إلى اليسار
    });

    // 3. تعريف الأعمدة
    worksheet.columns = [
      { header: 'رقم الحالة', key: 'case_number', width: 18 },
      { header: 'الاسم الكامل', key: 'full_name', width: 25 },
      { header: 'الرقم الوطني / الهوية', key: 'national_id', width: 20 },
      { header: 'الجنس', key: 'gender', width: 12 },
      { header: 'رقم الهاتف', key: 'phone', width: 15 },
      { header: 'حالة الملف', key: 'case_status', width: 15 },
      { header: 'الأولوية', key: 'priority', width: 12 },
      { header: 'تاريخ ووقت الوصول', key: 'arrival_datetime', width: 22 },
      { header: 'الموقع الحالي', key: 'current_location', width: 20 },
      { header: 'المستشفى / الجهة', key: 'hospital_name', width: 25 },
      { header: 'ملاحظات', key: 'notes', width: 30 }
    ];

    // 4. تنسيق الصف الهيدر (Header Styling)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F4E79' } // لون أزرق داكن احترافي
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // 5. إضافة البيانات وتنسيق الصفوف
    rows.forEach((row, index) => {
      const addedRow = worksheet.addRow({
        case_number: row.case_number || '-',
        full_name: row.full_name || 'مجهول الهوية',
        national_id: row.national_id || '-',
        gender: row.gender === 'male' ? 'ذكر' : row.gender === 'female' ? 'أنثى' : '-',
        phone: row.phone || '-',
        case_status: row.case_status || '-',
        priority: row.priority || '-',
        arrival_datetime: row.arrival_datetime 
          ? new Date(row.arrival_datetime).toLocaleString('ar-YE') 
          : '-',
        current_location: row.current_location || '-',
        hospital_name: row.hospital_name || '-',
        notes: row.notes || '-'
      });

      // محاذاة البيانات بمنتصف الخلايا
      addedRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // إعطاء لون خلفية تبادلي (Zebra Striping)
      if (index % 2 === 1) {
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F4F7' }
        };
      }
    });

    // 6. ضبط الترويسة واستجابة الملف (Express Response)
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=injured_cases_${Date.now()}.xlsx`
    );

    // 7. كتابة الملف وإرساله للحريف
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting injured cases:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تصدير ملف الإكسل' });
  }
}
 static async generate({
    title,
    columns,
    rows,
    stream,
    metadata = {},
  }) {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'نظام إسناد';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title || 'Report', {
      views: [{ rightToLeft: true }],
    });

    // ══════════════════════════════════════════════
    // 1. الرأس (الترويسة)
    // ══════════════════════════════════════════════
    let rowIndex = 1;

    // اسم الجهة
    if (metadata.organization) {
      sheet.mergeCells(`A${rowIndex}:${String.fromCharCode(64 + columns.length)}${rowIndex}`);
      const cell = sheet.getCell(`A${rowIndex}`);
      cell.value = metadata.organization;
      cell.font = { bold: true, size: 14, color: { argb: 'FF12304A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      rowIndex++;
    }

    // عنوان التقرير
    sheet.mergeCells(`A${rowIndex}:${String.fromCharCode(64 + columns.length)}${rowIndex}`);
    const titleCell = sheet.getCell(`A${rowIndex}`);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF087E8B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    rowIndex++;

    // معلومات إضافية
    if (metadata.user || metadata.generated_at) {
      sheet.mergeCells(`A${rowIndex}:${String.fromCharCode(64 + columns.length)}${rowIndex}`);
      const infoCell = sheet.getCell(`A${rowIndex}`);
      const infoParts = [];
      if (metadata.user) infoParts.push(`بواسطة: ${metadata.user}`);
      if (metadata.generated_at) infoParts.push(`التاريخ: ${metadata.generated_at}`);
      infoCell.value = infoParts.join('  |  ');
      infoCell.font = { size: 10, color: { argb: 'FF718096' } };
      infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      rowIndex++;
    }

    // سطر فارغ
    rowIndex++;

    // ══════════════════════════════════════════════
    // 2. رأس الجدول
    // ══════════════════════════════════════════════
    const headerRowIndex = rowIndex;
    const headerRow = sheet.getRow(headerRowIndex);

    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = {
        bold: true,
        size: 11,
        color: { argb: 'FFFFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF12304A' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF12304A' } },
        bottom: { style: 'thin', color: { argb: 'FF12304A' } },
        left: { style: 'thin', color: { argb: 'FF12304A' } },
        right: { style: 'thin', color: { argb: 'FF12304A' } },
      };
    });

    headerRow.height = 30;
    rowIndex++;

    // ══════════════════════════════════════════════
    // 3. البيانات
    // ══════════════════════════════════════════════
    rows.forEach((row, i) => {
      const dataRow = sheet.getRow(rowIndex);
      const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF4F7FB';

      columns.forEach((col, j) => {
        const cell = dataRow.getCell(j + 1);
        cell.value = row[col.key] != null ? String(row[col.key]) : '—';
        cell.font = { size: 10, color: { argb: 'FF12304A' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5EBF2' } },
          bottom: { style: 'thin', color: { argb: 'FFE5EBF2' } },
          left: { style: 'thin', color: { argb: 'FFE5EBF2' } },
          right: { style: 'thin', color: { argb: 'FFE5EBF2' } },
        };
      });

      dataRow.height = 22;
      rowIndex++;
    });

    // ══════════════════════════════════════════════
    // 4. عرض الأعمدة
    // ══════════════════════════════════════════════
    columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width || 20;
    });

    // ══════════════════════════════════════════════
    // 5. تجميد الصف العلوي
    // ══════════════════════════════════════════════
    sheet.views = [
      {
        state: 'frozen',
        ySplit: headerRowIndex,
        rightToLeft: true,
      },
    ];

    // ══════════════════════════════════════════════
    // 6. حفظ
    // ══════════════════════════════════════════════
    await workbook.xlsx.write(stream);
  }
}
module.exports = ExcelService ;
