// models/DiagnosisType.js
const LookupModel = require('./LookupModel');
class DiagnosisType extends LookupModel {
  constructor() {
    super('diagnosis_types');
  }
}
module.exports = new DiagnosisType();