const express = require("express");
const router = express.Router();
const { fetchOrganization, fetchOrgProfileReadme, convertEmptyToNull } = require("../utils/githubApi");

router.get("/", async (req, res) => {
    try {
        const orgData = await fetchOrganization("30osob-studio");
        const profileReadme = await fetchOrgProfileReadme("30osob-studio");

        const orgWithReadme = {
            ...orgData,
            readme: profileReadme
        };

        const { fields } = req.query;

        if (fields) {
            const fieldList = fields.split(',').map(field => field.trim());
            const filteredOrg = {};

            fieldList.forEach(field => {
                if (orgWithReadme.hasOwnProperty(field)) {
                    filteredOrg[field] = orgWithReadme[field];
                }
            });

            return res.json(convertEmptyToNull(filteredOrg));
        }

        res.json(convertEmptyToNull(orgWithReadme));
    } catch (error) {
        console.error("Error fetching organization data:", error);
        res.status(500).json({ error: "Failed to fetch organization data" });
    }
});

module.exports = router;
