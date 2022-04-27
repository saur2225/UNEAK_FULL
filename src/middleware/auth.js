const auth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect("/login");
};

const adminAuth = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect("/login");
};

const notauth = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return res.redirect("/admin/dashboard");
  }
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return next();
};

module.exports = {
  auth,
  notauth,
  adminAuth,
};
