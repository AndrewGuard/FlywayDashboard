const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/jdbc-connections', require('./jdbcConnections'));

app.listen(5000, () => console.log('API running on port 5000'));