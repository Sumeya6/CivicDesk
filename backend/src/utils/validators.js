const { body, param, query, validationResult } = require("express-validator");
const { ETHIOPIAN_PHONE_PATTERN } = require("./phone");

const loginValidationRules = [
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required.")
    .matches(ETHIOPIAN_PHONE_PATTERN)
    .withMessage("Phone number must be a valid Ethiopian mobile number."),
  body("password").notEmpty().withMessage("Password is required."),
];

const registerValidationRules = [
  body("fullName").trim().notEmpty().withMessage("Full name is required."),
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required.")
    .matches(ETHIOPIAN_PHONE_PATTERN)
    .withMessage("Phone number must be a valid Ethiopian mobile number."),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  body("preferredLanguage")
    .optional()
    .isIn(["AM", "EN"])
    .withMessage("Preferred language must be AM or EN."),
  body("officeId")
    .notEmpty()
    .isUUID()
    .withMessage("Office id must be a valid UUID."),
];

const createTechnicianValidationRules = [
  body("fullName").trim().notEmpty().withMessage("Full name is required."),
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required.")
    .matches(/^\+?[0-9]{9,15}$/)
    .withMessage("Phone number must contain 9 to 15 digits."),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  body("preferredLanguage")
    .optional()
    .isIn(["AM", "EN"])
    .withMessage("Preferred language must be AM or EN."),
];

const changePasswordValidationRules = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required."),
  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters."),
];

const forgotPasswordValidationRules = [
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required."),
];

const resetPasswordValidationRules = [
  body("token").trim().notEmpty().withMessage("Reset token is required."),
  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters."),
];

const updateUserValidationRules = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty."),
  body("phoneNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty.")
    .matches(/^\+?[0-9]{9,15}$/)
    .withMessage("Phone number must contain 9 to 15 digits."),
  body("preferredLanguage")
    .optional()
    .isIn(["AM", "EN"])
    .withMessage("Preferred language must be AM or EN."),
  body("officeId")
    .optional()
    .isUUID()
    .withMessage("Office id must be a valid UUID."),
  body("role")
    .optional()
    .isIn(["EMPLOYEE", "TECHNICIAN", "ADMIN"])
    .withMessage("Role must be EMPLOYEE, TECHNICIAN, or ADMIN."),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean."),
];

const updateUserStatusRules = [
  body("isActive")
    .isBoolean()
    .withMessage("isActive is required and must be a boolean."),
];

const updateUserRoleRules = [
  body("role")
    .isIn(["EMPLOYEE", "TECHNICIAN", "ADMIN"])
    .withMessage("Role must be EMPLOYEE, TECHNICIAN, or ADMIN."),
];

const updatePreferredLanguageRules = [
  body("preferredLanguage")
    .isIn(["AM", "EN"])
    .withMessage("Preferred language must be AM or EN."),
];

const assignTechnicianOfficesRules = [
  param("id").isUUID().withMessage("Technician id must be a valid UUID."),
  body("officeIds")
    .isArray({ min: 0 })
    .withMessage("officeIds must be an array."),
  body("officeIds.*")
    .isUUID()
    .withMessage("Each office id must be a valid UUID."),
];

function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.details = errors.array().map(({ msg, path, location }) => ({
        message: msg,
        field: path,
        location,
      }));
      return next(error);
    }

    return next();
  };
}

module.exports = {
  validate,
  loginValidationRules,
  registerValidationRules,
  createTechnicianValidationRules,
  changePasswordValidationRules,
  updateUserValidationRules,
  updateUserStatusRules,
  updateUserRoleRules,
  updatePreferredLanguageRules,
  assignTechnicianOfficesRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules,
};
