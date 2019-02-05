const User = require("../models/user");
exports.getLogin = (req, res) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postLogin = (req, res) => {
  User.findById("5c5870abd49a5160191a779a")
    .then(user => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save(err => {
        //you don't have to save the session generally but you should do if you want to make sure that it is saved
        console.log("req.session.save error: ", err);
        res.redirect("/");
      });
    })
    .catch(err => console.log("Error: ", err));
};

exports.postLogout = (req, res) => {
  req.session.destroy(err => {
    console.log("postLogout error: ", err);
    res.redirect("/");
  });
};
