const express = require("express");
const router = express.Router();
const reposRouter = require("./repos");
const ownerRouter = require("./owner");
const aboutRouter = require("./about");

router.get("/", (req, res) => res.send("Hello World"));

router.use("/repos", reposRouter);
router.use("/owner", ownerRouter);
router.use("/about", aboutRouter);

module.exports = router;
