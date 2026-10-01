/**
 * يولد رقم طلب فريدًا بناءً على الوقت الحالي ورقم عشوائي.
 * @param {string} prefix - البادئة التي سيبدأ بها الرقم (e.g., 'LR' for Leave Request).
 * @returns {string} رقم طلب فريد (e.g., 'LR-1662754800123').
 */
const generateRequestNumber = (prefix = 'PSL') => {
  // أول أربعة أرقام ثابتة
  const start = '2605';

  // توليد 7 أرقام عشوائية
  const randomDigits = Math.floor(Math.random() * 1e7)
    .toString()
    .padStart(7, '0');

  // دمج البادئة والأرقام
  return `${prefix}${start}${randomDigits}`;
}
const generateRequestNumberGSL = (prefix = 'GSL') => {
  // أول أربعة أرقام ثابتة
  const start = '2604';

  // توليد 7 أرقام عشوائية
  const randomDigits = Math.floor(Math.random() * 1e7)
    .toString()
    .padStart(7, '0');

  // دمج البادئة والأرقام
  return `${prefix}${start}${randomDigits}`;
}


// يمكنك إضافة دوال توليد أخرى هنا إذا احتجت
// const generateReportNumber = (prefix = 'REP') => { ... };

module.exports = { generateRequestNumber, generateRequestNumberGSL };