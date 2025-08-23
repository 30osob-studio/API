const express = require("express");
const router = express.Router();
const { fetchOrganization } = require("../utils/githubApi");

router.get("/", async (req, res) => {
    try {
        const orgData = await fetchOrganization("30osob-studio");
        res.json(orgData);
    } catch (error) {
        console.error("Error fetching organization data:", error);
        res.status(500).json({ error: "Failed to fetch organization data" });
    }
});

module.exports = router;
