import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/database';

const router = Router();

// GET user-defined metrics
router.get('/api/user-defined-metrics', (_req: Request, res: Response) => {
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
    const err = e as Error;
    console.error('Get user metrics error:', err);
    res.status(500).json({ message: 'Failed to get user metrics' });
  }
});

// POST/PUT user-defined metrics
router.post('/api/user-defined-metrics', (req: Request, res: Response) => {
  try {
    console.log('Received POST body:', JSON.stringify(req.body));
    
    // Get previous lead time value to check if it changed
    const previousMetrics = dbHelpers.getUserMetrics();
    const previousLeadTime = previousMetrics?.leadTimeDays;
    const newLeadTime = req.body.leadTimeDays;
    
    // Update the user metrics
    const updated = dbHelpers.updateUserMetrics(req.body);
    console.log('Update successful, businessSize:', updated?.businessSize);
    
    // If lead time changed, update all historical baseline values to maintain flat line
    if (newLeadTime !== undefined && newLeadTime !== previousLeadTime) {
      console.log(`Updating historical baseline from ${previousLeadTime} to ${newLeadTime} days`);
      dbHelpers.updateAllBaselineLeadTimes(newLeadTime);
    }
    
    res.json(updated);
  } catch (e) {
    const err = e as Error;
    console.error('Update user metrics error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: 'Failed to update user metrics', error: err.message });
  }
});

export default router;
