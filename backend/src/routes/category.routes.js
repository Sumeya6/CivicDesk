const { Router } = require("express");
const authenticateUser = require("../middleware/auth.middleware");
const { listCategories } = require("../controllers/category.controller");

const router = Router();
router.use(authenticateUser);
router.get("/", listCategories);

module.exports = router;
