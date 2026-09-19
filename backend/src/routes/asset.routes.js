const { Router } = require("express");
const { authenticateUser, authorize } = require("../middleware/auth.middleware");
const { listAssets, getAssetById, createAssetHandler, updateAssetById, archiveAssetById, listMyAssets, listTechnicianAssets } = require("../controllers/asset.controller");

const router = Router();

router.use(authenticateUser);

router.get("/", authorize("ADMIN"), listAssets);
router.get("/my", listMyAssets);
router.get("/technician", authorize("TECHNICIAN"), listTechnicianAssets);
router.get("/:id", authorize("ADMIN", "EMPLOYEE", "TECHNICIAN"), getAssetById);
router.post("/", authorize("ADMIN"), createAssetHandler);
router.put("/:id", authorize("ADMIN"), updateAssetById);
router.patch("/:id/archive", authorize("ADMIN"), archiveAssetById);

module.exports = router;
