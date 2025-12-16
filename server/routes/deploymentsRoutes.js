const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/database');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_QUARTER = 90;

// GET deployments over time
router.get('/api/metrics/deployments-over-time', (req, res) => {
  try {
    const data = dbHelpers.getDeploymentsOverTime();
    res.json(data);
  } catch (e) {
    console.error('Get deployments over time error:', e);
    res.status(500).json({ message: 'Failed to get deployments over time' });
  }
});

// GET deployments per quarter
router.get('/api/metrics/deployments-per-quarter', async (req, res) => {
  try {
    let history = [];

    try {
      const flywayHistory = require('../flywayHistory');
      if (flywayHistory?.getFlywayHistory) {
        history = await flywayHistory.getFlywayHistory() ?? [];
      }
    } catch (e) {
      console.warn('Failed to get flyway history:', e);
    }

    const now = new Date();
    const quarterAgo = new Date(now.getTime() - (DAYS_IN_QUARTER * MS_PER_DAY));

    const validMigrations = history
      .filter(m => {
        // Check script field (which has V prefix) or version field
        const script = m.script ?? '';
        const type = m.type ?? '';
        // Include SQL type migrations (exclude UNDO and BASELINE)
        return type === 'SQL' && type !== 'UNDO_SQL' && type !== 'BASELINE';
      })
      .map(m => ({
        ...m,
        deployDate: new Date(m.installed_on || m.installedOn || m.installed || m.installedOnUtc)
      }))
      .filter(m => !isNaN(m.deployDate.getTime()));

    const recentDeployments = validMigrations.filter(m => m.deployDate >= quarterAgo);
    const count = recentDeployments.length;

    const oldestDate = validMigrations.length ?
      validMigrations.reduce((min, m) => m.deployDate < min ? m.deployDate : min, validMigrations[0].deployDate) :
      now;

    const availableDays = Math.min(DAYS_IN_QUARTER, Math.ceil((now - oldestDate) / MS_PER_DAY));
    const shouldExtrapolate = availableDays < DAYS_IN_QUARTER && availableDays > 0;
    const deploymentsPerQuarter = shouldExtrapolate && availableDays > 0 ?
      Math.round((count / availableDays) * DAYS_IN_QUARTER) :
      count;

    res.json({
      deploymentsPerQuarter,
      extrapolated: shouldExtrapolate,
      availableDays,
      totalMigrations: validMigrations.length
    });
  } catch (e) {
    console.error('Deployments per quarter error:', e);
    res.status(500).json({ deploymentsPerQuarter: 0, message: 'Failed to get deployments per quarter' });
  }
});

// Refresh deployments per quarter
router.get('/api/metrics/deployments-per-quarter/refresh', async (req, res) => {
  try {
    let history = [];

    try {
      const flywayHistory = require('../flywayHistory');
      if (flywayHistory?.getFlywayHistory) {
        history = await flywayHistory.getFlywayHistory() ?? [];
      }
    } catch (e) {
      console.warn('Failed to get flyway history:', e);
    }

    const now = new Date();
    const quarterAgo = new Date(now.getTime() - (DAYS_IN_QUARTER * MS_PER_DAY));

    const validMigrations = history
      .filter(m => {
        // Check script field (which has V prefix) or version field
        const script = m.script ?? '';
        const type = m.type ?? '';
        // Include SQL type migrations (exclude UNDO and BASELINE)
        return type === 'SQL' && type !== 'UNDO_SQL' && type !== 'BASELINE';
      })
      .map(m => ({
        ...m,
        deployDate: new Date(m.installed_on || m.installedOn || m.installed || m.installedOnUtc)
      }))
      .filter(m => !isNaN(m.deployDate.getTime()));

    const recentDeployments = validMigrations.filter(m => m.deployDate >= quarterAgo);
    const count = recentDeployments.length;

    const oldestDate = validMigrations.length ?
      validMigrations.reduce((min, m) => m.deployDate < min ? m.deployDate : min, validMigrations[0].deployDate) :
      now;

    const availableDays = Math.min(DAYS_IN_QUARTER, Math.ceil((now - oldestDate) / MS_PER_DAY));
    const shouldExtrapolate = availableDays < DAYS_IN_QUARTER && availableDays > 0;
    const deploymentsPerQuarter = shouldExtrapolate && availableDays > 0 ?
      Math.round((count / availableDays) * DAYS_IN_QUARTER) :
      count;

    // Update deployments over time
    const today = new Date().toISOString().slice(0, 10);
    const userMetrics = dbHelpers.getUserMetrics();
    dbHelpers.upsertDeploymentsOverTime({
      date: today,
      flywayDeployments: deploymentsPerQuarter,
      nonFlywayDeployments: userMetrics?.deploymentsPerQuarter || 0,
      timestamp: new Date().toISOString()
    });

    res.json({
      deploymentsPerQuarter,
      extrapolated: shouldExtrapolate,
      availableDays,
      totalMigrations: validMigrations.length
    });
  } catch (e) {
    console.error('Deployments per quarter refresh error:', e);
    res.status(500).json({ deploymentsPerQuarter: 0, message: 'Failed to refresh deployments per quarter' });
  }
});

module.exports = router;