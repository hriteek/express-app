const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongodbStore = require("connect-mongodb-session")(session);

const User = require("./models/user");
const errorController = require("./controllers/error");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const url = "mongodb://localhost/node_app";

const store = new MongodbStore({
  uri: url,
  collection: "sessions"
});

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use((req, res, next) => {
  //this middleware helps us to pass the user into req
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(url, { useNewUrlParser: true })
  .then(() => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: "Hriteek",
          email: "test@gmail.com",
          cart: []
        });
        user.save();
      }
    });
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
