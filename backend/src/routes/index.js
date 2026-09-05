const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    name: "CivicDesk API",
    description: "IT Service Request and Maintenance Management System",
    version: "1.0.0",
  });
});

// Route modules to be wired as features are implemented:
router.use("/auth", require("./auth.routes"));
// router.use("/users", require("./user.routes"));
// router.use("/offices", require("./office.routes"));
router.use("/tickets", require("./ticket.routes"));
// router.use("/reports", require("./report.routes"));
// router.use("/announcements", require("./announcement.routes"));

module.exports = router;
