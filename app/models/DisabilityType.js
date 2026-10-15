const LookupModel = require('./LookupModel');
class DisabilityType extends LookupModel {
  constructor() {
    super('disability_types');
  }
}
module.exports = new DisabilityType();

// class DisabilityType {
//     static async findById(id) {
//         const res = await pool.query('SELECT * FROM disability_types WHERE id = $1', [id]);
//         return res.rows[0];
//     }

//     static async findAllActive() {
//         const res = await pool.query('SELECT * FROM disability_types WHERE status = $1 ORDER BY name_ar ASC', ['active']);
//         return res.rows;
//     }
// }

// module.exports = DisabilityType;