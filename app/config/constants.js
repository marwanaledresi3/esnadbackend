module.exports = {
  // أدوار المستخدمين
  ROLES: {
    ADMIN: 'ADMIN',
    DISPATCHER: 'DISPATCHER',
    RECEPTIONIST: 'RECEPTIONIST',
    PARAMEDIC: 'PARAMEDIC',
    FORENSIC_OFFICER: 'FORENSIC_OFFICER',
    SUPERVISOR: 'SUPERVISOR'
  },

  // حالات البلاغات الميدانية
  INCIDENT_STATUS: {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CANCELLED: 'CANCELLED'
  },

  // مستويات خطورة البلاغ
  SEVERITY_LEVELS: {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },

  // حالات سيارات الإسعاف
  AMBULANCE_STATUS: {
    AVAILABLE: 'AVAILABLE',
    DISPATCHED: 'DISPATCHED',
    ON_SCENE: 'ON_SCENE',
    RETURNING: 'RETURNING',
    MAINTENANCE: 'MAINTENANCE'
  },

  // حالات المهمة الإسعافية
  DISPATCH_STATUS: {
    ASSIGNED: 'ASSIGNED',
    EN_ROUTE: 'EN_ROUTE',
    ON_SCENE: 'ON_SCENE',
    TRANSPORTING: 'TRANSPORTING',
    COMPLETED: 'COMPLETED'
  },

  // حالات الملفات/القضايا
  CASE_STATUS: {
    OPEN: 'OPEN',
    UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
    CLOSED: 'CLOSED',
    ARCHIVED: 'ARCHIVED'
  },

  // حالة التعرف على الهوية
  IDENTITY_STATUS: {
    KNOWN: 'KNOWN',
    UNKNOWN: 'UNKNOWN',
    PENDING_VERIFICATION: 'PENDING_VERIFICATION'
  },

  // حالة الجثمان داخل الثلاجة
  BODY_STATUS: {
    IN_MORTUARY: 'IN_MORTUARY',
    HANDED_OVER: 'HANDED_OVER',
    RELEASED_FOR_BURIAL: 'RELEASED_FOR_BURIAL',
    TRANSFERRED: 'TRANSFERRED'
  },

  // حالات طلبات الفحص الشرعي
  FORENSIC_STATUS: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
  }
};

// ============================================================
// «إسناد» - Constants Configuration
// File: config/constants.js
// ============================================================

export const Roles = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  AXIS_ADMIN: 'AXIS_ADMIN',
  MEDICAL_USER: 'MEDICAL_USER',
  ADMIN_USER: 'ADMIN_USER',
  REPORT_USER: 'REPORT_USER',
};

export const Permissions = {
  CASE_VIEW: 'CASE_VIEW',
  CASE_CREATE: 'CASE_CREATE',
  CASE_UPDATE: 'CASE_UPDATE',
  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_CREATE: 'REPORT_CREATE',
  REPORT_EXPORT: 'REPORT_EXPORT',
  BODY_VIEW: 'BODY_VIEW',
  BODY_CREATE: 'BODY_CREATE',
  BODY_HANDOVER: 'BODY_HANDOVER',
  FORENSIC_VIEW: 'FORENSIC_VIEW',
  FORENSIC_CREATE: 'FORENSIC_CREATE',
  TRANSPORT_VIEW: 'TRANSPORT_VIEW',
  TRANSPORT_CREATE: 'TRANSPORT_CREATE',
  USER_APPROVE: 'USER_APPROVE',
  USER_SUSPEND: 'USER_SUSPEND',
  SHARING_CREATE: 'SHARING_CREATE',
  SHARING_APPROVE: 'SHARING_APPROVE',
  DOCUMENT_VIEW: 'DOCUMENT_VIEW',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_SHARE: 'DOCUMENT_SHARE',
};

export const RolePermissionsMap = {
  [Roles.SYSTEM_ADMIN]: Object.values(Permissions),
  [Roles.HOSPITAL_ADMIN]: [
    Permissions.CASE_VIEW,
    Permissions.CASE_CREATE,
    Permissions.CASE_UPDATE,
    Permissions.REPORT_VIEW,
    Permissions.REPORT_CREATE,
    Permissions.REPORT_EXPORT,
    Permissions.BODY_VIEW,
    Permissions.BODY_CREATE,
    Permissions.BODY_HANDOVER,
    Permissions.TRANSPORT_VIEW,
    Permissions.TRANSPORT_CREATE,
    Permissions.USER_APPROVE,
    Permissions.USER_SUSPEND,
    Permissions.SHARING_CREATE,
    Permissions.DOCUMENT_VIEW,
    Permissions.DOCUMENT_UPLOAD,
    Permissions.DOCUMENT_SHARE,
  ],
  [Roles.AXIS_ADMIN]: [
    Permissions.CASE_VIEW,
    Permissions.TRANSPORT_VIEW,
    Permissions.TRANSPORT_CREATE,
    Permissions.SHARING_CREATE,
    Permissions.SHARING_APPROVE,
    Permissions.REPORT_VIEW,
    Permissions.REPORT_CREATE,
    Permissions.REPORT_EXPORT,
    Permissions.DOCUMENT_VIEW,
    Permissions.DOCUMENT_SHARE,
  ],
  [Roles.MEDICAL_USER]: [
    Permissions.CASE_VIEW,
    Permissions.CASE_CREATE,
    Permissions.CASE_UPDATE,
    Permissions.REPORT_VIEW,
    Permissions.FORENSIC_VIEW,
    Permissions.FORENSIC_CREATE,
    Permissions.DOCUMENT_VIEW,
    Permissions.DOCUMENT_UPLOAD,
  ],
  [Roles.ADMIN_USER]: [
    Permissions.BODY_VIEW,
    Permissions.BODY_CREATE,
    Permissions.BODY_HANDOVER,
    Permissions.CASE_VIEW,
    Permissions.REPORT_VIEW,
    Permissions.DOCUMENT_VIEW,
    Permissions.DOCUMENT_UPLOAD,
  ],
  [Roles.REPORT_USER]: [
    Permissions.REPORT_VIEW,
    Permissions.REPORT_EXPORT,
    Permissions.CASE_VIEW,
  ],
};
