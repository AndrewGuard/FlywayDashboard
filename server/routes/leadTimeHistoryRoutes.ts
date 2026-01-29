import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/database';

const router = Router();

// GET lead time history
router.get('/api/metrics/lead-time-history', (_req: Request, res: Response) => {
  try {
    const data = dbHelpers.getLeadTimeHistory();
    res.json(data);
  } catch (e) {
    const err = e as Error;
    console.error('Get lead time history error:', err);
    res.status(500).json({ message: 'Failed to get lead time history' });
  }
});

// Refresh lead time history
router.get('/api/metrics/lead-time-history/refresh', (_req: Request, res: Response) => {
  try {
    let flywayLeadTime = 0;
    let nonFlywayLeadTime = 0;

    // Get user-defined metrics for non-Flyway lead time
    try {
      const userData = dbHelpers.getUserMetrics();
      nonFlywayLeadTime = Number(userData?.leadTimeDays) || 0;
    } catch (e) {
      const err = e as Error;
      console.warn('Failed to get user metrics:', err);
    }

    // Get Flyway lead times
    try {
      const leadTimesData = dbHelpers.getLeadTimes();
      if (leadTimesData?.leadTimes?.length) {
        const validTimes = leadTimesData.leadTimes
          .map(lt => Number(lt.leadTimeDays))
          .filter(n => Number.isFinite(n) && n >= 0);
        if (validTimes.length) {
          flywayLeadTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
        }
      }
    } catch (e) {
      const err = e as Error;
      console.warn('Failed to get Flyway lead times:', err);
    }

    const today = new Date().toISOString().slice(0, 10);
    const newPoint = {
      date: today,
      flywayLeadTime: Math.max(0, Math.round(flywayLeadTime * 10) / 10),
      nonFlywayLeadTime: Math.max(0, nonFlywayLeadTime),
      timestamp: new Date().toISOString()
    };

    const data = dbHelpers.upsertLeadTimeHistory(newPoint);
    res.json(data);
  } catch (e) {
    const err = e as Error;
    console.error('Refresh lead time history error:', err);
    res.status(500).json({ message: 'Failed to refresh lead time history' });
  }
});

export default router;
