const { Router } = require("express");
const { authenticateUser, authorize } = require("../middleware/auth.middleware");
const {
  listActiveAnnouncements,
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcement.controller");

const router = Router();

router.get("/", authenticateUser, listActiveAnnouncements);
router.get("/all", authenticateUser, getAnnouncements);
router.get("/:id", authenticateUser, getAnnouncementById);
router.post("/", authenticateUser, authorize("ADMIN"), createAnnouncement);
router.put("/:id", authenticateUser, authorize("ADMIN"), updateAnnouncement);
router.delete("/:id", authenticateUser, authorize("ADMIN"), deleteAnnouncement);

module.exports = router;
