const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  mail_id: { type: String, required: true },
  employee_id: { type: String, required: true }
});

module.exports = mongoose.model("Employee", EmployeeSchema);
