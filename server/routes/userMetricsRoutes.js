const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/database');

// GET user-defined metrics
router.get('/api/user-defined-metrics', (req, res) => {
  try {
    const metrics = dbHelpers.getUserMetrics();
    res.json(metrics || {
      businessSize: 'medium',
      deploymentsPerQuarter: 12,
      leadTimeDays: 30,
      scriptFailureRate: 15,
      savingsPerDeployment: 5000,
      implementationCost: 50000,
      costOfDelayPerDay: 350,
      dbaHoursPerDeployment: 8,
      developerHoursPerDeployment: 4,
      dbaAnnualSalary: 175000,
      developerAnnualSalary: 155000
    });
  } catch (e) {
    console.error('Get user metrics error:', e);
    res.status(500).json({ message: 'Failed to get user metrics' });
  }
});

// POST/PUT user-defined metrics
router.post('/api/user-defined-metrics', (req, res) => {
  try {
    console.log('Received POST body:', JSON.stringify(req.body));
    const updated = dbHelpers.updateUserMetrics(req.body);
    console.log('Update successful, businessSize:', updated?.businessSize);
    res.json(updated);
  } catch (e) {
    console.error('Update user metrics error:', e.message);
    console.error('Stack:', e.stack);
    res.status(500).json({ message: 'Failed to update user metrics', error: e.message });
  }
});

module.exports = router;