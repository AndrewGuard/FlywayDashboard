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
            User-Defined Deployment Metrics
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
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Lead Time for Changes (days)"
                name="leadTimeDays"
                type="number"
                value={inputs.leadTimeDays}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Script Failure Rate (%)"
                name="scriptFailureRate"
                type="number"
                value={inputs.scriptFailureRate}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
              <TextField
                label="How long for a deployment (days)"
                name="deploymentDurationDays"
                type="number"
                value={inputs.deploymentDurationDays}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
                helperText="Default: 14 days (2 weeks)"
              />
              <TextField
                label="How many people involved"
                name="peopleInvolved"
                type="number"
                value={inputs.peopleInvolved}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
                helperText="Default: 3 people"
              />
              <TextField
                label="Average Salary ($)"
                name="averageSalary"
                type="number"
                value={inputs.averageSalary}
                onChange={handleChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, step: 1000 }}
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
                inputProps={{ min: 1 }}
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
                inputProps={{ min: 0, step: 1000 }}
                helperText="Default: number of users × $3,000"
              />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={loading}>
                Save
              </Button>
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
