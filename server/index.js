const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// serve JSON files placed in the server folder at /server/...
app.use('/server', express.static(path.join(__dirname)));

// register cache routes
const cacheRoutes = require('./routes/cacheRoutes');
app.use(cacheRoutes);

// register flyway routes
const flywayRoutes = require('./routes/flywayRoutes');
app.use(flywayRoutes);

// register metrics routes (deployments-per-quarter summary)
const metricsRoutes = require('./routes/metricsRoutes');
app.use(metricsRoutes);

// register JDBC connections routes under /api/jdbc-connections
const jdbcConnections = require('./jdbcConnections');
app.use('/api/jdbc-connections', jdbcConnections);

// User-defined metrics API layer
const userDefinedMetrics = require('./userDefinedMetrics');

app.get('/api/user-defined-metrics', (req, res) => {
    try {
        const metrics = userDefinedMetrics.getUserDefinedMetrics();
        res.json(metrics);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read metrics' });
    }
});

app.post('/api/user-defined-metrics', (req, res) => {
    try {
        const metrics = userDefinedMetrics.setUserDefinedMetrics(req.body);
        res.json({ success: true, metrics });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save metrics' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});