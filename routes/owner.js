const express = require("express");
const router = express.Router();
const { getOwner, getOwnerRepos } = require("../controllers/ownerController");

router.get("/", getOwner);
router.get("/repos", getOwnerRepos);

module.exports = router;
