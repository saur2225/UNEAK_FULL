const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  landmark: {
    type: String,
    trim: true,
  },
  address_line1: {
    type: String,
    required: true,
    trim: true,
  },
  address_line2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  contact: {
    type: Number,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
});

//Hashing before saving

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
