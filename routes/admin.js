const path = require("path");
const { body } = require("express-validator/check");

const express = require("express");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is_auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// // /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title", "title should be min 3 char")
      .isLength({ min: 3 })
      .isString()
      .trim(),
    body("price", "Price should be float value").isFloat(),
    body("description", "Descrition should be between 5 and 200 char")
      .isLength({ min: 5, max: 200 })
      .trim()
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "title should be min 3 char")
      .isLength({ min: 3 })
      .isString()
      .trim(),
    body("price", "Price should be float value").isFloat(),
    body("description", "Descrition should be between 5 and 200 char")
      .isLength({ min: 5, max: 200 })
      .trim()
  ],
  isAuth,
  adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
