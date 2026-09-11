const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/announcements", require("./announcement.routes"));
router.use("/reports", require("./report.routes"));
router.use("/tickets", require("./search.routes"));

module.exports = router;
