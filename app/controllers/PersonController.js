const Person = require('../models/Person');
const Case = require('../models/Case');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class PersonController {
  // 1. البحث عن شخص برقم الهوية أو الرقم الموحد
  static async getPersonByIdentification(req, res, next) {
    try {
      const { search } = req.query; // يمكن أن يكون national_id أو person_number

      if (!search) {
        throw ApiError.badRequest('يرجى تقديم رقم الهوية أو الرقم الموحد للبحث');
      }

      const query = `
        SELECT p.*, c.case_id, c.case_number, c.current_status
        FROM persons p
        LEFT JOIN cases c ON p.person_id = c.person_id
        WHERE p.national_id = $1 OR p.person_number = $1
      `;
      
      const { pool } = require('../config/db');
      const result = await pool.query(query, [search]);

      if (result.rows.length === 0) {
        throw ApiError.notFound('لم يتم العثور على الشخص المطلوبة بياناته');
      }

      return apiResponse.success(res, 'تم العثور على بيانات الشخص بنجاح', result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  // 2. تحديث هوية شخص (تثبيت الهوية عند التعرف على مجهول)
  static async identifyPerson(req, res, next) {
    try {
      const { personId } = req.params;
      const { full_name, national_id, age } = req.body;

      if (!full_name || !national_id) {
        throw ApiError.badRequest('الاسم الكامل ورقم الهوية الوطنية مطلوبة لإنهاء مجهولية الشخص');
      }

      // 1. تحديث بيانات الشخص
      const updatedPerson = await Person.updateIdentity(personId, {
        full_name,
        national_id,
        identity_status: 'KNOWN'
      });

      if (!updatedPerson) {
        throw ApiError.notFound('سجل الشخص غير موجود');
      }

      // 2. توثيق حدث التعرف في السجل الزمني (Timeline) للحالة المرتبطة
      const caseQuery = `SELECT case_id FROM cases WHERE person_id = $1`;
      const { pool } = require('../config/db');
      const caseRes = await pool.query(caseQuery, [personId]);

      if (caseRes.rows.length > 0) {
        const caseId = caseRes.rows[0].case_id;
        await Case.addEvent({
          case_id: caseId,
          event_type: 'IDENTITY_VERIFIED',
          description: `تم التعرف على هوية الشخص وتثبيت الاسم: ${full_name} - الهوية: ${national_id}`,
          facility_id: req.user.organization_id,
          actor_user_id: req.user.user_id,
          event_metadata: { previous_status: 'UNKNOWN', new_status: 'KNOWN' }
        });
      }

      return apiResponse.success(res, 'تم تحديث هوية الشخص وتوثيق الإجراء بنجاح', updatedPerson);
    } catch (error) {
      next(error);
    }
  }

  // 3. عرض قائمة المجهولين (Unidentified Persons) مع تصفية الفلاتر
  static async getUnidentifiedPersons(req, res, next) {
    try {
      const { gender, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT p.*, c.case_id, c.case_number, c.created_at AS case_date
        FROM persons p
        JOIN cases c ON p.person_id = c.person_id
        WHERE p.identity_status = 'UNKNOWN'
      `;
      const values = [];

      if (gender) {
        values.push(gender);
        query += ` AND p.gender = $${values.length}`;
      }

      values.push(limit, offset);
      query += ` ORDER BY p.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;

      const { pool } = require('../config/db');
      const result = await pool.query(query, values);

      return apiResponse.success(res, 'قائمة الأشخاص مجهولي الهوية', result.rows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PersonController;