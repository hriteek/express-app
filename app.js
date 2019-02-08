const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const MongodbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const User = require("./models/user");
const errorController = require("./controllers/error");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

// multer filestorage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "images");
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// multer inintilizer
app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));

const url = "mongodb://localhost/node_app";

const store = new MongodbStore({
  uri: url,
  collection: "sessions"
});
const csrfProtection = csrf();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  //this middleware helps us to pass the user into req
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      throw new Error(err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);
app.use(errorController.get404);

// express error handling middleware
app.use((error, req, res, next) => {
  console.log("I am error");
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn
  });
});

mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    // User.findOne().then(user => {
    //   if (!user) {
    //     const user = new User({
    //       name: "Hriteek",
    //       email: "test@gmail.com",
    //       cart: []
    //     });
    //     user.save();
    //   }
    // });
    // const user = new User({
    //   name: "Hriteek",
    //   email: "test@gmail.com",
    //   cart: []
    // });
    // user.save();
    console.log("Connection successful");
    app.listen(3000);
  })
  .catch(err => console.log(err));
