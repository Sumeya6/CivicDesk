const { Router } = require("express");
const { body, param } = require("express-validator");
const authenticateUser = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/authorization.middleware");
const {
  validate,
  updateUserValidationRules,
  updateUserStatusRules,
  updateUserRoleRules,
  updatePreferredLanguageRules,
  assignTechnicianOfficesRules,
  registerValidationRules,
  createTechnicianValidationRules,
} = require("../utils/validators");
const {
  listUsers,
  getUserById,
  updateUserById,
  updateUserStatusById,
  updateUserRoleById,
  updatePreferredLanguageByMe,
  deleteUserById,
  assignTechnicianOffices,
  getTechnicianOfficeAssignments,
  getMyTechnicianOfficeAssignments,
  createUserByAdmin,
  createTechnicianByAdmin,
} = require("../controllers/user.controller");

const router = Router();

router.use(authenticateUser);

router.post(
  "/",
  authorizeRoles("ADMIN"),
  validate(registerValidationRules),
  createUserByAdmin,
);
router.post(
  "/technicians",
  authorizeRoles("ADMIN"),
  validate(createTechnicianValidationRules),
  createTechnicianByAdmin,
);
router.get("/me/offices", getMyTechnicianOfficeAssignments);
router.get("/", authorizeRoles("ADMIN"), listUsers);
router.get(
  "/:id",
  authorizeRoles("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid user id.")]),
  getUserById,
);
router.get(
  "/:id/offices",
  authorizeRoles("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid user id.")]),
  getTechnicianOfficeAssignments,
);
router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  validate([
    param("id").isUUID().withMessage("Invalid user id."),
    ...updateUserValidationRules,
  ]),
  updateUserById,
);
router.put(
  "/:id/status",
  authorizeRoles("ADMIN"),
  validate([
    param("id").isUUID().withMessage("Invalid user id."),
    ...updateUserStatusRules,
  ]),
  updateUserStatusById,
);
router.put(
  "/:id/role",
  authorizeRoles("ADMIN"),
  validate([
    param("id").isUUID().withMessage("Invalid user id."),
    ...updateUserRoleRules,
  ]),
  updateUserRoleById,
);
router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  validate([param("id").isUUID().withMessage("Invalid user id.")]),
  deleteUserById,
);
router.patch(
  "/me/language",
  validate(updatePreferredLanguageRules),
  updatePreferredLanguageByMe,
);
router.post(
  "/technicians/:id/offices",
  authorizeRoles("ADMIN"),
  validate(assignTechnicianOfficesRules),
  assignTechnicianOffices,
);

module.exports = router;
