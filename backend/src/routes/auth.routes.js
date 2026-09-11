const { Router } = require("express");

const {
  login,
  logout,
  getCurrentUser,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const authenticateUser = require("../middleware/auth.middleware");
const {
  validate,
  loginValidationRules,
  registerValidationRules,
  changePasswordValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
} = require("../utils/validators");

const router = Router();

router.post("/login", validate(loginValidationRules), login);
router.post("/register", validate(registerValidationRules), register);
router.put(
  "/change-password",
  authenticateUser,
  validate(changePasswordValidationRules),
  changePassword,
);
router.post(
  "/forgot-password",
  validate(forgotPasswordValidationRules),
  forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordValidationRules),
  resetPassword,
);
router.post("/logout", logout);
router.get("/me", authenticateUser, getCurrentUser);

module.exports = router;
