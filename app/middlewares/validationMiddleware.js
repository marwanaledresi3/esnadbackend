const Joi = require('joi');
const { HTTP_STATUS } = require('../config/constants');

// مخططات التحقق من الصحة
const schemas = {
  login: Joi.object({
    username: Joi.string().required().messages({
      'string.empty': 'اسم المستخدم مطلوب',
      'any.required': 'اسم المستخدم مطلوب'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'كلمة المرور مطلوبة',
      'any.required': 'كلمة المرور مطلوبة'
    })
  }),

  userCreate: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')).required(),
    email: Joi.string().email().required(),
    full_name: Joi.string().required(),
    role: Joi.string().valid('Student', 'FacultyMember', 'Admin', 'Superadmin').required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/)
  }),

  userUpdate: Joi.object({
    email: Joi.string().email(),
    full_name: Joi.string(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/)
  }), 
   courseSchema : Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
    credits: Joi.number().integer().min(1).max(6),
    description: Joi.string().allow('')
  }),
  lectureSchema : Joi.object({
    course_id: Joi.number().integer().required(),
    department_id: Joi.number().integer().required(),
    level_id: Joi.number().integer().required(),
    room_id: Joi.number().integer().required(),
    day: Joi.string().valid('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday').required(),
    lecture_date: Joi.date().required(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    faculty_member_id: Joi.number().integer().required()
  }).options({ abortEarly: false }),
  attendanceSchema : Joi.object({
    student_id: Joi.number().integer().required(),
    lecture_id: Joi.number().integer().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    notes: Joi.string().allow('').optional()
  }),
  faceRegister: Joi.object({
    user_id: Joi.number().integer().required(),
    user_type: Joi.string().valid('student', 'instructor').required()
  })
};
const validateAttendance = (req, res, next) => {
  const { error } = attendanceSchema.validate(req.body);
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'بيانات الحضور غير صالحة',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};
const validateLecture = (req, res, next) => {
  const { error } = lectureSchema.validate(req.body);
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'بيانات المحاضرة غير صالحة',
      errors: error.details.map(d => ({
        message: d.message,
        field: d.context.key
      }))
    });
  }
  next();
};
const validateCourse = (req, res, next) => {
  const { error } = courseSchema.validate(req.body);
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'بيانات المادة غير صالحة',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};
// وسائط التحقق من الصحة
const validateLogin = (req, res, next) => {
  const { error } = schemas.login.validate(req.body);
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'بيانات الدخول غير صالحة',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};

const validateUserCreate = (req, res, next) => {
  const { error } = schemas.userCreate.validate(req.body);
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'بيانات المستخدم غير صالحة',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};

const validateUserUpdate = (req, res, next) => {
  const { error } = schemas.userUpdate.validate(req.body);
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'بيانات التحديث غير صالحة',
      errors: error.details.map(d => d.message)
    });
  }
  next();
};

module.exports = {
  validateLogin,
  validateUserCreate,
  validateUserUpdate,
  validateCourse,
  validateAttendance,
  validateLecture,
  schemas
};