const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post("/logout", authController.postLogout);

router.post("/login", authController.postLogin);

module.exports = router;
