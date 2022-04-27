const mongoose = require("mongoose");
const validator = require("validator");

const bulkRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  orgname: {
    type: String,
    required: true,
    trim: true,
  },
  orgloc: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: new Date(),
  },
  purpose: {
    type: String,
  },
  contact: {
    type: String,
  },
  event_Name: {
    type: String,
  },
});

const BulkRegistration = mongoose.model(
  "BulkRegistration",
  bulkRegistrationSchema
);

module.exports = BulkRegistration;
