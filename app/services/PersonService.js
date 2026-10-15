// services/PersonService.js
const Person = require('../models/Person');

class PersonService {
  static async list(filters) {
    return await Person.getAll(filters);
  }

  static async getById(id) {
    return await Person.getById(id);
  }

  static async create(data, userId) {
    // تحقق من عدم تكرار national_id
    if (data.national_id) {
      const existing = await Person.getByNationalId(data.national_id);
      if (existing) {
        const err = new Error(
          `الرقم الوطني ${data.national_id} مسجّل مسبقاً للشخص: ${existing.full_name || existing.person_number}`,
        );
        err.statusCode = 409;
        throw err;
      }
    }

    return await Person.create({
      ...data,
      created_by: userId,
    });
  }

  static async update(id, data, userId) {
    return await Person.update(id, {
      ...data,
      updated_by: userId,
    });
  }

  static async delete(id) {
    return await Person.delete(id);
  }

  static async count() {
    return await Person.count();
  }
}

module.exports = PersonService;