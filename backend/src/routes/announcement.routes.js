const { Router } = require("express");

const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcement.controller");
const authenticateUser = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", getAnnouncements);
router.get("/:id", getAnnouncementById);
router.post("/", authenticateUser, authorize("ADMIN"), createAnnouncement);
router.put("/:id", authenticateUser, authorize("ADMIN"), updateAnnouncement);
router.delete("/:id", authenticateUser, authorize("ADMIN"), deleteAnnouncement);

module.exports = router;
