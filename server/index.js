const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/jdbc-connections', require('./jdbcConnections'));
app.use('/server', require('./leadTimeApi'));
app.use('/server', require('./flywayRoiApi'));
app.use('/server', require('./flywayInferredMetricsApi'));

// Add /api/flyway/history/all endpoint for UndoMigrationsWidget compatibility
const { getFlywayHistory } = require('./flywayHistory');
app.get('/api/flyway/history/all', async (req, res) => {
	try {
		const results = await getFlywayHistory();
		// Return as { dbName: [history, ...], ... }
		const out = {};
		for (const db of results) {
			out[db.dbName] = db.history || [];
		}
		res.json(out);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});



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

app.listen(5000, () => console.log('API running on port 5000'));