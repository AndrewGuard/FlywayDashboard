const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/database');

// GET user-defined metrics
router.get('/api/user-defined-metrics', (req, res) => {
  try {
    const metrics = dbHelpers.getUserMetrics();
    res.json(metrics || {
      deploymentsPerQuarter: 10,
      leadTimeDays: 20,
      scriptFailureRate: 5,
      savingsPerDeployment: 1000,
      implementationCost: 9751
    });
  } catch (e) {
    console.error('Get user metrics error:', e);
    res.status(500).json({ message: 'Failed to get user metrics' });
  }
});

// POST/PUT user-defined metrics
router.post('/api/user-defined-metrics', (req, res) => {
  try {
    const updated = dbHelpers.updateUserMetrics(req.body);
    res.json(updated);
  } catch (e) {
    console.error('Update user metrics error:', e);
    res.status(500).json({ message: 'Failed to update user metrics' });
  }
});

module.exports = router;