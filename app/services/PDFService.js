const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');
const ApiError = require('../errors/ApiError');

class PDFService {
  // توليد وثيقة/إذن تسليم رسمي بصيغة PDF
  static async generateHandoverPermit(handoverData) {
    try {
      // 1. إنشاء مستند PDF جديد وتسجيل fontkit
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      const page = pdfDoc.addPage([595.28, 841.89]); // قياس A4 بالنقاط
      const { width, height } = page.getSize();

      // 2. تحميل الخط العربي المخصص
      const fontPath = path.join(__dirname, '../assets/fonts/IBMPlexSansArabic-Regular.ttf');
      if (!fs.existsSync(fontPath)) {
        throw ApiError.internal('ملف الخط العربي غير متوفر في المسار المحدد');
      }

      const fontBytes = fs.readFileSync(fontPath);
      const customFont = await pdfDoc.embedFont(fontBytes);

      // 3. رسم إطار الهيدر العادي والعنوان
      page.drawRectangle({
        x: 20,
        y: height - 100,
        width: width - 40,
        height: 80,
        color: rgb(0.95, 0.96, 0.98),
      });

      // رسم العناوين والنصوص الرسمية (القيم المحولة بأسلوب RTL)
      const title = 'إذن تسليم جثمان رسمي';
      page.drawText(title, {
        x: width / 2 - 80,
        y: height - 60,
        size: 20,
        font: customFont,
        color: rgb(0.1, 0.1, 0.3),
      });

      // 4. طباعة التفاصيل الموحدة
      let currentY = height - 140;
      const fontSize = 12;

      const details = [
        `رقم الملف/الحالة: ${handoverData.case_number || 'غير محدد'}`,
        `اسم المتوفى/الشخص: ${handoverData.full_name || 'مجهول الهوية'}`,
        `مستلم الجثمان: ${handoverData.receiver_name}`,
        `رقم هوية المستلم: ${handoverData.receiver_id_number}`,
        `صلة القرابة / الجهة: ${handoverData.receiver_relationship || 'جهة رسمية'}`,
        `تاريخ التسليم: ${new Date().toLocaleDateString('ar-EG')}`,
        `الموظف المسؤول: ${handoverData.officer_name || 'النظام'}`
      ];

      details.forEach((line) => {
        page.drawText(line, {
          x: width - 50 - customFont.widthOfTextAtSize(line, fontSize), // محاذاة لليمين RTL
          y: currentY,
          size: fontSize,
          font: customFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 30;
      });

      // 5. حقل التوقيعات والختم الرسمي
      page.drawLine({
        start: { x: 40, y: 120 },
        end: { x: width - 40, y: 120 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText('توقيع المستلم: ........................', {
        x: width - 220,
        y: 80,
        size: 11,
        font: customFont,
      });

      page.drawText('توقيع الموظف المختص: ........................', {
        x: 50,
        y: 80,
        size: 11,
        font: customFont,
      });

      // 6. حفظ المستند وتصدير الـ Buffer
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      throw ApiError.internal(`فشل في توليد تقرير الـ PDF: ${error.message}`);
    }
  }
}

module.exports = PDFService;