require('dotenv').config();
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { InternalServerError, BadRequestError } = require('../errors/ApiError');

// تهيئة خيارات البريد الإلكتروني مع قيم افتراضية آمنة
const emailConfig = {
  // الإعدادات العامة
  defaultProvider: process.env.EMAIL_PROVIDER || 'smtp',
  sender: {
    name: process.env.EMAIL_SENDER_NAME || 'نظام الإجازات الطبية',
    email: process.env.EMAIL_FROM || process.env.EMAIL_SENDER_EMAIL || 'no-reply@medical-leave.com'
  },

  // إعدادات SMTP مع دعم متعدد لمزودي الخدمة
  smtp: {
    host: process.env.SMTP_HOST || 
          (process.env.EMAIL_SERVICE === 'gmail' ? 'smtp.gmail.com' : 'smtp.mailtrap.io'),
    port: parseInt(process.env.SMTP_PORT) || 
          (process.env.EMAIL_SERVICE === 'gmail' ? 587 : 2525),
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD
    },
    // إعدادات إضافية لتحسين الموثوقية
    pool: true,
    connectionTimeout: 10000, // 10 ثواني
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  },

  // القوالب البريدية
  templates: {
    ReportleaveSubmitted: {
      subject: 'تأكيد انشاء إجازة رقم #{requestNumber}',
      text: `عزيزي/عزيزتي {patientName},\n\nنؤكد انشاء الإجازة الخاصة بك رقم #{requestNumber} من تاريخ {startDate} إلى {endDate}.\n\nسيتم مراجعته قريبًا.\n\nشكرًا لك.`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>تأكيد انشاء إجازة</h2>
          <p>عزيزي/عزيزتي <strong>{patientName}</strong>,</p>
          <p>نؤكد انشاء الإجازة الخاصة بك رقم <strong>#{requestNumber}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>نوع الإجازة:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{leaveType}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>من تاريخ:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{startDate}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>إلى تاريخ:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{endDate}</td></tr>
          </table>
          <p>يرجى زيارة الموقع لمراجعة البيانات وإعلامنا في أي خطأ.</p>
          <p>شكرًا لك،<br><strong>إدارة الموارد البشرية</strong></p>
        </div>
      `
    },
    ReportleaveStatusUpdated: {
      subject: 'تحديث بخصوص إجازتك رقم #{requestNumber}',
      text: `عزيزي/عزيزتي {patientName},\n\nتم تحديث حالة إجازتك رقم #{requestNumber} إلى: {status}.\n\n{additionalInfo}\n\nشكرًا لك.`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>تحديث حالة الإجازة</h2>
          <p>عزيزي/عزيزتي <strong>{patientName}</strong>,</p>
          <p>تم تحديث حالة إجازتك رقم <strong>#{requestNumber}</strong> إلى: <strong>{status}</strong>.</p>
          <p>{additionalInfo}</p>
          <p>شكرًا لك،<br><strong>إدارة الموارد البشرية</strong></p>
        </div>
      `
    },
    adminNewRequestNotification: {
      subject: 'طلب إجازة جديد بحاجة للمراجعة من الموظف: {employeeName}',
      text: `مرحبًا،\n\nيوجد طلب إجازة جديد من الموظف {employeeName} (رقم الطلب: #{requestNumber}) بانتظار المراجعة.\n\nيرجى زيارة لوحة التحكم لاتخاذ الإجراء اللازم.`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>طلب إجازة جديد</h2>
          <p>يوجد طلب إجازة جديد بانتظار المراجعة:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>الموظف:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{employeeName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>رقم الطلب:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">#{requestNumber}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>نوع الإجازة:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{leaveType}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>الفترة:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">من {startDate} إلى {endDate}</td></tr>
          </table>
          <p>يرجى زيارة لوحة التحكم لاتخاذ الإجراء اللازم.</p>
        </div>
      `
    }
  }
};

// التحقق من صحة الإعدادات
function validateEmailConfig() {
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.warn(`إعدادات البريد الإلكتروني ناقصة: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
}

// إنشاء وسيلة إرسال البريد
function createTransporter(provider = emailConfig.defaultProvider) {
  try {
    const isConfigValid = validateEmailConfig();
    if (!isConfigValid) {
      throw new Error('إعدادات البريد الإلكتروني غير صحيحة');
    }

    let transporterConfig;

    switch (provider.toLowerCase()) {
      case 'gmail':
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        };
        break;

      case 'smtp':
      default:
        transporterConfig = emailConfig.smtp;
        break;
    }

    const transporter = nodemailer.createTransport(transporterConfig);
    
    // التحقق من اتصال البريد
    transporter.verify(function(error, success) {
      if (error) {
        logger.error('فشل في الاتصال بخادم البريد:', error);
      } else {
        logger.info('اتصال خادم البريد جاهز');
      }
    });

    return transporter;

  } catch (error) {
    logger.error('فشل في إنشاء وسيلة إرسال البريد:', error);
    throw new InternalServerError('تعذر تهيئة خدمة البريد الإلكتروني');
  }
}

// خدمة إرسال البريد الإلكتروني
const EmailService = {
  /**
   * إرسال بريد إلكتروني
   */
  async sendEmail({ to, subject, text, html, attachments = [] }, provider = emailConfig.defaultProvider) {
    try {
      // التحقق من صحة عنوان البريد
      if (!to || !to.includes('@')) {
        throw new BadRequestError('عنوان البريد الإلكتروني غير صحيح');
      }

      const transporter = createTransporter(provider);
      
      const mailOptions = {
        from: `"${emailConfig.sender.name}" <${emailConfig.sender.email}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        attachments,
        // إعدادات إضافية لتحسين التسليم
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'Medical Leave System'
        }
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`تم إرسال البريد بنجاح إلى ${to}: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };

    } catch (error) {
      logger.error(`فشل إرسال البريد إلى ${to}:`, error);
      
      if (error.code === 'EAUTH') {
        throw new InternalServerError('مشكلة في مصادقة البريد الإلكتروني');
      } else if (error.code === 'ECONNECTION') {
        throw new InternalServerError('تعذر الاتصال بخادم البريد');
      }
      
      throw new InternalServerError('فشل إرسال البريد الإلكتروني');
    }
  },

  /**
   * إرسال بريد باستخدام قالب
   */
  async sendTemplate(templateName, data, to, provider = emailConfig.defaultProvider) {
    try {
      const template = emailConfig.templates[templateName];
      if (!template) {
        throw new BadRequestError('قالب البريد غير موجود');
      }

      let { subject, text, html } = template;

      // استبدال العناصر النائبة بالبيانات الفعلية
      const replacePlaceholders = (content) => {
        if (!content) return content;
        return content.replace(/{(\w+)}/g, (match, key) => {
          return data[key] !== undefined ? data[key] : match;
        });
      };

      subject = replacePlaceholders(subject);
      text = replacePlaceholders(text);
      html = replacePlaceholders(html);

      return await this.sendEmail({ 
        to, 
        subject, 
        text, 
        html 
      }, provider);

    } catch (error) {
      logger.error(`فشل إرسال القالب ${templateName}:`, error);
      throw error;
    }
  },

  /**
   * إرسال بريد تجريبي للتحقق من الإعدادات
   */
  async sendTestEmail(to) {
    return this.sendEmail({
      to,
      subject: 'بريد تجريبي - نظام الإجازات الطبية',
      text: 'هذا بريد تجريبي للتحقق من إعدادات البريد الإلكتروني.',
      html: '<h2>بريد تجريبي</h2><p>تم إعداد خدمة البريد الإلكتروني بنجاح.</p>'
    });
  }
};

module.exports = EmailService;