import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/database';
import * as flywayHistory from '../flywayHistory';
import { calculateLeadTimes, sendErrorResponse } from '../utils/migrationDataProcessing';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = Router();

// GET lead times
router.get('/api/metrics/lead-times', cacheMiddleware(30), (_req: Request, res: Response) => {
  try {
    const data = dbHelpers.getLeadTimes();
    res.json(data);
  } catch (e) {
    sendErrorResponse(res, 500, 'Failed to get lead times', e as Error);
  }
});

// Refresh lead times from flyway history
router.get('/api/metrics/lead-times/refresh', async (_req: Request, res: Response) => {
  try {
    let prodHistory: any[] = [];

    // Get PRODUCTION flyway history only
    try {
      if (flywayHistory?.getFlywayHistoryProd) {
        prodHistory = await flywayHistory.getFlywayHistoryProd() ?? [];
      }
    } catch (e) {
      console.warn('Failed to get flyway history:', e);
    }

    const leadTimes = calculateLeadTimes(prodHistory);

    console.log(`Calculated lead times for ${leadTimes.length} production migrations`);
    
    // Clear existing data and insert fresh calculations
    const data = dbHelpers.clearAndInsertLeadTimes(leadTimes);
    res.json(data);
  } catch (e) {
    sendErrorResponse(res, 500, 'Failed to refresh lead times', e as Error);
  }
});

export default router;
