const { Router } = require("express");

const authenticateUser = require("../middleware/auth.middleware");
const {
  createTicket,
  assignTicket,
  requestPurchase,
  resolveTicket,
  verifyTicket,
} = require("../controllers/ticket.controller");
const { upsertMaintenanceNote } = require("../controllers/maintenance.controller");

const router = Router();

router.use(authenticateUser);

router.post("/", createTicket);
router.patch("/:id/assign", assignTicket);
router.patch("/:id/request-purchase", requestPurchase);
router.put("/:id/resolve", resolveTicket);
router.patch("/:id/verify", verifyTicket);
router.put("/:id/maintenance-note", upsertMaintenanceNote);

module.exports = router;
