const nodemailer = require('nodemailer');
const { smtpConfig } = require('../config/email');
const logger = require('./logger');

class EmailUtils {
  static transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password
    }
  });

  // إرسال بريد إلكتروني
  static async sendEmail(to, subject, text, html = null) {
    try {
      if (!smtpConfig.enabled) {
        logger.warn('إرسال البريد الإلكتروني معطل في الإعدادات');
        return false;
      }

      const mailOptions = {
        from: `"نظام الحضور" <${smtpConfig.from}>`,
        to,
        subject,
        text,
        html: html || text
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`تم إرسال البريد إلى ${to}: ${info.messageId}`);
      return true;
    } catch (err) {
      logger.error(`فشل في إرسال البريد إلى ${to}: ${err.message}`);
      return false;
    }
  }

  // قالب إشعار الحضور
  static getAttendanceTemplate(studentName, courseName, date, status) {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>إشعار حضور</h2>
        <p>السادة أولياء الأمور،</p>
        <p>نحيطكم علماً بأن الطالب/ة <strong>${studentName}</strong></p>
        <p>حالة الحضور لمادة <strong>${courseName}</strong> بتاريخ ${date}:</p>
        <p style="font-size: 1.2em; color: ${status === 'present' ? 'green' : 'red'};">
          <strong>${status === 'present' ? 'حاضر' : 'غائب'}</strong>
        </p>
        <p>مع تحيات،</p>
        <p>إدارة النظام</p>
      </div>
    `;
  }
}

module.exports = EmailUtils;