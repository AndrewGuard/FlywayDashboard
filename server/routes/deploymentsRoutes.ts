import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/database';
import * as flywayHistory from '../flywayHistory';
import { calculateDeploymentsPerQuarter, sendErrorResponse } from '../utils/migrationDataProcessing';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = Router();
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// GET deployments over time
router.get('/api/metrics/deployments-over-time', (_req: Request, res: Response) => {
  try {
    const data = dbHelpers.getDeploymentsOverTime();
    res.json(data);
  } catch (e) {
    sendErrorResponse(res, 500, 'Failed to get deployments over time', e as Error);
  }
});

// GET deployments per quarter
router.get('/api/metrics/deployments-per-quarter', cacheMiddleware(30), async (_req: Request, res: Response) => {
  try {
    let history: any[] = [];

    try {
      if (DEMO_MODE) {
        history = flywayHistory.getMockFlywayHistory() ?? [];
      } else {
        history = await flywayHistory.getFlywayHistory();
        if (!history || history.length === 0) {
          history = [];
        }
      }
    } catch (e) {
      console.warn('Failed to get flyway history:', e);
    }

    const result = calculateDeploymentsPerQuarter(history);
    res.json(result);
  } catch (e) {
    sendErrorResponse(res, 500, 'Failed to get deployments per quarter', e as Error);
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
      console.warn('Failed to get flyway history:', e);
    }

    const result = calculateDeploymentsPerQuarter(history);

    // Update deployments over time
    const today = new Date().toISOString().slice(0, 10);
    const userMetrics = dbHelpers.getUserMetrics();
    dbHelpers.upsertDeploymentsOverTime({
      date: today,
      flywayDeployments: result.deploymentsPerQuarter,
      nonFlywayDeployments: userMetrics?.deploymentsPerQuarter || 0,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (e) {
    sendErrorResponse(res, 500, 'Failed to refresh deployments per quarter', e as Error);
  }
});

export default router;
