const ExcelJS = require('exceljs');

const { pool } = require('../config/db');
class ExcelService {
/**
 * دالة تصدير قائمة المصابين إلى ملف Excel
 */
static async  exportInjuredCasesToExcel(req, res) {
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
      WHERE c.case_type = 'INJURED' -- أو حسب المسمى المستخدم لنوع المصابين
      ORDER BY c.arrival_datetime DESC;
    `;

    const { rows } = await pool.query(query);

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
}
module.exports = ExcelService ;