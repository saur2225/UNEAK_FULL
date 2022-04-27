const mongoose = require("mongoose");
const validator = require("validator");

const earnMemberSchema = new mongoose.Schema({
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
  contact: {
    type: String,
  },
});

const EarnMember = mongoose.model("EarnMember", earnMemberSchema);

module.exports = EarnMember;
