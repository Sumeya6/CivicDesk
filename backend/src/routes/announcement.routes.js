const { Router } = require("express");
const authenticateUser = require("../middleware/auth.middleware");
const {
  listActiveAnnouncements,
} = require("../controllers/announcement.controller");

const router = Router();

router.get("/", authenticateUser, listActiveAnnouncements);

module.exports = router;
