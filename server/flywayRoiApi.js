// API endpoint to calculate and persist Flyway ROI
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { calculateFlywayROI } = require('./flywayRoiUtil');

const userMetricsPath = path.join(__dirname, 'user-defined-metrics.json');
const roiPath = path.join(__dirname, 'flyway-roi.json');

router.get('/flyway-roi', (req, res) => {
  try {
    const roiData = JSON.parse(fs.readFileSync(roiPath, 'utf8'));
    res.json(roiData);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read ROI' });
  }
});

router.post('/flyway-roi', (req, res) => {
  try {
    // Accept flywayMetrics from frontend, use user-defined metrics from file
    const flywayMetrics = req.body.flywayMetrics;
    const userMetrics = JSON.parse(fs.readFileSync(userMetricsPath, 'utf8'));

    // Validation: check for missing or invalid values
    const requiredFields = [
  'deploymentsPerQuarter', 'leadTimeDays', 'changeInDeploymentDurationDays',
      'peopleInvolved', 'averageSalary'
    ];
    const missing = [];
    for (const field of requiredFields) {
      const userVal = userMetrics[field];
      const flywayVal = flywayMetrics[field];
      if ((userVal === undefined || userVal === null || userVal === '' || isNaN(Number(userVal))) &&
          (flywayVal === undefined || flywayVal === null || flywayVal === '' || isNaN(Number(flywayVal)))) {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      const msg = `Cannot calculate ROI: missing or invalid values for: ${missing.join(', ')}`;
      fs.writeFileSync(roiPath, JSON.stringify({ roi: null, annualValue: null, annualCost: null, roiExplanation: msg }, null, 2), 'utf8');
      return res.json({ roi: null, annualValue: null, annualCost: null, roiExplanation: msg });
    }

    const result = calculateFlywayROI({ userMetrics, flywayMetrics });
    fs.writeFileSync(roiPath, JSON.stringify({
      roi: result.roi,
      annualValue: result.annualValue,
      annualCost: result.annualCost,
      roiExplanation: result.explanation
    }, null, 2), 'utf8');
    res.json({
      roi: result.roi,
      annualValue: result.annualValue,
      annualCost: result.annualCost,
      roiExplanation: result.explanation
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to calculate ROI' });
  }
});

module.exports = router;
