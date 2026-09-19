const { Router } = require("express");
const { body, param } = require("express-validator");
const { authenticateUser, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../utils/validators");
const {
  listOffices,
  getOfficeById,
  createOfficeHandler,
  updateOfficeById,
  updateOfficeStatusById,
  deleteOfficeById,
  listOfficeOptions,
} = require("../controllers/office.controller");

const router = Router();

router.get("/options", listOfficeOptions);

router.use(authenticateUser);

const officeValidationRules = [
  body("code").trim().notEmpty().withMessage("Office code is required."),
  body("nameAm").trim().notEmpty().withMessage("Office nameAm is required."),
  body("nameEn").trim().notEmpty().withMessage("Office nameEn is required."),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean."),
];

router.get("/", authorize("ADMIN"), listOffices);
router.get(
  "/:id",
  authorize("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid office id.")]),
  getOfficeById,
);
router.post(
  "/",
  authorize("ADMIN"),
  validate(officeValidationRules),
  createOfficeHandler,
);
router.put(
  "/:id",
  authorize("ADMIN"),
  validate([
    param("id").isUUID().withMessage("Invalid office id."),
    ...officeValidationRules,
  ]),
  updateOfficeById,
);
router.put(
  "/:id/status",
  authorize("ADMIN"),
  validate([
    param("id").isUUID().withMessage("Invalid office id."),
    body("isActive")
      .isBoolean()
      .withMessage("isActive is required and must be a boolean."),
  ]),
  updateOfficeStatusById,
);
router.delete(
  "/:id",
  authorize("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid office id.")]),
  deleteOfficeById,
);

module.exports = router;
