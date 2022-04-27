const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const uniqid = require("uniqid");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
const MongoStore = require("connect-mongo")(session);

const User = require("../models/user");
const Blog = require("../models/post");
const Category = require("../models/category");
const Product = require("../models/product");
const Newsletter = require("../models/newsletter");
const Cart = require("../models/cart");

const {
  welcomeEmail,
  verifyEmail,
  resetEmail,
  newsletterEmail,
} = require("../emails/account");
const { auth, notauth, adminAuth } = require("../middleware/auth");
const { collection, db } = require("../models/user");

let instance = require("../utils/razorpay");
const Address = require("../models/address");
const Order = require("../models/order");
const BulkRegistration = require("../models/bulk_registration");
const EarnMember = require("../models/earnmember");

const router = express.Router();

// router.use(bodyParser.json({ limit: "50mb" }));
// router.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
router.use(methodOverride("_method"));
router.use(flash());
// router.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: new MongoStore({ mongooseConnection: mongoose.connection }),
//     cookie: { maxAge: 180 * 60 * 1000 },
//   })
// );
// router.use(passport.initialize());
// router.use(passport.session());
// router.use(morgan("dev"));
// router.use((req, res, next) => {
//   res.locals.session = req.session;
//   next();
// });

router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isExclusive: true });
    if (!req.session.cart) {
      return res.render("index", {
        products,
      });
    }
    const cart = new Cart(req.session.cart);
    res.render("index", {
      products,
      cart: cart.generateArray(),
    });
  } catch (e) {
    console.log(e);
    res.send("Something Went Wrong");
  }
});

router.post("/add-to-cart/:id", async (req, res) => {
  try {
    var productId = req.params.id;
    // console.log(req.body);
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    const product = await Product.findById({ _id: productId });
    product.color_selected = req.body.color_selected;
    product.size_selected = req.body.size_selected;
    // console.log(product);
    await cart.add(product, product._id);
    req.session.cart = cart;
    // console.log(req.session.cart.cod);
    res.redirect("/shop-cart");
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

router.get("/shop-cart", async (req, res) => {
  try {
    if (!req.session.cart) {
      // mongoose.connection.db.collection("sessions", function (err, collection) {
      //   collection.find({}).toArray(function (err, data) {
      //     console.log(data); // it will print your collection data
      //   });
      // });
      return res.render("shop-cart", {
        products: null,
      });
    }
    const cart = new Cart(req.session.cart);
    // console.log(cart.generateArray());
    res.render("shop-cart", {
      products: cart.generateArray(),
      totalPrice: cart.totalPrice,
    });
  } catch (e) {
    console.log(e);
    res.send("Something Went Wrong");
  }
});

router.get("/admin/dashboard", adminAuth, async (req, res) => {
  let orders = [];
  let append;
  let ordersArray;
  let perPage = 6;

  const user = req.user;

  var count = await Order.countDocuments({});
  var page = req.query.page || 1;
  var pageCount = Math.ceil(count / perPage);
  var skip = perPage * page - perPage;

  ordersArray = await Order.find({})
    .sort({ _id: -1 })
    .limit(perPage)
    .skip(skip);

  append = `/admin/dashboard?`;

  for (let order of ordersArray) {
    const save = order;
    order = {};
    order._id = save._id;
    order.date = save.date;
    order.status = save.status;
    order.cart = {};
    order.cart.totalPrice = save.cart.totalPrice;
    order.cart.totalQty = save.cart.totalQty;
    orders.push(order);
    // console.log(orders);
  }
  res.render("admin_portal", {
    orders,
    csrfToken: req.csrfToken(),
    pagination: {
      append,
      page,
      pageCount,
    },
  });
});

router.get("/checkout", auth, async (req, res) => {
  let order_id;
  try {
    if (!req.session.cart) {
      return res.render("shop-cart", {
        products: null,
      });
    }
    let cart = new Cart({
      ...req.session.cart,
      totalPrice: req.session.cart.totalPrice - req.user.referal_bonus,
    });
    var options = {
      amount: cart.totalPrice * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: uniqid("reciept_id-"),
      payment_capture: "0",
    };
    instance.orders.create(options, function (err, order) {
      // console.log(order);
      // console.log(order.id);
      order_id = order.id;
    });

    const address = await Address.find({ userId: req.user._id });
    // console.log(address);
    res.render("checkout", {
      products: cart.generateArray(),
      order_id,
      user: req.user,
      address: address[0],
      totalPrice: cart.totalPrice * 100,
      csrfToken: req.csrfToken(),
    });
  } catch (e) {
    console.log(e);
  }
});

router.post("/checkout", auth, async (req, res) => {
  try {
    console.log(req.session.cart);
    let cart = new Cart({
      ...req.session.cart,
      totalPrice: req.session.cart.totalPrice - req.user.referal_bonus,
    });
    console.log(cart);
    let address = await Address.find({ userId: req.user._id });
    if (address.length === 0) {
      address = new Address({ ...req.body, userId: req.user._id });
      await address.save();
    } else {
      address = await Address.findOneAndUpdate(
        { userId: req.user._id },
        req.body
      );
    }
    cart.referal_bonus = req.user.referal_bonus;
    if (cart.cod === false || req.body.razorpay_payment_id) {
      const capturePayment = await instance.payments.capture(
        req.body.razorpay_payment_id,
        cart.totalPrice * 100,
        "INR"
      );
      const paymentDetails = await instance.payments.fetch(
        req.body.razorpay_payment_id
      );
      if (
        paymentDetails.amount !=
        (req.session.cart.totalPrice - req.user.referal_bonus) * 100
      ) {
        throw new Error(`Please Pay First You didn't Paid the exact amount`);
      } else {
        const order = new Order({
          address,
          userId: req.user._id,
          cart,
          razorpay_payment_id: req.body.razorpay_payment_id,
        });
        // console.log(paymentDetails);
        // console.log(capturePayment);
        await order.save();
        req.session.cart = null;
        const user = await User.findByIdAndUpdate(
          { _id: req.user._id },
          { referal_bonus: 0 }
        );
        res.render("order-completed");
      }
    } else if (cart.cod) {
      const order = new Order({
        address,
        userId: req.user._id,
        cart,
      });
      await order.save();
      req.session.cart = null;
      res.render("order-completed");
    }
  } catch (e) {
    console.log(e);
    res.send(req.user.name + " tried to manipulate the code IP logged ");
  }
});

router.get("/faq", async (req, res) => {
  res.render("faq");
});

router.get("/send/newsletter", adminAuth, async (req, res) => {
  res.render("newsletter", {
    csrfToken: req.csrfToken(),
  });
});

router.post("/send/newsletter", adminAuth, async (req, res) => {
  let users = await Newsletter.find({});
  let index = 1;
  let userList = [];
  for (const user of users) {
    userList.push(user.email);
    if (index == 38) {
      break;
    }
    index += 1;
  }
  newsletterEmail(req.body.subject, userList, req.body.content);
  res.render("newsletter", {
    message: "Newsletter Sent To The Users",
  });
});

router.get("/enroll/newsletter", auth, async (req, res) => {
  const enroller = new Newsletter({ email: req.query.email });
  await enroller.save();
  res.render("index", {
    message: "Your Email Is Successfully Added To Our List.",
  });
});

router.get("/order/search", auth, async (req, res) => {
  try {
    const user = req.user;
    if (req.query.id) {
      const order = await Order.findById({ _id: req.query.id });
      if (String(order.userId) != String(user._id) && !user.isAdmin) {
        throw new Error("Oops! looks like you made a mistake");
      }
      const cart = new Cart(order.cart);
      if (user.isAdmin) {
        var userDetail = await User.findById({ _id: order.userId });
      }
      res.render("order-detail", {
        user,
        order,
        userDetail,
        products: cart.generateArray(),
      });
    } else {
      res.send("404");
    }
  } catch (e) {
    console.log(e);
    res.send("Oops! looks like you made a mistake");
  }
});

router.get("/bulk/registration", async (req, res) => {
  res.render("bulk_form", {
    csrfToken: req.csrfToken(),
  });
});

router.post("/bulk/registeration", async (req, res) => {
  try {
    const bulkRegistration = new BulkRegistration(req.body);
    await bulkRegistration.save();
    res.render("bulk_store");
  } catch (e) {
    if (e.code === 11000) {
      res.send("Email Already Associated With Another Request");
    }
  }
});

router.get("/earn/register", auth, async (req, res) => {
  res.render("earn", {
    user: req.user,
    csrfToken: req.csrfToken(),
  });
});

router.post("/earn/register", auth, async (req, res) => {
  try {
    const earner = new EarnMember(req.body);
    await earner.save();
    res.render("verification", {
      message: "Your Application for earn program has been submitted",
    });
  } catch (e) {
    if (e.code === 11000) {
      res.render("verification", {
        message: "Previous Request Is Pending",
      });
    }
  }
});

module.exports = router;
