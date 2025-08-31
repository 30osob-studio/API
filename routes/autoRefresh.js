const express = require("express");
const router = express.Router();
const {
    startAutoRefresh,
    stopAutoRefresh,
    stopAllAutoRefresh,
    changeInterval,
    getAutoRefreshStatus
} = require("../controllers/autoRefreshController");

router.use(express.json());

router.post("/start", startAutoRefresh);
router.delete("/stop/:org", stopAutoRefresh);
router.delete("/stop-all", stopAllAutoRefresh);
router.put("/interval/:org", changeInterval);
router.get("/status", getAutoRefreshStatus);

module.exports = router;
