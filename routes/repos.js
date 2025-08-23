const express = require("express");
const router = express.Router();
const { getOrgRepos } = require("../controllers/reposController");

router.get("/", getOrgRepos);

module.exports = router;
