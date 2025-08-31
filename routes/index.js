const express = require("express");
const router = express.Router();
const about = require("./about");
const repos = require("./repos");
const owner = require("./owner");
const autoRefresh = require("./autoRefresh");

router.use("/about", about);
router.use("/repos", repos);
router.use("/owner", owner);
router.use("/auto-refresh", autoRefresh);

// Live data endpoint with refresh counter
router.get("/live-data", async (req, res) => {
    try {
        // Get fresh data
        const repos = require("../controllers/reposController");
        const data = await repos.getRepos(req, res);

        // Add live metadata
        const liveData = {
            ...data,
            live_metadata: {
                refresh_count: global.refreshCount || 0,
                last_refresh: new Date().toISOString(),
                server_time: new Date().toISOString(),
                auto_refresh_interval: "30 seconds",
                cache_status: "enabled (30s TTL)",
                rate_limiting: "enabled (1s delay)"
            }
        };

        res.json(liveData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple live data page
router.get("/live", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic API - Live Data</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { flex: 1; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6; }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; margin-top: 10px; font-size: 1.1em; }
        .data-box { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #dee2e6; }
        .repo-item { margin: 15px 0; padding: 15px; background-color: white; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .live-seconds { font-weight: bold; color: #007bff; font-size: 1.2em; }
        .live-time { font-family: monospace; background-color: #f8f9fa; padding: 5px 10px; border-radius: 5px; border: 1px solid #dee2e6; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        .controls { text-align: center; margin: 20px 0; }
        button { padding: 12px 24px; margin: 10px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-danger { background-color: #dc3545; color: white; }
        .btn:hover { opacity: 0.8; transform: translateY(-2px); transition: all 0.2s; }
        .auto-refresh-indicator { background-color: #28a745; color: white; padding: 10px; border-radius: 20px; display: inline-block; margin: 10px 0; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
        .refresh-counter { background-color: #007bff; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }
        .info-box { background-color: #e7f3ff; border: 2px solid #b3d9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Dynamic API - Live Data</h1>
            <p>Dane są automatycznie odświeżane co sekundę przez JavaScript! Cache serwera: 30 sekund.</p>
            <div class="auto-refresh-indicator">🔄 Auto-Refresh: AKTYWNY (co 1s)</div>
        </div>
        
        <div class="info-box">
            <h3>ℹ️ Informacje o systemie:</h3>
            <p><strong>Cache serwera:</strong> 30 sekund TTL (Time To Live)</p>
            <p><strong>Auto-refresh serwera:</strong> co 30 sekund (GitHub API)</p>
            <p><strong>Auto-refresh frontend:</strong> co 1 sekundę (JavaScript)</p>
            <p><strong>Rate limiting:</strong> 1 sekunda między żądaniami GitHub API</p>
            <p><strong>Retry logic:</strong> automatyczne ponowne próby przy błędach</p>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number" id="refreshCount">0</div>
                <div class="stat-label">Odświeżeń</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="lastUpdateTime">-</div>
                <div class="stat-label">Ostatnia aktualizacja</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="connectionTime">0s</div>
                <div class="stat-label">Czas połączenia</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="refreshData()">🔄 Odśwież teraz</button>
            <button class="btn btn-success" onclick="toggleAutoRefresh()" id="toggleBtn">⏸️ Zatrzymaj Auto-Refresh</button>
            <button class="btn btn-danger" onclick="clearData()">🗑️ Wyczyść dane</button>
        </div>
        
        <div class="data-box">
            <h3>📊 Dane w czasie rzeczywistym:</h3>
            <div id="liveData">Ładowanie...</div>
        </div>
        
        <div class="data-box">
            <h3>📝 Logi:</h3>
            <div id="logs" style="max-height: 200px; overflow-y: auto; background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px;"></div>
        </div>
    </div>

    <script>
        let autoRefreshEnabled = true;
        let refreshCount = 0;
        let connectionStartTime = new Date();
        let lastData = null;
        
        // Auto-refresh data every second
        function startAutoRefresh() {
            setInterval(() => {
                if (autoRefreshEnabled) {
                    refreshData();
                }
            }, 1000);
        }
        
        function refreshData() {
            fetch('/live-data')
                .then(response => response.json())
                .then(data => {
                    refreshCount++;
                    lastData = data;
                    updateLiveData(data);
                    updateStats();
                    log('Data refreshed automatically');
                })
                .catch(error => {
                    log('Error refreshing data: ' + error.message);
                });
        }
        
        function updateLiveData(data) {
            const liveDataEl = document.getElementById('liveData');
            
            if (data && data.repos && Array.isArray(data.repos)) {
                let html = '<div class="repo-item">';
                html += '<strong>📊 Metadane:</strong><br>';
                if (data.live_metadata) {
                    html += '🔄 Liczba odświeżeń: ' + data.live_metadata.refresh_count + '<br>';
                    html += '⏰ Ostatnie odświeżenie: ' + new Date(data.live_metadata.last_refresh).toLocaleString() + '<br>';
                    html += '🕐 Czas serwera: ' + new Date(data.live_metadata.server_time).toLocaleString() + '<br>';
                    html += '⚡ Interwał auto-refresh: ' + data.live_metadata.auto_refresh_interval + '<br>';
                    html += '💾 Status cache: ' + data.live_metadata.cache_status + '<br>';
                    html += '🚦 Rate limiting: ' + data.live_metadata.rate_limiting + '<br>';
                }
                html += '</div>';
                
                // Show first few repos with live data
                data.repos.slice(0, 3).forEach(repo => {
                    html += '<div class="repo-item">';
                    html += '<strong>📁 ' + repo.name + '</strong><br>';
                    if (repo.live_seconds_elapsed !== undefined) {
                        html += '<span class="live-seconds">⏱️ ' + repo.live_seconds_elapsed + ' sekund temu</span><br>';
                    }
                    if (repo.live_time_formatted) {
                        html += '<span class="live-time">🕐 ' + repo.live_time_formatted + '</span><br>';
                    }
                    if (repo.last_change) {
                        html += '📅 ' + repo.last_change + '<br>';
                    }
                    if (repo.current_timestamp) {
                        html += '<span class="timestamp">🔄 ' + new Date(repo.current_timestamp).toLocaleString() + '</span>';
                    }
                    html += '</div>';
                });
                
                liveDataEl.innerHTML = html;
            } else {
                liveDataEl.innerHTML = '<div class="repo-item">Brak danych do wyświetlenia</div>';
            }
        }
        
        function updateStats() {
            document.getElementById('refreshCount').textContent = refreshCount;
            document.getElementById('lastUpdateTime').textContent = new Date().toLocaleTimeString();
        }
        
        function updateConnectionTime() {
            const now = new Date();
            const diff = Math.floor((now - connectionStartTime) / 1000);
            document.getElementById('connectionTime').textContent = diff + 's';
        }
        
        function toggleAutoRefresh() {
            const btn = document.getElementById('toggleBtn');
            if (autoRefreshEnabled) {
                // Stop auto-refresh
                fetch('/auto-refresh/stop/30osob-studio', { method: 'DELETE' })
                    .then(() => {
                        autoRefreshEnabled = false;
                        btn.textContent = '▶️ Uruchom Auto-Refresh';
                        btn.className = 'btn btn-success';
                        log('Auto-refresh stopped');
                    });
            } else {
                // Start auto-refresh
                fetch('/auto-refresh/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ org: '30osob-studio', interval: 30 })
                })
                .then(() => {
                    autoRefreshEnabled = true;
                    btn.textContent = '⏸️ Zatrzymaj Auto-Refresh';
                    btn.className = 'btn btn-danger';
                    log('Auto-refresh started');
                });
            }
        }
        
        function clearData() {
            document.getElementById('liveData').innerHTML = '<div class="repo-item">Dane wyczyszczone</div>';
            log('Data cleared');
        }
        
        function log(message) {
            const logsEl = document.getElementById('logs');
            const timestamp = new Date().toLocaleTimeString();
            logsEl.innerHTML = '[' + timestamp + '] ' + message + '<br>' + logsEl.innerHTML;
        }
        
        // Start auto-refresh when page loads
        startAutoRefresh();
        
        // Update connection time every second
        setInterval(updateConnectionTime, 1000);
        
        // Initial data load
        refreshData();
        
        // Log page load
        log('Page loaded, auto-refresh initiated');
    </script>
</body>
</html>
    `);
});

// SSE endpoint for real-time data updates
router.get("/sse", (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'SSE connection established',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Store this connection for broadcasting
    if (!global.sseConnections) {
        global.sseConnections = new Set();
    }
    global.sseConnections.add(res);

    // Remove connection when client disconnects
    req.on('close', () => {
        global.sseConnections.delete(res);
        console.log('SSE connection closed');
    });

    // Keep connection alive
    const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({
            type: 'keepalive',
            timestamp: new Date().toISOString()
        })}\n\n`);
    }, 30000); // Every 30 seconds

    req.on('close', () => {
        clearInterval(keepAlive);
    });
});

// Function to broadcast SSE updates (will be called from server.js)
global.broadcastSSE = function (data) {
    if (global.sseConnections) {
        global.sseConnections.forEach(client => {
            client.write(`data: ${JSON.stringify(data)}\n\n`);
        });
    }
};

// SSE test page
router.get("/sse-test", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic API - SSE Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; margin: 15px 0; border-radius: 8px; font-weight: bold; }
        .connected { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .disconnected { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .data-box { background-color: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #dee2e6; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        .live-data { background-color: #e7f3ff; border: 2px solid #b3d9ff; }
        .repo-item { margin: 15px 0; padding: 15px; background-color: white; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .live-seconds { font-weight: bold; color: #007bff; font-size: 1.1em; }
        .live-time { font-family: monospace; background-color: #f8f9fa; padding: 5px 10px; border-radius: 5px; border: 1px solid #dee2e6; }
        .update-counter { background-color: #28a745; color: white; padding: 5px 10px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-danger { background-color: #dc3545; color: white; }
        .btn:hover { opacity: 0.8; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { flex: 1; text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Dynamic API - SSE Test (Server-Sent Events)</h1>
        <p>Ta strona automatycznie odświeża dane co sekundę przez SSE! Nie musisz odświeżać strony.</p>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number" id="updateCount">0</div>
                <div class="stat-label">Aktualizacji</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="lastUpdateTime">-</div>
                <div class="stat-label">Ostatnia aktualizacja</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="connectionTime">-</div>
                <div class="stat-label">Czas połączenia</div>
            </div>
        </div>
        
        <div id="status" class="status disconnected">
            Status: Rozłączony
        </div>
        
        <div class="data-box">
            <h3>📊 Ostatnie dane z SSE:</h3>
            <div id="lastUpdate" class="timestamp">Brak danych</div>
            <div id="sseData">Oczekiwanie na połączenie...</div>
        </div>
        
        <div class="data-box live-data">
            <h3>🔄 Dane w czasie rzeczywistym:</h3>
            <div id="liveData">Ładowanie...</div>
        </div>
        
        <div class="data-box">
            <h3>⚡ Kontrola:</h3>
            <button class="btn btn-primary" onclick="refreshData()">Odśwież teraz</button>
            <button class="btn btn-success" onclick="toggleAutoRefresh()" id="toggleBtn">Zatrzymaj Auto-Refresh</button>
            <button class="btn btn-danger" onclick="clearData()">Wyczyść dane</button>
        </div>
        
        <div class="data-box">
            <h3>📝 Logi:</h3>
            <div id="logs" style="max-height: 200px; overflow-y: auto; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;"></div>
        </div>
    </div>

    <script>
        let eventSource;
        let isConnected = false;
        let autoRefreshEnabled = true;
        let lastData = null;
        let updateCount = 0;
        let connectionStartTime = null;
        
        function connect() {
            if (eventSource) {
                eventSource.close();
            }
            
            eventSource = new EventSource('/sse');
            connectionStartTime = new Date();
            
            eventSource.onopen = function() {
                isConnected = true;
                updateStatus('Połączony przez SSE', true);
                log('SSE connection opened');
                updateConnectionTime();
            };
            
            eventSource.onmessage = function(event) {
                try {
                    const message = JSON.parse(event.data);
                    handleSSEMessage(message);
                } catch (error) {
                    log('Error parsing SSE message: ' + error.message);
                }
            };
            
            eventSource.onerror = function(error) {
                isConnected = false;
                updateStatus('Błąd połączenia SSE', false);
                log('SSE connection error: ' + error);
                // Try to reconnect after 3 seconds
                setTimeout(connect, 3000);
            };
        }
        
        function handleSSEMessage(message) {
            log('Received SSE message: ' + message.type);
            
            if (message.type === 'connection') {
                updateStatus('Połączony przez SSE', true);
                document.getElementById('lastUpdate').textContent = 'Połączono: ' + new Date(message.timestamp).toLocaleString();
            }
            
            if (message.type === 'data_update') {
                updateCount++;
                lastData = message.data;
                updateLiveData(message.data);
                document.getElementById('lastUpdate').textContent = 'Ostatnia aktualizacja: ' + new Date(message.timestamp).toLocaleString();
                document.getElementById('updateCount').textContent = updateCount;
                updateLastUpdateTime();
            }
            
            if (message.type === 'keepalive') {
                // Just keep connection alive, no need to log
            }
        }
        
        function updateStatus(text, connected) {
            const statusEl = document.getElementById('status');
            statusEl.textContent = 'Status: ' + text;
            statusEl.className = 'status ' + (connected ? 'connected' : 'disconnected');
        }
        
        function updateLiveData(data) {
            const liveDataEl = document.getElementById('liveData');
            
            if (data && data.data && Array.isArray(data.data)) {
                let html = '<div class="repo-item">';
                html += '<strong>Organizacja:</strong> ' + (data.org || 'N/A') + '<br>';
                html += '<strong>Typ aktualizacji:</strong> ' + (data.updateType || 'N/A') + '<br>';
                html += '<strong>Liczba repozytoriów:</strong> ' + data.data.length + '<br>';
                html += '<strong>Timestamp:</strong> ' + new Date().toLocaleString();
                html += '</div>';
                
                // Show first few repos with live data
                data.data.slice(0, 3).forEach(repo => {
                    html += '<div class="repo-item">';
                    html += '<strong>📁 ' + repo.name + '</strong><br>';
                    if (repo.live_seconds_elapsed !== undefined) {
                        html += '<span class="live-seconds">⏱️ ' + repo.live_seconds_elapsed + ' sekund temu</span><br>';
                    }
                    if (repo.live_time_formatted) {
                        html += '<span class="live-time">🕐 ' + repo.live_time_formatted + '</span><br>';
                    }
                    if (repo.last_change) {
                        html += '📅 ' + repo.last_change + '<br>';
                    }
                    if (repo.current_timestamp) {
                        html += '<span class="timestamp">🔄 ' + new Date(repo.current_timestamp).toLocaleString() + '</span>';
                    }
                    html += '</div>';
                });
                
                liveDataEl.innerHTML = html;
            } else {
                liveDataEl.innerHTML = '<div class="repo-item">Brak danych do wyświetlenia</div>';
            }
        }
        
        function refreshData() {
            if (isConnected) {
                // Request fresh data
                fetch('/repos?fresh=true')
                    .then(response => response.json())
                    .then(data => {
                        updateLiveData({
                            org: '30osob-studio',
                            data: data,
                            updateType: 'manual_refresh'
                        });
                        log('Manual refresh completed');
                    })
                    .catch(error => {
                        log('Error fetching data: ' + error.message);
                    });
            }
        }
        
        function toggleAutoRefresh() {
            const btn = document.getElementById('toggleBtn');
            if (autoRefreshEnabled) {
                // Stop auto-refresh
                fetch('/auto-refresh/stop/30osob-studio', { method: 'DELETE' })
                    .then(() => {
                        autoRefreshEnabled = false;
                        btn.textContent = 'Uruchom Auto-Refresh';
                        btn.className = 'btn btn-success';
                        log('Auto-refresh stopped');
                    });
            } else {
                // Start auto-refresh
                fetch('/auto-refresh/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ org: '30osob-studio', interval: 1 })
                })
                .then(() => {
                    autoRefreshEnabled = true;
                    btn.textContent = 'Zatrzymaj Auto-Refresh';
                    btn.className = 'btn btn-danger';
                    log('Auto-refresh started');
                });
            }
        }
        
        function clearData() {
            document.getElementById('liveData').innerHTML = '<div class="repo-item">Dane wyczyszczone</div>';
            document.getElementById('sseData').innerHTML = 'Dane wyczyszczone';
            log('Data cleared');
        }
        
        function log(message) {
            const logsEl = document.getElementById('logs');
            const timestamp = new Date().toLocaleTimeString();
            logsEl.innerHTML = '[' + timestamp + '] ' + message + '<br>' + logsEl.innerHTML;
        }
        
        function updateConnectionTime() {
            if (connectionStartTime) {
                const now = new Date();
                const diff = Math.floor((now - connectionStartTime) / 1000);
                document.getElementById('connectionTime').textContent = diff + 's';
            }
        }
        
        function updateLastUpdateTime() {
            const now = new Date();
            document.getElementById('lastUpdateTime').textContent = now.toLocaleTimeString();
        }
        
        // Connect when page loads
        connect();
        
        // Update connection time every second
        setInterval(updateConnectionTime, 1000);
        
        // Initial data load
        refreshData();
        
        // Log page load
        log('Page loaded, SSE connection initiated');
    </script>
</body>
</html>
    `);
});

// WebSocket test endpoint (kept for compatibility)
router.get("/ws-test", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic API - WebSocket Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        .data-box { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #dee2e6; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        .live-data { background-color: #e7f3ff; border: 1px solid #b3d9ff; }
        .repo-item { margin: 10px 0; padding: 10px; background-color: white; border-radius: 3px; border: 1px solid #ddd; }
        .live-seconds { font-weight: bold; color: #007bff; }
        .live-time { font-family: monospace; background-color: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Dynamic API - WebSocket Test</h1>
        <p>Ta strona automatycznie odświeża dane co sekundę przez WebSocket!</p>
        
        <div id="status" class="status disconnected">
            Status: Rozłączony
        </div>
        
        <div class="data-box">
            <h3>📊 Ostatnie dane z WebSocket:</h3>
            <div id="lastUpdate" class="timestamp">Brak danych</div>
            <div id="wsData">Oczekiwanie na połączenie...</div>
        </div>
        
        <div class="data-box live-data">
            <h3>🔄 Dane w czasie rzeczywistym:</h3>
            <div id="liveData">Ładowanie...</div>
        </div>
        
        <div class="data-box">
            <h3>⚡ Kontrola:</h3>
            <button onclick="refreshData()">Odśwież teraz</button>
            <button onclick="toggleAutoRefresh()" id="toggleBtn">Zatrzymaj Auto-Refresh</button>
        </div>
    </div>

    <script>
        let ws;
        let isConnected = false;
        let autoRefreshEnabled = true;
        let lastData = null;
        
        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + window.location.host;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                isConnected = true;
                updateStatus('Połączony', true);
                console.log('WebSocket connected');
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                isConnected = false;
                updateStatus('Rozłączony', false);
                console.log('WebSocket disconnected');
                // Try to reconnect after 3 seconds
                setTimeout(connect, 3000);
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                updateStatus('Błąd połączenia', false);
            };
        }
        
        function handleWebSocketMessage(message) {
            console.log('Received WebSocket message:', message);
            
            if (message.type === 'connection') {
                updateStatus('Połączony', true);
                document.getElementById('lastUpdate').textContent = 'Połączono: ' + new Date(message.timestamp).toLocaleString();
            }
            
            if (message.type === 'data_update') {
                lastData = message.data;
                updateLiveData(message.data);
                document.getElementById('lastUpdate').textContent = 'Ostatnia aktualizacja: ' + new Date(message.timestamp).toLocaleString();
            }
        }
        
        function updateStatus(text, connected) {
            const statusEl = document.getElementById('status');
            statusEl.textContent = 'Status: ' + text;
            statusEl.className = 'status ' + (connected ? 'connected' : 'disconnected');
        }
        
        function updateLiveData(data) {
            const liveDataEl = document.getElementById('liveData');
            
            if (data && data.data && Array.isArray(data.data)) {
                let html = '<div class="repo-item">';
                html += '<strong>Organizacja:</strong> ' + (data.org || 'N/A') + '<br>';
                html += '<strong>Typ aktualizacji:</strong> ' + (data.updateType || 'N/A') + '<br>';
                html += '<strong>Liczba repozytoriów:</strong> ' + data.data.length + '<br>';
                html += '<strong>Timestamp:</strong> ' + new Date().toLocaleString();
                html += '</div>';
                
                // Show first few repos with live data
                data.data.slice(0, 3).forEach(repo => {
                    html += '<div class="repo-item">';
                    html += '<strong>📁 ' + repo.name + '</strong><br>';
                    if (repo.live_seconds_elapsed !== undefined) {
                        html += '<span class="live-seconds">⏱️ ' + repo.live_seconds_elapsed + ' sekund temu</span><br>';
                    }
                    if (repo.live_time_formatted) {
                        html += '<span class="live-time">🕐 ' + repo.live_time_formatted + '</span><br>';
                    }
                    if (repo.last_change) {
                        html += '📅 ' + repo.last_change + '<br>';
                    }
                    if (repo.current_timestamp) {
                        html += '<span class="timestamp">🔄 ' + new Date(repo.current_timestamp).toLocaleString() + '</span>';
                    }
                    html += '</div>';
                });
                
                liveDataEl.innerHTML = html;
            } else {
                liveDataEl.innerHTML = '<div class="repo-item">Brak danych do wyświetlenia</div>';
            }
        }
        
        function refreshData() {
            if (isConnected) {
                // Request fresh data
                fetch('/repos?fresh=true')
                    .then(response => response.json())
                    .then(data => {
                        updateLiveData({
                            org: '30osob-studio',
                            data: data,
                            updateType: 'manual_refresh'
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                    });
            }
        }
        
        function toggleAutoRefresh() {
            const btn = document.getElementById('toggleBtn');
            if (autoRefreshEnabled) {
                // Stop auto-refresh
                fetch('/auto-refresh/stop/30osob-studio', { method: 'DELETE' })
                    .then(() => {
                        autoRefreshEnabled = false;
                        btn.textContent = 'Uruchom Auto-Refresh';
                        btn.style.backgroundColor = '#28a745';
                    });
            } else {
                // Start auto-refresh
                fetch('/auto-refresh/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ org: '30osob-studio', interval: 1 })
                })
                .then(() => {
                    autoRefreshEnabled = true;
                    btn.textContent = 'Zatrzymaj Auto-Refresh';
                    btn.style.backgroundColor = '#dc3545';
                });
            }
        }
        
        // Connect when page loads
        connect();
        
        // Initial data load
        refreshData();
    </script>
</body>
</html>
    `);
});

module.exports = router;
