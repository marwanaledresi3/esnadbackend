const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * رفع ملف/صورة إلى Cloudinary
 * @param {string} filePath - مسار الملف المحلي المؤقت
 * @param {string} folder - اسم المجلد داخل Cloudinary (مثلاً: 'unidentified_persons')
 */
const uploadToCloudinary = async (filePath, folder = 'general') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `mortuary_system/${folder}`,
      resource_type: 'auto'
    });
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    throw new Error(`فشل رفع الملف إلى Cloudinary: ${error.message}`);
  }
};

/**
 * حذف ملف من Cloudinary بواسطة public_id
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`فشل حذف الملف من Cloudinary: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};