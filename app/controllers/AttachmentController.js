const Attachment = require('../models/Attachment');
const { uploadToCloudinary } = require('../config/cloudinary');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class AttachmentController {
  static async uploadAttachment(req, res, next) {
    try {
      const { case_id, file_type } = req.body;

      if (!req.file) {
        throw ApiError.badRequest('يرجى اختيار ملف لرفعه');
      }

      // 1. الرفع المباشر إلى Cloudinary
      const cloudinaryRes = await uploadToCloudinary(req.file.path, `case_${case_id}`);

      // 2. تسجيل المرفق في قاعدة البيانات
      const attachment = await Attachment.create({
        case_id,
        file_name: req.file.originalname,
        file_url: cloudinaryRes.url,
        public_id: cloudinaryRes.public_id,
        file_type: file_type || 'GENERAL',
        uploaded_by_user_id: req.user.user_id
      });

      return apiResponse.created(res, 'تم رفع المرفق وتوثيقه بنجاح', attachment);
    } catch (error) {
      next(error);
    }
  }

  static async getCaseAttachments(req, res, next) {
    try {
      const { caseId } = req.params;
      const attachments = await Attachment.findByCaseId(caseId);
      return apiResponse.success(res, 'مرفقات الحالة', attachments);
    } catch (error) { next(error); }
  }
}

module.exports = AttachmentController;