const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color_selected: {
    type: String,
  },
  size_selected: {
    type: String,
  },
  gist: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
  },
  images: [
    {
      image: {
        type: String,
      },
    },
  ],
  colors: [String],
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  warranty: {
    type: String,
  },
  material: {
    type: String,
  },
  cod: {
    type: Boolean,
  },
  isExclusive: {
    type: Boolean,
  },
  price: {
    type: Number,
    required: true,
  },
  fullprice: {
    type: Number,
    required: true,
  },
  discount_percent: {
    type: Number,
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
