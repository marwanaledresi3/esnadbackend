// seeders/lookupSeeder.js
const db = require('../config/db');

const seedData = {
  case_event_types: [
    { code: 'ARRIVAL', name: 'وصول' },
    { code: 'ADMISSION', name: 'إدخال' },
    { code: 'DIAGNOSIS', name: 'تشخيص' },
    { code: 'OPERATION', name: 'عملية جراحية' },
    { code: 'TRANSFER', name: 'نقل' },
    { code: 'DISCHARGE', name: 'خروج' },
    { code: 'DEATH', name: 'وفاة' },
    { code: 'FORENSIC_REQUEST', name: 'طلب طب شرعي' },
    { code: 'FORENSIC_EXAM', name: 'فحص طب شرعي' },
    { code: 'HANDOVER_AUTHORIZED', name: 'تصريح تسليم' },
    { code: 'HANDOVER', name: 'تسليم جثمان' },
    { code: 'TRANSPORT_REQUEST', name: 'طلب نقل' },
    { code: 'TRANSPORT_COMPLETED', name: 'إتمام نقل' },
    { code: 'IDENTITY_UPDATED', name: 'تحديث الهوية' },
    { code: 'DOCUMENT_ADDED', name: 'إضافة وثيقة' },
  ],
  authorization_types: [
    { code: 'FORENSIC_EXAM', name: 'تصريح فحص طب شرعي' },
    { code: 'BODY_HANDOVER', name: 'تصريح تسليم جثمان' },
    { code: 'BODY_TRANSPORT', name: 'تصريح نقل جثمان' },
    { code: 'OTHER', name: 'تصريح آخر' },
  ],
  document_types: [
    { code: 'OFFICIAL_LETTER', name: 'خطاب رسمي' },
    { code: 'AUTHORIZATION', name: 'تصريح' },
    { code: 'FORENSIC_REPORT', name: 'تقرير طب شرعي' },
    { code: 'HANDOVER_RECEIPT', name: 'إيصال تسليم' },
    { code: 'MEDICAL_REPORT', name: 'تقرير طبي' },
    { code: 'IDENTITY_DOCUMENT', name: 'وثيقة إثبات شخصية' },
    { code: 'OTHER', name: 'وثيقة أخرى' },
  ]
};

async function seedLookups() {
  try {
    for (const [table, items] of Object.entries(seedData)) {
      for (const item of items) {
        await db.query(
          `INSERT INTO ${table} (code, name, status) 
           VALUES ($1, $2, 'active') 
           ON CONFLICT (code) DO NOTHING`,
          [item.code, item.name]
        );
      }
    }
    console.log('✅ تم إدخال البيانات المرجعية الأساسية بنجاح.');
  } catch (error) {
    console.error('❌ خطأ أثناء تعبئة البيانات المرجعية:', error);
  }
}

module.exports = seedLookups;