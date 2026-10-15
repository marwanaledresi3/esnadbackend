// models/CaseEventType.js
const LookupModel = require('./LookupModel');
class CaseEventType extends LookupModel {
  constructor() {
    super('case_event_types');
  }
}
module.exports = new CaseEventType();


// const DescriptiveLookupModel = require('./DescriptiveLookupModel');
// module.exports = new DescriptiveLookupModel('case_event_types');