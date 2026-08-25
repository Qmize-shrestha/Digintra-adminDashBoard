const express = require("express");
const { login, signup, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

module.exports = router;