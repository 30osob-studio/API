const autoRefresh = require('../utils/autoRefresh');

const startAutoRefresh = async (req, res) => {
    try {
        const { org = '30osob-studio', interval } = req.body;
        const intervalMs = interval ? parseInt(interval) * 60 * 1000 : 10 * 60 * 1000;

        autoRefresh.startAutoRefresh(org, intervalMs);

        res.json({
            message: `Automatyczne odświeżanie uruchomione dla ${org}`,
            interval: `${intervalMs / 1000 / 60} minut`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
};

const stopAutoRefresh = async (req, res) => {
    try {
        const { org = '30osob-studio' } = req.params;

        autoRefresh.stopAutoRefresh(org);

        res.json({
            message: `Automatyczne odświeżanie zatrzymane dla ${org}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
};

const stopAllAutoRefresh = async (req, res) => {
    try {
        autoRefresh.stopAllAutoRefresh();

        res.json({
            message: "Wszystkie automatyczne odświeżania zostały zatrzymane",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
};

const changeInterval = async (req, res) => {
    try {
        const { org = '30osob-studio' } = req.params;
        const { interval } = req.body;

        if (!interval) {
            return res.status(400).json({ error: "Parametr 'interval' jest wymagany" });
        }

        const intervalMs = parseInt(interval) * 60 * 1000;
        autoRefresh.changeInterval(org, intervalMs);

        res.json({
            message: `Interwał zmieniony dla ${org}`,
            newInterval: `${intervalMs / 1000 / 60} minut`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
};

const getAutoRefreshStatus = async (req, res) => {
    try {
        const status = autoRefresh.getStatus();

        res.json({
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: "Wewnętrzny błąd serwera" });
    }
};

module.exports = {
    startAutoRefresh,
    stopAutoRefresh,
    stopAllAutoRefresh,
    changeInterval,
    getAutoRefreshStatus
};
