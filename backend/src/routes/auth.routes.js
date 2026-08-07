const { Router } = require("express");

const {
  login,
  logout,
  getCurrentUser,
} = require("../controllers/auth.controller");
const authenticateUser = require("../middleware/auth.middleware");
const { validate, loginValidationRules } = require("../utils/validators");

const router = Router();

router.post("/login", validate(loginValidationRules), login);
router.post("/logout", logout);
router.get("/me", authenticateUser, getCurrentUser);

module.exports = router;
