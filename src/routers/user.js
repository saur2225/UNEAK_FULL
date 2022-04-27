const express = require("express");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
// const csrf = require("csurf");

// const csrfProtection = csrf();

const User = require("../models/user");
const Blog = require("../models/post");
const Category = require("../models/category");

const { welcomeEmail, verifyEmail, resetEmail } = require("../emails/account");
const { auth, notauth, adminAuth } = require("../middleware/auth");
const Order = require("../models/order");
const Address = require("../models/address");
const EarnMember = require("../models/earnmember");
const Newsletter = require("../models/newsletter");

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
//   })
// );
// router.use(csrfProtection);
// router.use(passport.initialize());
// router.use(passport.session());
// router.use(morgan("dev"));

router.get("/user/me", auth, async (req, res) => {
  const user = req.user;
  let orders = [];
  let append;
  let ordersArray;
  let perPage = 6;
  let showOrders = false;

  var count = await Order.countDocuments({ userId: user._id });
  var page = req.query.page || 1;
  var pageCount = Math.ceil(count / perPage);
  var skip = perPage * page - perPage;

  ordersArray = await Order.find({ userId: user._id })
    .sort({ _id: -1 })
    .limit(perPage)
    .skip(skip);

  append = `/user/me?`;
  if (req.query.page) {
    showOrders = true;
  }

  const address = await Address.find({ userId: req.user._id });

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
  // console.log(address);
  res.render("my-account", {
    user,
    orders,
    address: address[0],
    csrfToken: req.csrfToken(),
    showOrders,
    pagination: {
      append,
      page,
      pageCount,
    },
  });
});

router.get("/user/forgot", notauth, async (req, res) => {
  res.render("forgot", {
    csrfToken: req.csrfToken(),
  });
});

router.get("/reset/:token", notauth, async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    return res.render("verification", {
      message: "INVALID ATTEMPT",
    });
  } else {
    res.render("reset", {
      user,
      csrfToken: req.csrfToken(),
    });
  }
});

// router.get("/users", auth, async (req, res) => {
//   try {
//     user = req.user;
//     if (user.isAdmin === true) {
//       const userList = await User.find({}).sort({ name: 1 });

//       res.render("verification", {
//         user,
//         userList,
//         pageTitle: "Users",
//       });
//     } else {
//       res.redirect("/admin/blog");
//     }
//   } catch (e) {
//     console.log(e);
//     res.render("verification", {
//       message: "Something Went Wrong",
//       user,
//     });
//   }
// });

router.get("/signup", notauth, async (req, res) => {
  let referal_code;
  if (req.query.referal_code) {
    referal_code = req.query.referal_code;
  }
  res.render("signup", {
    referal_code,
    csrfToken: req.csrfToken(),
  });
});

router.get("/login", notauth, (req, res) => {
  res.render("login", {
    csrfToken: req.csrfToken(),
  });
});

router.get("/verification/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    return res.render("verification", {
      message: "INVALID ATTEMPT",
    });
  } else {
    user.token = undefined;
    user.isVerified = true;

    var referal_bonus = 0;
    if (req.query.referal_code) {
      console.log(req.query.referal_code);
      referal_code = req.query.referal_code;
      const user = await User.findOne({ referal_code });
      if (user) {
        user.referal_bonus += 50;
        await user.save();
        referal_bonus += 25;
      }
    }
    user.referal_bonus = referal_bonus;
    await user.save();
    res.render("verification", {
      message: "Verified",
      login: "/login",
    });
  }
});

router.get("/logout", auth, (req, res) => {
  req.session.destroy();
  req.logOut();
  res.redirect("/login");
});

router.post("/signup", async (req, res) => {
  try {
    var referal_code;
    if (req.query.referal_code) {
      referal_code = req.query.referal_code;
    }
    const userCount = await User.countDocuments();

    const user = new User({ ...req.body, referal_code: shortid.generate() });
    user.token = shortid.generate();
    if (userCount === 0) {
      user.isAdmin = true;
    } else {
      user.isAdmin = undefined;
    }
    await user.save();
    welcomeEmail(user.email, user.name, user.token, referal_code);
    res.render("verification", {
      message: "Please Check Your Email To Verify Your Account",
    });
  } catch (e) {
    console.log(e);
    if (e.code === 11000) {
      req.flash("info", "Email Already Associated With Another Account");
      return res.redirect(`/signup?referal_code=${referal_code}`);
    }
    req.flash("info", "Something Went Wrong");
    res.redirect(`/signup?referal_code=${referal_code}`);
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    if (req.session.oldUrl) {
      const oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    } else if (req.user.isAdmin) {
      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/");
    }
  }
);

router.post("/user/forgot", notauth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash("info", `No User Associated With ${req.body.email}`);
      return res.redirect("/user/forgot");
    }
    const token = shortid.generate();
    await User.findByIdAndUpdate({ _id: user._id }, { token });
    resetEmail(user.email, user.name, token);
    res.render("verification", {
      pageTitle: "Forgot Password",
      message: "Please Check Your E-mail For Further Details",
    });
  } catch (e) {
    req.flash("info", "Something Went Wrong");
    res.redirect("/user/forgot");
  }
});

router.post("/user/address/update", auth, async (req, res) => {
  await Address.findOneAndUpdate({ userId: req.user._id }, req.body);
  res.redirect("/user/me");
});

router.post("/user/password", auth, async (req, res) => {
  const user = req.user;
  const userData = await User.findById({ _id: user._id });
  if (
    (await bcrypt.compare(req.body.currentPassword, userData.password)) ===
    false
  ) {
    req.flash("info", "Current Password Doesn't Match");
    return res.render("my-account", {
      pageTitle: "Change Password",
      user,
    });
  }
  userData.password = req.body.password;
  await userData.save();
  res.render("my-account", {
    pageTitle: "Password Changed",
    user,
    message: "Password Changed Successfully",
  });
});

router.patch("/user/edit", auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.email != req.body.email) {
      var token = shortid.generate();
      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          name: req.body.name,
          email: req.body.email,
          isVerified: false,
          token,
        }
      );

      var subjectEmail = "Verify Your New E-Mail";
      var messageEmail = "Updated Your E-mail";

      verifyEmail(
        req.body.email,
        subjectEmail,
        req.body.name,
        messageEmail,
        token
      );

      return res.render("verification", {
        pageTitle: "Updated",
        message:
          "Profile Updated Successfully, Make Sure To Verify Your New Email Within 24 Hours Otherwise Your Account Will Be Deleted",
        user,
      });
    }
    await User.findByIdAndUpdate(
      { _id: user._id },
      {
        name: req.body.name,
        email: req.body.email,
      }
    );
    res.render("verification", {
      pageTitle: "Updated",
      message: "Profile Updated Successfully",
      user,
    });
  } catch (e) {
    console.log(e);
    if (e.code === 11000) {
      req.flash("info", "Email Already Associated With Another Account");
      return res.redirect("/user/me");
    }
    req.flash("info", "Something Went Wrong");
    res.redirect("/user/me");
  }
});

router.post("/user/reset", notauth, async (req, res) => {
  try {
    const user = await User.findOne({ token: req.body.token });
    user.password = req.body.password;
    user.token = undefined;
    await user.save();

    res.render("verification", {
      pageTitle: "Password Changed",
      message: "Password Changed Successfully",
      login: "/login",
    });
  } catch (e) {
    console.log(e);
    req.flash("info", "Something Went Wrong");
    res.render("verification");
  }
});

router.get("/members/list", adminAuth, async (req, res) => {
  const userList = await EarnMember.find({});
  let message;
  if (userList.length === 0) {
    message = "No Pending Request";
  }
  res.render("approveMember", {
    userList,
    message,
    newMessage: req.flash("newMessage"),
  });
});

router.get("/member/request", adminAuth, async (req, res) => {
  try {
    if (req.query.approve) {
      await User.findOneAndUpdate(
        { email: req.query.approve },
        { isMember: true }
      );
      await EarnMember.findOneAndDelete({ email: req.query.approve });
      console.log("heere");
      req.flash("newMessage", "Request Accepted");
    } else if (req.query.reject) {
      await EarnMember.findOneAndDelete({ email: req.query.reject });
      req.flash("newMessage", "Request Rejected");
    }

    res.redirect("/members/list");
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
