const express = require("express");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
const multer = require("multer");
const sharp = require("sharp");

const User = require("../models/user");
const Blog = require("../models/post");
const Category = require("../models/category");
const Cart = require("../models/cart");

const { welcomeEmail, verifyEmail, resetEmail } = require("../emails/account");
const { auth, notauth, adminAuth } = require("../middleware/auth");
const Product = require("../models/product");
const { reduceImages } = require("../utils/helper");

const router = express.Router();

// router.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// router.use(bodyParser.json({ limit: "50mb" }));
router.use(methodOverride("_method"));
router.use(flash());
// router.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );
// router.use(passport.initialize());
// router.use(passport.session());
router.use(morgan("dev"));

const upload = multer({
  limits: {
    fileSize: 100000000,
  },
  fileFilter(req, file, cb) {
    file.originalname = file.originalname.toLowerCase();
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
      cb(new Error("Please upload either a png, jpg or jpeg type"));
    }
    cb(undefined, true);
  },
});

router.get("/product/:category", async (req, res) => {
  try {
    let append;
    let products;
    let perPage = 2;

    var count = await Product.countDocuments({ category: req.params.category });
    var page = req.query.page || 1;
    var pageCount = Math.ceil(count / perPage);
    var skip = perPage * page - perPage;

    products = await Product.find({ category: req.params.category })
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(skip);
    append = `/product/${req.params.category}?`;

    res.render("shop-list", {
      products,
      category: req.params.category,
      pagination: {
        append,
        page,
        pageCount,
      },
    });
  } catch (e) {}
});

router.get("/product/detail/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    const sizes = [
      { size: "xs" },
      { size: "s" },
      { size: "m" },
      { size: "l" },
      { size: "xl" },
    ];
    let productsArray = await Product.find({ category: product.category })
      .sort({ _id: -1 })
      .limit(6);
    let products = reduceImages(productsArray);
    // console.log(products.length);
    res.render("shop-product-detail", {
      product,
      products,
      sizes,
      user: req.user,
      csrfToken: req.csrfToken(),
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

router.get("/validate", async (req, res) => {
  try {
    if (req.query.slug) {
      const products = await Product.find({ slug: req.query.slug });
      if (products.length === 0) {
        res.send({
          message: "You can use this slug",
          color: "green",
        });
      } else {
        res.send({
          message: "Slug Already in use choose a different Slug",
          color: "red",
        });
      }
    }
  } catch (e) {
    res.send(e);
  }
});

router.get("/cart/add/:id", async (req, res) => {
  try {
    var productId = req.params.id;
    const product = await Product.findById({ _id: productId });
    // console.log(req.body);
    if (!req.session.cart) {
      return res.redirect(`/product/detail/${product.slug}`);
    } else {
      var cart = new Cart(req.session.cart);
      var storedItem = cart.items[req.params.id];
      if (!storedItem) {
        res.redirect(`/product/detail/${product.slug}`);
      }
    }
    // console.log(product);
    storedItem.qty++;
    storedItem.price = storedItem.item.price * storedItem.qty;
    cart.totalQty++;
    cart.totalPrice += storedItem.item.price;
    req.session.cart = cart;
    // console.log(req.session.cart.cod);
    res.redirect("/shop-cart");
  } catch (e) {
    console.log(e);
    res.send("Something Went Wrong");
  }
});

router.get("/cart/reduce/:id", async (req, res) => {
  try {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.reduceByOne(req.params.id);
    req.session.cart = cart;
    res.redirect("/shop-cart");
  } catch (e) {
    res.send(e);
  }
});

router.get("/cart/remove/:id", async (req, res) => {
  try {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.removeProduct(req.params.id);
    req.session.cart = cart;
    res.redirect("/shop-cart");
  } catch (e) {
    res.send(e);
  }
});

router.get("/product/delete/:slug", adminAuth, async (req, res) => {
  await Product.findOneAndDelete({ slug: req.params.slug });
  res.render("index", {
    message: "Product Deleted Successfully",
  });
});

router.get("/product/edit/:slug", adminAuth, async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  res.render("editProduct", {
    csrfToken: req.csrfToken(),
    product,
  });
});

router.post(
  "/product/edit/:slug",
  adminAuth,
  upload.array("images"),
  async (req, res) => {
    if (req.files.length === 0) {
      await Product.findOneAndUpdate(
        { slug: req.params.slug },
        {
          name: req.body.name,
          fullprice: req.body.fullprice,
          slug: req.body.slug,
          price: req.body.price,
          discount_percent: req.body.discount_percent,
          gist: req.body.gist,
          warranty: req.body.warranty,
          cod: req.body.cod,
          isExclusive: req.body.isExclusive,
          colors: req.body.colors,
          category: req.body.category,
          description: req.body.description,
          material: req.body.material,
        }
      );
    } else {
      const product = await Product.findOne({ slug: req.params.slug });
      const updates = Object.keys(req.body);
      updates.forEach((update) => (product[update] = req.body[update]));
      product.images.splice(0, product.images.length);
      for (file of req.files) {
        const buffer = await sharp(file.buffer)
          .resize({ width: 540, height: 600 })
          .toBuffer();
        const base64String = Buffer.from(buffer).toString("base64");
        // console.log(product.images);
        product.images = product.images.concat({ image: base64String });
      }
      await product.save();
    }
    res.redirect(`/product/detail/${req.body.slug}`);
  }
);

router.get("/search/product", async (req, res) => {
  let append;
  let products;
  let perPage = 2;

  if (req.query.search) {
    var count = await Product.countDocuments({
      name: { $regex: req.query.search, $options: "i" },
    });
    var page = req.query.page || 1;
    var pageCount = Math.ceil(count / perPage);
    var skip = perPage * page - perPage;

    products = await Product.find({
      name: { $regex: req.query.search, $options: "i" },
    })
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(skip);
    append = `/search/product?search=${req.query.search}&`;
  }

  if (products == undefined || products.length === 0) {
    return res.render("shop-list", {
      message: "No Matching Product Found,<br>Try Searching Something<br>Else",
      search: req.query.search,
    });
  }
  res.render("shop-list", {
    products,
    search: req.query.search,
    pagination: {
      append,
      page,
      pageCount,
    },
  });
});

router.post(
  "/product/add",
  adminAuth,
  upload.array("images"),
  async (req, res) => {
    const product = new Product(req.body);
    try {
      console.log(req.body.name);
      for (file of req.files) {
        const buffer = await sharp(file.buffer)
          .resize({ width: 540, height: 600 })
          .toBuffer();
        const base64String = Buffer.from(buffer).toString("base64");
        product.images = product.images.concat({ image: base64String });
      }
      // console.log(product);
      await product.save();
      res.render("admin_portal", {
        productAdded: true,
        csrfToken: req.csrfToken(),
      });
    } catch (e) {
      console.log(e);
      res.send("Something went wrong");
    }
  }
);

module.exports = router;
