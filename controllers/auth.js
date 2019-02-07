const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const { validationResult } = require("express-validator/check");

const User = require("../models/user");

const transport = nodeMailer.createTransport(
  sgTransport({
    auth: {
      api_key:
        "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"
    }
  })
);

exports.getLogin = (req, res) => {
  let message = req.flash("errors");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: { email: "", password: "" },
    validationError: []
  });
};

exports.postLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password },
      validationError: errors.array()
    });
  }
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email",
          oldInput: { email: email, password: password },
          validationError: [{ param: "email" }]
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              //you don't have to save the session generally but you should do if you want to make sure that it is saved
              console.log("req.session.save error: ", err);
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid password",
            oldInput: { email: email, password: password },
            validationError: [{ param: "password" }]
          });
        })
        .catch(err => console.log("Error: ", err));
    })
    .catch(err => console.log("Error: ", err));
};

exports.postLogout = (req, res) => {
  req.session.destroy(err => {
    console.log("postLogout error: ", err);
    res.redirect("/");
  });
};

exports.getSignUp = (req, res) => {
  let message = req.flash("errors");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    pageTitle: "Sign Up",
    path: "/signup",
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      conformPassword: ""
    },
    validationError: []
  });
};

exports.postSignUp = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Sign Up",
      path: "/signup",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        conformPassword: req.body.conformPassword
      },
      validationError: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashPassword => {
      const user = new User({
        email: email,
        password: hashPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      return transport.sendMail({
        to: email,
        from: "node-app.com",
        subject: "Sign up successed!",
        html: "<h1>You signed up successfully</h1>"
      });
    })
    .catch(err => console.log("Error: ", err));
};

exports.getReset = (req, res) => {
  let message = req.flash("errors");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message
  });
};

exports.postReset = (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log("Error: ", err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash("errors", "No accoutt found with this wmail");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        res.redirect("/");
        transport.sendMail({
          to: req.body.email,
          from: "node-app.com",
          subject: "Password Reset",
          html: `
        <p>Yoy requrested for password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset the password</p>
        `
        });
      })
      .catch(err => console.log("Error: ", err));
  });
};

exports.getNewPassword = (req, res) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash("errors");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        resetToken: token,
        userId: user._id.toString()
      });
    })
    .catch(err => console.log("Error: ", err));
};

exports.postNewPassword = (req, res) => {
  const resetPassword = req.body.password;
  const userId = req.body.userId;
  const token = req.body.resetToken;

  let updateUser;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      updateUser = user;
      return bcrypt.hash(resetPassword, 12);
    })
    .then(hashedPassword => {
      updateUser.password = hashedPassword;
      updateUser.resetToken = undefined;
      updateUser.resetTokenExpiration = undefined;
      return updateUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch(err => console.log("Error: ", err));
};
