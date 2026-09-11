const { Router } = require("express");
const { body, param } = require("express-validator");
const authenticateUser = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/authorization.middleware");
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

router.get("/", authorizeRoles("ADMIN"), listOffices);
router.get(
  "/:id",
  authorizeRoles("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid office id.")]),
  getOfficeById,
);
router.post(
  "/",
  authorizeRoles("ADMIN"),
  validate(officeValidationRules),
  createOfficeHandler,
);
router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  validate([
    param("id").isUUID().withMessage("Invalid office id."),
    ...officeValidationRules,
  ]),
  updateOfficeById,
);
router.put(
  "/:id/status",
  authorizeRoles("ADMIN"),
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
  authorizeRoles("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid office id.")]),
  deleteOfficeById,
);

module.exports = router;
