const { Router } = require("express");
const { authenticateUser, authorize } = require("../middleware/auth.middleware");
const { getSummary } = require("../controllers/report.controller");

const router = Router();

router.get("/summary", authenticateUser, authorize("ADMIN"), getSummary);

module.exports = router;
