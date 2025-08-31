require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const autoRefresh = require("./utils/autoRefresh");
const dataCache = require("./utils/cache");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", routes);

// Integrate with autoRefresh to broadcast updates via SSE
// Override the refreshOrgRepos method in dataCache to broadcast updates
const originalRefreshOrgRepos = dataCache.refreshOrgRepos;
dataCache.refreshOrgRepos = async function (org) {
    try {
        const result = await originalRefreshOrgRepos.call(this, org);
        // Broadcast updated data to all connected SSE clients
        if (global.broadcastSSE) {
            global.broadcastSSE({
                type: 'data_update',
                org: org,
                data: result,
                updateType: 'auto_refresh',
                timestamp: new Date().toISOString()
            });
        }
        return result;
    } catch (error) {
        console.error('Error in auto-refresh with broadcast:', error);
        throw error;
    }
};

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with SSE support`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`SSE test page: http://localhost:${PORT}/sse-test`);
    console.log(`WebSocket test page: http://localhost:${PORT}/ws-test`);
});
