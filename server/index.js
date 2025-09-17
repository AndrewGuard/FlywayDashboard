const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/jdbc-connections', require('./jdbcConnections'));

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

app.listen(5000, () => console.log('API running on port 5000'));