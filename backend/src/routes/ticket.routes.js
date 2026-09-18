const { Router } = require("express");
const { authenticateUser } = require("../middleware/auth.middleware");
const { validate } = require("../utils/validators");
const {
  createTicket,
  assignTicket,
  requestPurchase,
  verifyTicket,
  updateStatus,
  getTicket,
  listTickets,
} = require("../controllers/ticket.controller");
const { searchTickets } = require("../controllers/search.controller");
const { resolveTicket } = require("../controllers/maintenance.controller");
const { searchTicketsValidationRules } = require("../utils/validators");

const router = Router();
router.use(authenticateUser);
router.get("/", listTickets);
router.post("/", createTicket);
router.get("/search", validate(searchTicketsValidationRules), searchTickets);
router.get("/:id", getTicket);
router.patch("/:id/assign", assignTicket);
router.patch("/:id/request-purchase", requestPurchase);
router.patch("/:id/verify", verifyTicket);
router.put("/:id/status", updateStatus);
router.put("/:id/resolve", resolveTicket);

module.exports = router;
