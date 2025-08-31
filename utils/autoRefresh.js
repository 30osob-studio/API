const dataCache = require('./cache');

class AutoRefresh {
    constructor() {
        this.intervals = new Map();
        this.isRunning = false;
    }

    startAutoRefresh(org, intervalMs = 30000) {
        if (this.intervals.has(org)) {
            console.log(`Auto-refresh for ${org} already running`);
            return;
        }

        const interval = setInterval(async () => {
            try {
                console.log(`Auto-refreshing data for ${org} at ${new Date().toISOString()}...`);
                await dataCache.refreshOrgRepos(org);
                console.log(`Auto-refresh completed for ${org} at ${new Date().toISOString()}`);
            } catch (error) {
                console.error(`Auto-refresh error for ${org}:`, error);
                // Don't stop auto-refresh on error, just log it
            }
        }, intervalMs);

        this.intervals.set(org, interval);
        this.isRunning = true;
        console.log(`Auto-refresh started for ${org} with interval ${intervalMs / 1000} seconds`);
    }

    stopAutoRefresh(org) {
        const interval = this.intervals.get(org);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(org);
        }
    }

    stopAllAutoRefresh() {
        for (const [org, interval] of this.intervals.entries()) {
            clearInterval(interval);
        }
        this.intervals.clear();
        this.isRunning = false;
    }

    changeInterval(org, newIntervalMs) {
        if (this.intervals.has(org)) {
            this.stopAutoRefresh(org);
            this.startAutoRefresh(org, newIntervalMs);
        }
    }

    getStatus() {
        const status = {
            isRunning: this.isRunning,
            activeIntervals: {}
        };

        for (const [org, interval] of this.intervals.entries()) {
            status.activeIntervals[org] = {
                interval: interval,
                isActive: true
            };
        }

        return status;
    }

    startAllAutoRefresh(orgs = ['30osob-studio'], intervalMs = 30000) {
        orgs.forEach(org => {
            this.startAutoRefresh(org, intervalMs);
        });
    }
}

const autoRefresh = new AutoRefresh();

console.log('Starting auto-refresh for 30osob-studio...');
autoRefresh.startAutoRefresh('30osob-studio', 30000);
console.log('Auto-refresh initialization completed');

module.exports = autoRefresh;
