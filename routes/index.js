const express = require("express");
const router = express.Router();
const reposRouter = require("./repos");
const ownerRouter = require("./owner");

router.get("/", (req, res) => res.send("Hello World"));

router.use("/repos", reposRouter);
router.use("/owner", ownerRouter);

module.exports = router;
