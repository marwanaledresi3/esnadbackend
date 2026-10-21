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
const permissionRoutes = require('./routes/permissionRoutes');
const rolePermissionRoutes = require('./routes/rolePermissionRoutes');
const roleRoutes = require('./routes/roleRoutes');
const authorizationRoutes = require('./routes/authorizationRoutes');
const caseRoutes = require('./routes/caseRoutes');
const caseSubResourceRoutes = require('./routes/caseSubResourceRoutes');
const bodyCaseRoutes = require('./routes/bodyCaseRoutes');
const lookupRoutes = require('./routes/lookupRoutes')
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const forensicRequestRoutes = require('./routes/forensicRequestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ambulanceMissionRoutes = require('./routes/ambulanceMissionRoutes');
const userRoutes = require('./routes/userRoutes');
const personRoutes = require('./routes/personRoutes');
const accountRequestRoutes = require('./routes/accountRequestRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const organizationMembershipRoutes = require('./routes/organizationMembershipRoutes');
const organizationLinkRoutes = require('./routes/organizationLinkRoutes');
const dataSharingRuleRoutes = require('./routes/dataSharingRuleRoutes');
const sharedRecordRoutes = require('./routes/sharedRecordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const sharingRoutes = require('./routes/sharingRoutes');
const transportMissionRoutes = require('./routes/transportMissionRoutes');
const vehicleDispatchRoutes = require('./routes/vehicleDispatchRoutes');
const hospitalCustodyRoutes = require('./routes/hospitalCustodyRoutes');
const bodyReleaseRoutes = require('./routes/bodyReleaseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const transportRequestRoutes = require('./routes/transportRequestRoutes');
const authorizationRecipientRoutes = require('./routes/authorizationRecipientRoutes');
const recipientRoutes = require('./routes/recipientRoutes');
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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/role-permissions', rolePermissionRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/authorizations', authorizationRoutes);
app.use('/api/v1/case-details', caseSubResourceRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/body-cases', bodyCaseRoutes);
app.use('/api/v1/lookups',lookupRoutes)
app.use('/api/v1/ambulances', ambulanceRoutes);
app.use('/api/v1/forensic-requests', forensicRequestRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/ambulance-missions', ambulanceMissionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/persons', personRoutes);
app.use('/api/v1/account-requests', accountRequestRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/memberships', organizationMembershipRoutes);
app.use('/api/v1/organization-links', organizationLinkRoutes);
app.use('/api/v1/sharing-rules', dataSharingRuleRoutes);
app.use('/api/v1/shared-records', sharedRecordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/sharing', sharingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/transport-requests', transportRequestRoutes);
app.use('/api/v1/missions', transportMissionRoutes);
app.use('/api/v1/vehicle-dispatches', vehicleDispatchRoutes);
app.use('/api/v1/hospital', hospitalCustodyRoutes);
app.use('/api/v1/body-releases', bodyReleaseRoutes);
app.use('/api/v1/documents', require('./routes/documentRoutes'));
app.use('/api/v1/body-handovers', require('./routes/bodyHandoverRoutes'));
app.use('/api/v1/body-release-orders', require('./routes/bodyReleaseOrderRoutes'));
app.use('/api/v1/vehicle-dispatch-orders', require('./routes/vehicleDispatchOrderRoutes'));
app.use('/api/v1/storage-locations', require('./routes/storageLocationRoutes'));
app.use('/api/v1/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/v1/death-records', require('./routes/deathRecordRoutes'));
app.use('/api/v1/case-disabilities', require('./routes/caseDisabilityRoutes'));
app.use('/api/v1/document-shares', require('./routes/documentShareRoutes'));
app.use('/api/v1/profile', require('./routes/profileRoutes'));
app.use('/api/v1/organization-settings', require('./routes/organizationSettingsRoutes'));
app.use('/api/v1/recipients', recipientRoutes);
app.use('/api/v1/recipients-link', authorizationRecipientRoutes);
app.use((req, res, next) => {
  next(ApiError.notFound(`المسار المطلـوب (${req.originalUrl}) غير موجود بالنظام`));
});

// 8. الميدلوير المركزي لمعالجة جميع الأخطاء
app.use(errorHandler);

module.exports = app;