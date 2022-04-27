const mongoose = require("mongoose");
const validator = require("validator");
const request = require("request");
const instance = require("../utils/razorpay");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  cart: {
    type: Object,
    required: true,
    trim: true,
  },
  address: {
    type: Object,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
  },
  status: {
    type: String,
    default: "Processing",
  },
});

orderSchema.virtual("User", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
