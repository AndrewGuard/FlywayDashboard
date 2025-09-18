// Serves migration-lead-times.json for frontend metrics widgets
const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/migration-lead-times.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'migration-lead-times.json'));
});

module.exports = router;
