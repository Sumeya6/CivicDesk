const { body, validationResult } = require("express-validator");

const loginValidationRules = [
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required."),
  body("password").notEmpty().withMessage("Password is required."),
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
};
