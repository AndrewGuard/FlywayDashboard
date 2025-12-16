import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, Box } from '@mui/material';

const initialInputs = {
  deploymentsPerQuarter: '',
  leadTimeDays: '',
  scriptFailureRate: '',
  deploymentDurationDays: '',
  peopleInvolved: '',
  averageSalary: '',
  numberOfDevelopers: 10,
  flywayLicensingCost: 30000,
  dbaCount: 25,
  dbaTimeSavedPercent: 25,
  dbaSalary: 125000,
  developerCount: 50,
  developerTimeSavedPercent: 25,
  developerSalary: 100000,
};

const UserDefinedMetricsPage = () => {

  const [inputs, setInputs] = useState(initialInputs);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/user-defined-metrics')
      .then(res => res.json())
      .then(data => {
        setInputs({
          deploymentsPerQuarter: data.deploymentsPerQuarter ?? 20,
          leadTimeDays: data.leadTimeDays ?? 15,
          scriptFailureRate: data.scriptFailureRate ?? 10,
          deploymentDurationDays: data.deploymentDurationDays ?? 14,
          peopleInvolved: data.peopleInvolved ?? 3,
          averageSalary: data.averageSalary ?? 150000,
          numberOfDevelopers: data.numberOfDevelopers ?? 10,
          flywayLicensingCost: data.flywayLicensingCost ?? ((data.numberOfDevelopers ?? 10) * 3000),
          dbaCount: data.dbaCount ?? 25,
          dbaTimeSavedPercent: data.dbaTimeSavedPercent ?? 25,
          dbaSalary: data.dbaSalary ?? 125000,
          developerCount: data.developerCount ?? 50,
          developerTimeSavedPercent: data.developerTimeSavedPercent ?? 25,
          developerSalary: data.developerSalary ?? 100000,
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load metrics');
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newInputs = { ...inputs, [name]: value };
    // If numberOfDevelopers changes, auto-update flywayLicensingCost
    if (name === 'numberOfDevelopers') {
      const num = Number(value) || 0;
      newInputs.flywayLicensingCost = num * 3000;
    }
    setInputs(newInputs);
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch('/api/user-defined-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
    })
      .then(res => res.json())
      .then(() => {
        setSaved(true);
        setLoading(false);
  setTimeout(() => { window.location.hash = ''; }, 500); // Redirect to home after short delay
      })
      .catch(() => {
        setError('Failed to save metrics');
        setLoading(false);
      });
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Deployment Metrics Without Flyway (Input Data)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            For deployments not tracked by Flyway, enter your own metrics below.
          </Typography>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <form onSubmit={handleSave}>
              <TextField
                label="Number of Deployments per Quarter"
                name="deploymentsPerQuarter"
                type="number"
                value={inputs.deploymentsPerQuarter}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText={"A deployment is any move from one environment to another (e.g., dev to QA, QA to prod). For example, dev → QA → prod counts as 2 deployments."}
              />
              <TextField
                label="Lead Time for Changes (days)"
                name="leadTimeDays"
                type="number"
                value={inputs.leadTimeDays}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText={"After a developer has created the necessary deployment script, how many days does it take for that change to reach production?"}
              />
              <TextField
                label="Script Failure Rate (%)"
                name="scriptFailureRate"
                type="number"
                value={inputs.scriptFailureRate}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                helperText={"If a script fails to execute, or executes the wrong change, in any environment, that is considered a script failure."}
              />
              <TextField
                label="Average Salary ($)"
                name="averageSalary"
                type="number"
                value={inputs.averageSalary}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 1000 } }}
                helperText="Default: $150,000"
              />
              <TextField
                label="Number of Developers (for licensing)"
                name="numberOfDevelopers"
                type="number"
                value={inputs.numberOfDevelopers}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1 } }}
                helperText="Default: 10 users"
              />
              <TextField
                label="Flyway Licensing Cost ($)"
                name="flywayLicensingCost"
                type="number"
                value={inputs.flywayLicensingCost}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 1000 } }}
                helperText="Default: number of users × $3,000"
              />
              <TextField
                label="DBA Count"
                name="dbaCount"
                type="number"
                value={inputs.dbaCount}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Default: 25"
              />
              <TextField
                label="DBA Time Saved (%)"
                name="dbaTimeSavedPercent"
                type="number"
                value={inputs.dbaTimeSavedPercent}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                helperText="Default: 25%"
              />
              <TextField
                label="DBA Salary ($)"
                name="dbaSalary"
                type="number"
                value={inputs.dbaSalary}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 1000 } }}
                helperText="Default: $125,000"
              />
              <TextField
                label="Developer Count"
                name="developerCount"
                type="number"
                value={inputs.developerCount}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Default: 50"
              />
              <TextField
                label="Developer Time Saved (%)"
                name="developerTimeSavedPercent"
                type="number"
                value={inputs.developerTimeSavedPercent}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, max: 100, step: 1 } }}
                helperText="Default: 25%"
              />
              <TextField
                label="Developer Salary ($)"
                name="developerSalary"
                type="number"
                value={inputs.developerSalary}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 1000 } }}
                helperText="Default: $100,000"
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>
                  Save
                </Button>
                <Button variant="outlined" color="secondary" href="#/">
                  Home
                </Button>
              </Box>
              {saved && (
                <Typography color="success.main" sx={{ mt: 2 }}>
                  Saved!
                </Typography>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserDefinedMetricsPage;
