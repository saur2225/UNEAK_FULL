const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: new Date(),
  },
  author: {
    type: String,
  },
  authId: {
    type: mongoose.Schema.Types.ObjectId,
  },
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
