const { Router } = require("express");
const authenticateUser = require("../middleware/auth.middleware");
const auditMiddleware = require("../middleware/audit.middleware");
const {
  createTicket,
  assignTicket,
  requestPurchase,
  verifyTicket,
  updateStatus,
  getTicket,
} = require("../controllers/ticket.controller");
const { resolveTicket } = require("../controllers/maintenance.controller");

const router = Router();
router.use(authenticateUser);
router.use(auditMiddleware);
router.post("/", createTicket);
router.get("/:id", getTicket);
router.patch("/:id/assign", assignTicket);
router.patch("/:id/request-purchase", requestPurchase);
router.patch("/:id/verify", verifyTicket);
router.put("/:id/status", updateStatus);
router.put("/:id/resolve", resolveTicket);

module.exports = router;
