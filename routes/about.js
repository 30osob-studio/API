const express = require("express");
const router = express.Router();
const { convertEmptyToNull } = require("../utils/githubApi");
const dataCache = require("../utils/cache");

router.get("/", async (req, res) => {
    try {
        const orgData = await dataCache.getOrganization("30osob-studio");
        const profileReadme = await dataCache.getOrgProfileReadme("30osob-studio");

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
        res.status(500).json({ error: "Failed to fetch organization data" });
    }
});

module.exports = router;
