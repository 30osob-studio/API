const { fetchOrgReposWithLanguages, fetchOwner, fetchOwnerReposWithLanguages, fetchOwnerReadme, fetchOrganization, fetchOrgProfileReadme } = require('./githubApi');

class DataCache {
    constructor() {
        // Cache z TTL (Time To Live) - 30 sekund
        this.cache = new Map();
        this.lastRefresh = new Map();
        this.cacheTTL = 30 * 1000; // 30 sekund
    }

    isStale(cacheKey) {
        const lastRefresh = this.lastRefresh.get(cacheKey);
        if (!lastRefresh) return true;

        const now = Date.now();
        return (now - lastRefresh) > this.cacheTTL;
    }

    async getOrgRepos(org) {
        const cacheKey = `orgRepos_${org}`;

        // Sprawdź czy cache jest świeży
        if (!this.isStale(cacheKey) && this.cache.has(cacheKey)) {
            console.log(`Using cached data for ${org} (age: ${Math.floor((Date.now() - this.lastRefresh.get(cacheKey)) / 1000)}s)`);
            return this.cache.get(cacheKey);
        }

        // Pobierz świeże dane
        return await this.refreshOrgRepos(org);
    }

    async getOwner(org) {
        const cacheKey = `owner_${org}`;

        if (!this.isStale(cacheKey) && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return await this.refreshOwner(org);
    }

    async getOwnerRepos(org) {
        const cacheKey = `ownerRepos_${org}`;

        if (!this.isStale(cacheKey) && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return await this.refreshOwnerRepos(org);
    }

    async getOwnerReadme(org) {
        const cacheKey = `ownerReadme_${org}`;

        if (!this.isStale(cacheKey) && this.cache.get(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return await this.refreshOwnerReadme(org);
    }

    async getOrganization(org) {
        const cacheKey = `organization_${org}`;

        if (!this.isStale(cacheKey) && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return await this.refreshOrganization(org);
    }

    async getOrgProfileReadme(org) {
        const cacheKey = `orgProfileReadme_${org}`;

        if (!this.isStale(cacheKey) && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        return await this.refreshOrgProfileReadme(org);
    }

    async refreshOrgRepos(org) {
        const cacheKey = `orgRepos_${org}`;
        console.log(`Fetching fresh data for ${org} from GitHub API...`);

        const freshData = await fetchOrgReposWithLanguages(org);

        // Aktualizuj cache
        this.cache.set(cacheKey, freshData);
        this.lastRefresh.set(cacheKey, Date.now());

        console.log(`Data refreshed for ${org} at ${new Date().toISOString()}`);
        return freshData;
    }

    async refreshOwner(org) {
        const cacheKey = `owner_${org}`;
        const freshData = await fetchOwner(org);

        this.cache.set(cacheKey, freshData);
        this.lastRefresh.set(cacheKey, Date.now());

        return freshData;
    }

    async refreshOwnerRepos(org) {
        const cacheKey = `ownerRepos_${org}`;
        const freshData = await fetchOwnerReposWithLanguages(org);

        this.cache.set(cacheKey, freshData);
        this.lastRefresh.set(cacheKey, Date.now());

        return freshData;
    }

    async refreshOwnerReadme(org) {
        const cacheKey = `ownerReadme_${org}`;
        const freshData = await fetchOwnerReadme(org);

        this.cache.set(cacheKey, freshData);
        this.lastRefresh.set(cacheKey, Date.now());

        return freshData;
    }

    async refreshOrganization(org) {
        const cacheKey = `organization_${org}`;
        const freshData = await fetchOrganization(org);

        this.cache.set(cacheKey, freshData);
        this.lastRefresh.set(cacheKey, Date.now());

        return freshData;
    }

    async refreshOrgProfileReadme(org) {
        const cacheKey = `orgProfileReadme_${org}`;
        const freshData = await fetchOrgProfileReadme(org);

        this.cache.set(cacheKey, freshData);
        this.lastRefresh.set(cacheKey, Date.now());

        return freshData;
    }

    getCacheInfo() {
        const cacheInfo = {};

        for (const [key, lastRefresh] of this.lastRefresh.entries()) {
            const age = Date.now() - lastRefresh;
            const ageInSeconds = Math.floor(age / 1000);

            cacheInfo[key] = {
                age: `${ageInSeconds}s`,
                isStale: this.isStale(key),
                lastRefresh: new Date(lastRefresh).toISOString()
            };
        }

        return {
            cacheInfo,
            cacheTimeout: `${this.cacheTTL / 1000}s`,
            timestamp: new Date().toISOString()
        };
    }

    clearCache() {
        this.cache.clear();
        this.lastRefresh.clear();
        console.log('Cache cleared');
    }

    setCacheTimeout(timeoutMs) {
        this.cacheTTL = timeoutMs;
        console.log(`Cache TTL set to ${timeoutMs / 1000} seconds`);
    }
}

const dataCache = new DataCache();

module.exports = dataCache;
