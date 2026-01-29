import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/database';
import * as flywayHistory from '../flywayHistory';

const router = Router();
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_QUARTER = 90;

// GET deployments over time
router.get('/api/metrics/deployments-over-time', (_req: Request, res: Response) => {
  try {
    const data = dbHelpers.getDeploymentsOverTime();
    res.json(data);
  } catch (e) {
    const err = e as Error;
    console.error('Get deployments over time error:', err);
    res.status(500).json({ message: 'Failed to get deployments over time' });
  }
});

// GET deployments per quarter
router.get('/api/metrics/deployments-per-quarter', async (_req: Request, res: Response) => {
  try {
    let history: any[] = [];

    try {
      if (DEMO_MODE) {
        // Demo mode: use mock data
        history = flywayHistory.getMockFlywayHistory() ?? [];
      } else {
        // Production mode: use real JDBC connections
        history = await flywayHistory.getFlywayHistory();
        if (!history || history.length === 0) {
          history = [];
        }
      }
    } catch (e) {
      const err = e as Error;
      console.warn('Failed to get flyway history:', err);
    }

    const now = new Date();
    const quarterAgo = new Date(now.getTime() - (DAYS_IN_QUARTER * MS_PER_DAY));

    const validMigrations = history
      .filter(m => {
        const type = m.type ?? '';
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

    const availableDays = Math.min(DAYS_IN_QUARTER, Math.ceil((now.getTime() - oldestDate.getTime()) / MS_PER_DAY));
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
    const err = e as Error;
    console.error('Deployments per quarter error:', err);
    res.status(500).json({ deploymentsPerQuarter: 0, message: 'Failed to get deployments per quarter' });
  }
});

// Refresh deployments per quarter
router.get('/api/metrics/deployments-per-quarter/refresh', async (_req: Request, res: Response) => {
  try {
    let history: any[] = [];

    try {
      if (flywayHistory?.getFlywayHistory) {
        history = await flywayHistory.getFlywayHistory() ?? [];
      }
    } catch (e) {
      const err = e as Error;
      console.warn('Failed to get flyway history:', err);
    }

    const now = new Date();
    const quarterAgo = new Date(now.getTime() - (DAYS_IN_QUARTER * MS_PER_DAY));

    const validMigrations = history
      .filter(m => {
        // Check script field (which has V prefix) or version field
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

    const availableDays = Math.min(DAYS_IN_QUARTER, Math.ceil((now.getTime() - oldestDate.getTime()) / MS_PER_DAY));
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
    const err = e as Error;
    console.error('Deployments per quarter refresh error:', err);
    res.status(500).json({ deploymentsPerQuarter: 0, message: 'Failed to refresh deployments per quarter' });
  }
});

export default router;
