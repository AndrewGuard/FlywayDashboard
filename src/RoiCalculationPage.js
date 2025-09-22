import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid } from '@mui/material';

// ROI calculation logic (copied from roiUtil.js)
function calculateROI(userMetrics) {
  if (!userMetrics) return { roi: null, roiExplanation: 'Missing metrics' };
  const dbaCount = Number(userMetrics.dbaCount) || 0;
  const dbaTimeSavedPercent = Number(userMetrics.dbaTimeSavedPercent) || 0;
  const dbaSalary = Number(userMetrics.dbaSalary) || 0;
  const developerCount = Number(userMetrics.developerCount) || 0;
  const developerTimeSavedPercent = Number(userMetrics.developerTimeSavedPercent) || 0;
  const developerSalary = Number(userMetrics.developerSalary) || 0;
  const flywayLicensingCost = Number(userMetrics.flywayLicensingCost) || 0;
  const estimatedImplementationHours = Number(userMetrics.estimatedImplementationHours) || 100;
  // Assume 50% developer, 50% dba for implementation effort
  const devImplCost = (developerSalary / 2080) * (estimatedImplementationHours * 0.5);
  const dbaImplCost = (dbaSalary / 2080) * (estimatedImplementationHours * 0.5);
  const implementationCost = devImplCost + dbaImplCost;
  const dbaSavings = dbaCount * (dbaTimeSavedPercent / 100) * dbaSalary;
  const developerSavings = developerCount * (developerTimeSavedPercent / 100) * developerSalary;
  const annualValue = dbaSavings + developerSavings - implementationCost;
  const annualCost = flywayLicensingCost + implementationCost;
  const roi = annualCost > 0 ? (annualValue - annualCost) / annualCost : null;
  const explanation = `ROI is calculated as the sum of efficiency gains for DBAs and developers (headcount × percent time saved × salary), minus the Flyway licensing cost and estimated implementation cost. Implementation cost is based on estimated hours × blended DBA/developer rate. ROI = (Value - Cost) / Cost. Value is the sum of DBA and developer savings minus implementation cost. Cost is the Flyway licensing cost plus implementation cost.`;
  return { roi, annualValue, annualCost, implementationCost, roiExplanation: explanation };
}

export default function RoiCalculationPage() {
  const [inputs, setInputs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInputs() {
      try {
        const res = await fetch('/api/user-defined-metrics');
        const data = await res.json();
        if (!('estimatedImplementationHours' in data)) {
          data.estimatedImplementationHours = 100;
        }
        setInputs(data);
        setLoading(false);
      } catch {
        setError('Failed to load metrics');
        setLoading(false);
      }
    }
    fetchInputs();
  }, []);

  const [saveStatus, setSaveStatus] = useState('');
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
    setSaveStatus('');
  };

  const handleSave = async () => {
    try {
      await fetch('/api/user-defined-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      setSaveStatus('Saved!');
      setTimeout(() => { window.location.hash = '/'; }, 500);
    } catch {
      setSaveStatus('Failed to save');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const { roi, annualValue, annualCost, implementationCost, roiExplanation } = calculateROI(inputs);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          How is ROI Calculated?
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {roiExplanation}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="DBA Count" name="dbaCount" type="number" value={inputs.dbaCount} onChange={handleChange} fullWidth margin="normal" />
              <TextField label="DBA Time Saved (%)" name="dbaTimeSavedPercent" type="number" value={inputs.dbaTimeSavedPercent} onChange={handleChange} fullWidth margin="normal" />
              <TextField label="DBA Salary ($)" name="dbaSalary" type="number" value={inputs.dbaSalary} onChange={handleChange} fullWidth margin="normal" />
              <TextField label="Developer Count" name="developerCount" type="number" value={inputs.developerCount} onChange={handleChange} fullWidth margin="normal" />
              <TextField label="Estimated Time to Implement Flyway (hours)" name="estimatedImplementationHours" type="number" value={inputs.estimatedImplementationHours} onChange={handleChange} fullWidth margin="normal" helperText="Estimate of total hours for both DBAs and developers to implement Flyway. Default: 100 hours." />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Developer Time Saved (%)" name="developerTimeSavedPercent" type="number" value={inputs.developerTimeSavedPercent} onChange={handleChange} fullWidth margin="normal" />
              <TextField label="Developer Salary ($)" name="developerSalary" type="number" value={inputs.developerSalary} onChange={handleChange} fullWidth margin="normal" />
              <TextField label="Flyway Licensing Cost ($)" name="flywayLicensingCost" type="number" value={inputs.flywayLicensingCost} onChange={handleChange} fullWidth margin="normal" />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">ROI Results</Typography>
          <Typography sx={{ mt: 1 }}>
            <b>ROI:</b> {roi !== null ? (roi * 100).toFixed(1) + '%' : 'N/A'}
          </Typography>
          <Typography>
            <b>Value to Business (after implementation cost):</b> {annualValue !== null ? '$' + annualValue.toLocaleString() : 'N/A'}
          </Typography>
          <Typography>
            <b>Annual Cost (including implementation):</b> {annualCost !== null ? '$' + annualCost.toLocaleString() : 'N/A'}
          </Typography>
          <Typography>
            <b>Estimated Implementation Cost:</b> {implementationCost !== null ? '$' + implementationCost.toLocaleString(undefined, {maximumFractionDigits: 0}) : 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outlined" href="#/user-defined-metrics">
            Edit All Inputs
          </Button>
          <Button variant="outlined" href="#/">
            Home
          </Button>
        </Box>
        {saveStatus && (
          <Typography sx={{ mt: 2 }} color={saveStatus === 'Saved!' ? 'success.main' : 'error'}>
            {saveStatus}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
