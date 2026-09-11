const { Router } = require("express");
const { searchTickets } = require("../controllers/search.controller");

const router = Router();

router.get("/search", searchTickets);

module.exports = router;
