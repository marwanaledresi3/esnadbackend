const pool = require('../config/db');
const LookupModel = require('./LookupModel');
module.exports = new LookupModel('operation_types');
// class OperationType {
//     static async findById(id) {
//         const res = await pool.query('SELECT * FROM operation_types WHERE id = $1', [id]);
//         return res.rows[0];
//     }

//     static async findAllActive() {
//         const res = await pool.query('SELECT * FROM operation_types WHERE status = $1 ORDER BY name_ar ASC', ['active']);
//         return res.rows;
//     }
// }

// module.exports = OperationType;