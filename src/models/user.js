const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (value.length < 6) {
        throw new Error("Password length must be more than 6 characters");
      }
      if (value.toLowerCase().includes("password")) {
        throw new Error("Password Cannot Contain password");
      }
    },
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
    type: Number,
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  isAdmin: {
    type: Boolean,
  },
  token: {
    type: String,
  },
  referal_code: {
    type: String,
  },
  referal_bonus: {
    type: Number,
    default: 0,
  },
  isMember: {
    type: Boolean,
  },
});

//Hashing before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
