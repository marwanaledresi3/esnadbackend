require('dotenv').config();
const app = require('./app/app');
const { pool } = require('./app/config/db');

const PORT = process.env.PORT || 5000;

// 1. اختبار والتحقق من الاتصال بقاعدة البيانات
async function testDbConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.');
    client.release();
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
    process.exit(1);
  }
}

// 2. تشغيل الخادم
async function startServer() {
  await testDbConnection();

  const server = app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل بنجاح على المنفذ: ${PORT}`);
    console.log(`🌐 بيئة التشغيل: ${process.env.NODE_ENV || 'development'}`);
  });

  // 3. إدارة حالات الإغلاق المفاجئ وتأمين الموارد (Graceful Shutdown)
  const shutdown = (signal) => {
    console.log(`\n⚠️ تم استقبال الإشارة ${signal}. جاري إغلاق الخادم بأمان...`);
    server.close(async () => {
      console.log('🔒 تم إغلاق جميع اتصال HTTP.');
      try {
        await pool.end();
        console.log('📦 تم إغلاق اتصالات قاعدة البيانات بنجاح.');
        process.exit(0);
      } catch (err) {
        console.error('❌ خطأ أثناء إغلاق قاعدة البيانات:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // التعامل مع الأخطاء التي لم يتم التقاطها (Unhandled Rejections)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception thrown:', error);
    process.exit(1);
  });
}

startServer();