const express = require("express");
const { check, body } = require("express-validator/check");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignUp);

router.post("/logout", authController.postLogout);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        // if (value === "test@gmail.com") {
        //   throw new Error("This email is not so good");
        // }
        // return true;
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject("Email already exists");
          }
        });
      }),
    body(
      "password",
      "Please enter the password with only number and text and min 5 char long !!!"
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body("conformPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password did not matched");
      }
      return true;
    })
  ],
  authController.postSignUp
);

router.post("/login", authController.postLogin);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
