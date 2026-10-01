// config/db.js
// const { Pool } = require("pg");

// require('dotenv').config();
// const pool = new Pool({
//   host: process.env.DB_HOST || 'dpg-d22ov3i24d50c73aeggjg-a.oregon-postgres.render.com',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASS || '',
//   database: process.env.DB_NAME || 'medical_leave_system',
//   waitForConnections: true,
//   connectionLimit: 10,
//    keepAlive: true,
//   keepAliveInitialDelay: 300000,
//   queueLimit: 0,
//   ssl: {
//     rejectUnauthorized: false, // Render/Postgres يتطلب SSL
//   },
// });

// // Test the database connection
// (async () => {
//   try {
//     const client = await pool.connect();
//     console.log("✅ تم إنشاء اتصال بقاعدة بيانات PostgreSQL (Pool)");
//     const res = await client.query("SELECT NOW()");
//     console.log("📅 وقت السيرفر:", res.rows[0]);
//     client.release();
//   } catch (err) {
//     console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
//     process.exit(1);
//   }
// })();

// module.exports = {
//   pool,
// };



// // config/db.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = { pool };
