const express = require("express");
const bodyParser = require("body-parser");
const sharp = require("sharp");
const multer = require("multer");
const methodOverride = require("method-override");
const flash = require("express-flash");
const session = require("express-session");

const Blog = require("../models/post");
const Category = require("../models/category");

const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(bodyParser.json({ limit: "50mb" }));
router.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
router.use(methodOverride("_method"));
router.use(flash());
router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

var posts;
var perPage = 11;

router.get("/blog", async (req, res) => {
  const categories = await Category.find({}).sort({ category: 1 });
  var count = await Blog.countDocuments();
  var page = req.query.page || 1;
  var pageCount = Math.ceil(count / perPage);
  var skip = perPage * page - perPage;
  const posts = await Blog.find({}).sort({ _id: -1 }).limit(perPage).skip(skip);

  if (posts.length === 0) {
    return res.render("blog", {
      message: "No Blog Found Check Back Later",
    });
  }
  res.render("blog", {
    posts,
    categories,
    pagination: {
      page,
      pageCount,
    },
  });
});

router.get("/admin/blog", auth, async (req, res) => {
  var posts;
  const user = req.user;
  const categories = await Category.find({}).sort({ category: 1 });
  var count;
  user.isAdmin === true
    ? (count = await Blog.countDocuments())
    : (count = await Blog.countDocuments({ authId: user._id }));
  var page = req.query.page || 1;
  var pageCount = Math.ceil(count / perPage);
  var skip = perPage * page - perPage;
  if (user.isAdmin === true) {
    posts = await Blog.find({}).sort({ _id: -1 }).limit(perPage).skip(skip);
  } else {
    posts = await Blog.find({ authId: user._id })
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(skip);
  }

  if (posts.length === 0) {
    return res.render("blog", {
      message: "No Blog Found Add Some Blogs",
      user,
    });
  }
  res.render("blog", {
    posts,
    categories,
    user,
    pagination: {
      page,
      pageCount,
    },
  });
});

router.get("/delete/:id", auth, async (req, res) => {
  try {
    var count, page, pageCount, skip;
    const user = req.user;
    var postDeleted;
    if (user.isAdmin === true) {
      postDeleted = await Blog.findByIdAndDelete({ _id: req.params.id });
      count = await Blog.countDocuments();
      page = req.query.page || 1;
      pageCount = Math.ceil(count / perPage);
      skip = perPage * page - perPage;
      posts = await Blog.find({}).sort({ _id: -1 }).limit(perPage).skip(skip);
    } else {
      count = await Blog.countDocuments({ authId: user._id });
      postDeleted = await Blog.findOneAndDelete({
        _id: req.params.id,
        authId: user._id,
      });
      page = req.query.page || 1;
      pageCount = Math.ceil(count / perPage);
      skip = perPage * page - perPage;
      posts = await Blog.find({ authId: user._id })
        .sort({ _id: -1 })
        .limit(perPage)
        .skip(skip);
    }
    postDeleted != null ? (message = "Post Deleted") : (message = "");
    const categories = await Category.find({}).sort({ category: 1 });
    res.render("blog", {
      message,
      categories,
      posts,
      user,
      pagination: {
        page,
        pageCount,
      },
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

router.get("/edit/:id", auth, async (req, res) => {
  const user = req.user;
  const categories = await Category.find({}).sort({ category: 1 });
  const post = await Blog.findById({ _id: req.params.id });
  authId = post.authId.toString();
  userId = user._id.toString();
  var check = authId.localeCompare(userId);

  if (check != 0 && user.isAdmin != true) {
    const message =
      "INVALID ATTEMPT, YOU CAN'T EDIT BECAUSE THIS POST WAS WRITTEN BY SOMEONE ELSE";
    return res.render("verification", { message, userId, user });
  }
  const { _id, title, content, category, image } = post;
  res.render("editBlog", {
    _id,
    title,
    category,
    image,
    content,
    categories,
    user,
  });
});

router.get("/addCategory", auth, (req, res) => {
  const user = req.user;
  res.render("addCategory", { user });
});

router.get("/deleteCategory", auth, async (req, res) => {
  const user = req.user;
  var categories;
  if (user.isAdmin === true) {
    categories = await Category.find({}).sort({ category: 1 });
  } else {
    categories = await Category.find({ authId: user._id }).sort({
      category: 1,
    });
  }

  categories.length === 0 ? (message = "No Categories Added") : (message = "");

  res.render("deleteCategory", {
    categories,
    user,
    message,
  });
});

router.get("/deleteCategory/:id", auth, async (req, res) => {
  const user = req.user;
  await Category.findByIdAndDelete({ _id: req.params.id });
  const categories = await Category.find({}).sort({ category: 1 });
  res.render("deleteCategory", {
    categories,
    message: "Category Deleted",
    user,
  });
});

router.get("/addBlog", auth, async (req, res) => {
  const user = req.user;
  const categories = await Category.find({}).sort({ category: 1 });
  res.render("addBlog", {
    categories,
    user,
  });
});

router.get("/blog/:id", async (req, res) => {
  try {
    const user = req.user;
    const categories = await Category.find({}).sort({ category: 1 });
    var body = await Blog.findById({ _id: req.params.id });
    date = `${body.date.getDate()}-${
      body.date.getMonth() + 1
    }-${body.date.getFullYear()}`;
    res.render("viewBlog", {
      body,
      categories,
      date,
      user,
    });
  } catch (e) {
    console.log(e);
    res.render("verification", {
      message: "Not Found",
      user,
    });
  }
});

router.get("/search", async (req, res) => {
  const categories = await Category.find({}).sort({ category: 1 });
  var append;
  const user = req.user;
  if (req.query.category) {
    var count = await Blog.countDocuments({ category: req.query.category });
    var page = req.query.page || 1;
    var pageCount = Math.ceil(count / perPage);
    var skip = perPage * page - perPage;

    posts = await Blog.find({ category: req.query.category })
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(skip);
    append = `/search?category=${req.query.category}&`;
  } else {
    var count = await Blog.countDocuments({
      title: { $regex: req.query.title, $options: "i" },
    });
    var page = req.query.page || 1;
    var pageCount = Math.ceil(count / perPage);
    var skip = perPage * page - perPage;

    posts = await Blog.find({
      title: { $regex: req.query.title, $options: "i" },
    })
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(skip);
    append = `/search?title=${req.query.title}&`;
  }

  if (posts.length === 0) {
    return res.render("blog", {
      message: "No Matching Blog Found Check Back Later",
      user,
      categories,
    });
  }
  res.render("blog", {
    posts,
    categories,
    user,
    pagination: {
      append,
      page,
      pageCount,
    },
  });
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
      cb(new Error("Please upload either a .png, .jpg or .jpeg type Image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/addBlog",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const user = req.user;
      const doc = new Blog(req.body);
      doc.author = user.name;
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 400, height: 250 })
        .toBuffer();
      const base64String = Buffer.from(buffer).toString("base64");
      doc.image = base64String;
      doc.authId = user._id;
      await doc.save();
      const categories = await Category.find({}).sort({ category: 1 });
      res.status(201).render("addBlog", {
        message: "Blog Published",
        categories,
        user,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ Error: error.message });
  }
);

router.post("/addCategory", auth, async (req, res) => {
  const user = req.user;
  const category = new Category(req.body);
  category.authId = user._id;
  await category.save();
  res.render("addCategory", { message: "Category Added", user });
});

router.patch(
  "/edit/:id",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const user = req.user;
      const post = await Blog.findById({ _id: req.params.id });
      const updates = Object.keys(req.body);
      updates.forEach((update) => (post[update] = req.body[update]));
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 400, height: 250 })
        .toBuffer();
      const base64String = Buffer.from(buffer).toString("base64");
      post.image = base64String;
      post.authId = user._id;
      post.author = user.name;
      await post.save();
      const categories = await Category.find({}).sort({ category: 1 });
      res.status(201).render("addBlog", {
        message: "Blog Updated",
        categories,
        user,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ Error: error.message });
  }
);

module.exports = router;
