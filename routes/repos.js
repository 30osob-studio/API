const express = require("express");
const router = express.Router();
const { getOrgRepos, refreshOrgRepos, getCacheInfo, clearCache, testCache } = require("../controllers/reposController");

router.get("/", getOrgRepos);
router.post("/refresh", refreshOrgRepos);
router.get("/cache/info", getCacheInfo);
router.delete("/cache", clearCache);
router.get("/test", testCache);

module.exports = router;
