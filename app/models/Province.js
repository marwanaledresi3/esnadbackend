// models/Province.js
const LookupModel = require('./LookupModel');
class Province extends LookupModel {
  constructor() {
    super('provinces');
  }
}
module.exports = new Province();