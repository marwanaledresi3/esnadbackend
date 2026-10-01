const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// استيراد الميدلوير الموحد ومعالجة الأخطاء
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./errors/ApiError');
console.log("تم استيراد الميدلوير بنجاح");
// استيراد مسارات وحدات النظام (System Routes)
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const bodyRoutes = require('./routes/bodyRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const forensicRoutes = require('./routes/forensicRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ambulanceMissionRoutes = require('./routes/ambulanceMissionRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();

// 1. إعدادات الأمان الأساسية
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// 2. تحديد معدل الطلبات لحماية الخادم من هجمات DOS (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 300, // حد أقصى 300 طلب لكل IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح به من الطلبات، يرجى المحاولة لاحقاً'
  }
});
app.use('/api', limiter);

// 3. تحليل جسم الطلبات (Parsing Body Data)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. مجلد المرفقات والملفات الستاتيكية (Static Uploads Directory)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. فحص صحة الخادم (Health Check Endpoint)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'الخادم يعمل بكفاءة عالية',
    timestamp: new Date().toISOString()
  });
});

// 6. تسجيل مسارات النظام (API Routes Routing)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/bodies', bodyRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/ambulances', ambulanceRoutes);
app.use('/api/v1/forensics', forensicRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/ambulance-missions', ambulanceMissionRoutes);
app.use('/api/v1/departments', departmentRoutes);

// 7. التقاط المسارات غير المعروفة (404 Not Found Handler)
app.use((req, res, next) => {
  next(ApiError.notFound(`المسار المطلـوب (${req.originalUrl}) غير موجود بالنظام`));
});

// 8. الميدلوير المركزي لمعالجة جميع الأخطاء
app.use(errorHandler);

module.exports = app;