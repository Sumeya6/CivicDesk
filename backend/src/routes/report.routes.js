const { Router } = require("express");
const { getSummary } = require("../controllers/report.controller");

const router = Router();

router.get("/summary", getSummary);

module.exports = router;
