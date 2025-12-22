import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Alert,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { exportAsImage } from './utils/exportUtils';

interface UserMetrics {
  deploymentsPerQuarter: number;
  leadTimeDays: number;
  scriptFailureRate: number;
  savingsPerDeployment: number;
  implementationCost: number;
  costOfDelayPerDay: number;
  dbaHoursPerDeployment: number;
  developerHoursPerDeployment: number;
  dbaAnnualSalary: number;
  developerAnnualSalary: number;
}

interface ROIBreakdown {
  leadTimeReduction: number;
  timeSavingsPerQuarter: number;
  failureRateReduction: number;
  failureSavingsPerQuarter: number;
  deploymentIncrease: number;
  efficiencySavings: number;
  laborSavingsPerQuarter: number;
  totalQuarterlySavings: number;
  annualSavings: number;
  netBenefit: number;
  roiPercentage: number;
  paybackMonths: number;
}

const RoiCalculationPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [businessSize, setBusinessSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [userMetrics, setUserMetrics] = useState<UserMetrics>({
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

  const [flywayMetrics, setFlywayMetrics] = useState({
    deploymentsPerQuarter: 0,
    leadTimeDays: 0,
    scriptFailureRate: 0
  });

  const [roi, setRoi] = useState<ROIBreakdown | null>(null);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!pageRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(pageRef.current, 'roi-calculation');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getBusinessSizeDefaults = (size: 'small' | 'medium' | 'large'): UserMetrics => {
    const defaults = {
      small: {
        deploymentsPerQuarter: 8,
        leadTimeDays: 20,          // Small: simpler, easier to manage manually
        scriptFailureRate: 10,     // Fewer systems = fewer failure points
        savingsPerDeployment: 2000,
        implementationCost: 25000,
        costOfDelayPerDay: 200,
        dbaHoursPerDeployment: 4,
        developerHoursPerDeployment: 2,
        dbaAnnualSalary: 120000,
        developerAnnualSalary: 110000
      },
      medium: {
        deploymentsPerQuarter: 12,
        leadTimeDays: 35,          // Medium: more complexity, coordination overhead
        scriptFailureRate: 18,     // More systems = more failure points
        savingsPerDeployment: 5000,
        implementationCost: 50000,
        costOfDelayPerDay: 500,
        dbaHoursPerDeployment: 8,
        developerHoursPerDeployment: 5,
        dbaAnnualSalary: 175000,
        developerAnnualSalary: 155000
      },
      large: {
        deploymentsPerQuarter: 20,
        leadTimeDays: 60,          // Large: high complexity, many stakeholders, slow manual processes
        scriptFailureRate: 25,     // Many systems, environments, teams = highest failure rate
        savingsPerDeployment: 12000,
        implementationCost: 100000,
        costOfDelayPerDay: 1500,   // High cost of delay for enterprise
        dbaHoursPerDeployment: 16,
        developerHoursPerDeployment: 10,
        dbaAnnualSalary: 220000,
        developerAnnualSalary: 190000
      }
    };
    return defaults[size];
  };

  const handleBusinessSizeChange = (size: 'small' | 'medium' | 'large') => {
    setBusinessSize(size);
    setUserMetrics(getBusinessSizeDefaults(size));
  };

  useEffect(() => {
    loadUserMetrics();
    loadFlywayMetrics();
  }, []);

  useEffect(() => {
    calculateROI();
  }, [userMetrics, flywayMetrics]);

  async function loadUserMetrics() {
    try {
      const res = await fetch('/api/user-defined-metrics');
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          // Always load business size if it exists
          if (data.businessSize) {
            setBusinessSize(data.businessSize);
          }
          // Load all user metrics from saved data
          setUserMetrics({
            deploymentsPerQuarter: Number(data.deploymentsPerQuarter) || 12,
            leadTimeDays: Number(data.leadTimeDays) || 30,
            scriptFailureRate: Number(data.scriptFailureRate) || 15,
            savingsPerDeployment: Number(data.savingsPerDeployment) || 5000,
            implementationCost: Number(data.implementationCost) || 50000,
            costOfDelayPerDay: Number(data.costOfDelayPerDay) || 350,
            dbaHoursPerDeployment: Number(data.dbaHoursPerDeployment) || 8,
            developerHoursPerDeployment: Number(data.developerHoursPerDeployment) || 4,
            dbaAnnualSalary: Number(data.dbaAnnualSalary) || 175000,
            developerAnnualSalary: Number(data.developerAnnualSalary) || 155000
          });
        }
      }
    } catch (e) {
      console.error('Failed to load user metrics:', e);
    }
  }

  async function loadFlywayMetrics() {
    try {
      const depRes = await fetch('/api/metrics/deployments-per-quarter');
      const depData = depRes.ok ? await depRes.json() : {};

      const leadRes = await fetch('/api/metrics/lead-times');
      const leadData = leadRes.ok ? await leadRes.json() : {};
      
      let avgLeadTime = 0;
      const leadTimes = Array.isArray(leadData?.leadTimes) ? leadData.leadTimes : [];
      if (leadTimes.length) {
        const validTimes = leadTimes
          .map(lt => Number(lt.leadTimeDays))
          .filter(n => Number.isFinite(n) && n >= 0);
        if (validTimes.length) {
          avgLeadTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
        }
      }

      let failureRate = 0;
      const histRes = await fetch('/api/flyway/history/all');
      const histData = histRes.ok ? await histRes.json() : [];
      const history = Array.isArray(histData) ? histData : [];
      if (history.length) {
        const failed = history.filter(m => m.success === false).length;
        failureRate = (failed / history.length) * 100;
      }

      setFlywayMetrics({
        deploymentsPerQuarter: Number(depData?.deploymentsPerQuarter) || 0,
        leadTimeDays: Math.round(avgLeadTime * 10) / 10,
        scriptFailureRate: Math.round(failureRate * 10) / 10
      });
    } catch (e) {
      console.error('Failed to load Flyway metrics:', e);
    }
  }

  function calculateROI() {
    const nonFlywayDep = userMetrics.deploymentsPerQuarter;
    const nonFlywayLead = userMetrics.leadTimeDays;
    const nonFlywayFail = userMetrics.scriptFailureRate;
    const savingsPerDep = userMetrics.savingsPerDeployment;
    const implCost = userMetrics.implementationCost;
    const costOfDelay = userMetrics.costOfDelayPerDay;

    const flywayDep = flywayMetrics.deploymentsPerQuarter;
    const flywayLead = flywayMetrics.leadTimeDays;
    const flywayFail = flywayMetrics.scriptFailureRate;

    // Lead time savings (DORA-aligned)
    const leadTimeReduction = Math.max(0, nonFlywayLead - flywayLead);
    const leadTimeSavingsPerDeployment = leadTimeReduction * costOfDelay;
    const timeSavingsPerQuarter = leadTimeSavingsPerDeployment * flywayDep;

    // Cost savings from reduced failures
    const failureRateReduction = Math.max(0, nonFlywayFail - flywayFail) / 100;
    const failureSavingsPerQuarter = failureRateReduction * flywayDep * savingsPerDep;

    // Deployment efficiency savings
    const deploymentIncrease = Math.max(0, flywayDep - nonFlywayDep);
    const efficiencySavings = deploymentIncrease * (savingsPerDep * 0.3);

    // DBA and developer time savings (80% time reduction with automation)
    const dbaHourlyRate = userMetrics.dbaAnnualSalary / 2080;
    const devHourlyRate = userMetrics.developerAnnualSalary / 2080;
    const dbaTimeSavingsPerDeployment = userMetrics.dbaHoursPerDeployment * 0.8 * dbaHourlyRate;
    const devTimeSavingsPerDeployment = userMetrics.developerHoursPerDeployment * 0.8 * devHourlyRate;
    const laborSavingsPerQuarter = (dbaTimeSavingsPerDeployment + devTimeSavingsPerDeployment) * flywayDep;

    // Total quarterly savings
    const totalQuarterlySavings = timeSavingsPerQuarter + failureSavingsPerQuarter + efficiencySavings + laborSavingsPerQuarter;

    // Annual ROI
    const annualSavings = totalQuarterlySavings * 4;
    const netBenefit = annualSavings - implCost;
    const roiPercentage = implCost > 0 ? (netBenefit / implCost) * 100 : 0;
    const paybackMonths = annualSavings > 0 ? Math.ceil((implCost / annualSavings) * 12) : 0;

    setRoi({
      leadTimeReduction,
      timeSavingsPerQuarter,
      failureRateReduction: failureRateReduction * 100,
      failureSavingsPerQuarter,
      deploymentIncrease,
      efficiencySavings,
      laborSavingsPerQuarter,
      totalQuarterlySavings,
      annualSavings,
      netBenefit,
      roiPercentage: Math.round(roiPercentage),
      paybackMonths
    });
  }

  async function handleSave() {
    try {
      const res = await fetch('/api/user-defined-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userMetrics, businessSize })
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (e) {
      console.error('Save error:', e);
    }
  }

  return (
    <Box ref={pageRef}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          ROI Calculation
        </Typography>
        <Tooltip title="Download as image">
          <IconButton onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure your baseline (pre-Flyway) metrics to calculate the return on investment from adopting Flyway.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
        <Typography variant="h6" gutterBottom>
          About These Defaults
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This calculator uses <strong>DORA (DevOps Research and Assessment)</strong> metrics — the industry-standard framework for measuring software delivery performance. DORA research has proven these four metrics predict organizational success (<Link href="https://dora.dev/guides/dora-metrics-four-keys/" target="_blank" rel="noopener">learn more about the Four Keys</Link>):
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 2, pl: 3 }}>
          <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            <strong>Deployment Frequency:</strong> How often code reaches production
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            <strong>Lead Time for Changes:</strong> Time from commit to production deployment
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            <strong>Change Failure Rate:</strong> Percentage of deployments causing incidents
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>Time to Restore Service:</strong> How quickly you recover from failures
          </Typography>
        </Box>
        
        {businessSize === 'small' && (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our defaults reflect typical small US organizations (&lt;50 employees, &lt;20 developers) using manual database deployment processes:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              • <strong>8 deployments/quarter:</strong> Monthly to bi-weekly cadence for smaller teams with simpler systems (<Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">2023 State of DevOps Report</Link>)
              <br/>
              • <strong>20-day lead time:</strong> Simpler systems with fewer stakeholders enable faster manual deployments (<Link href="https://cloud.google.com/architecture/devops/devops-measurement-metrics" target="_blank" rel="noopener">Google Cloud DevOps</Link>)
              <br/>
              • <strong>10% failure rate:</strong> Lower complexity and fewer integration points reduce failures (<Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">DORA Research</Link>)
              <br/>
              • <strong>$200/day cost of delay:</strong> Smaller team impact, calculated from lower salary base and team size
              <br/>
              • <strong>$2,000 per deployment savings:</strong> Lower downtime costs due to smaller customer base and simpler systems (<Link href="https://www.atlassian.com/incident-management/kpis/cost-of-downtime" target="_blank" rel="noopener">Atlassian</Link>)
              <br/>
              • <strong>$25,000 implementation cost:</strong> Smaller scope: basic license + minimal training + quick setup
            </Typography>
          </>
        )}
        
        {businessSize === 'medium' && (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our defaults reflect typical mid-sized US organizations (50-500 employees, 20-200 developers) using manual database deployment processes:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              • <strong>12 deployments/quarter:</strong> Weekly cadence representing DORA "Low" performer baseline (<Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">2023 State of DevOps Report</Link>)
              <br/>
              • <strong>35-day lead time:</strong> Multi-team coordination and approval processes typical of growing organizations
              <br/>
              • <strong>18% failure rate:</strong> Moderate complexity with multiple environments and integration points (<Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">DORA Research</Link>)
              <br/>
              • <strong>$500/day cost of delay:</strong> Calculated from mid-level salaries with moderate team impact and overhead
              <br/>
              • <strong>$5,000 per deployment savings:</strong> Based on downtime costs (~$5,600/hour per <Link href="https://www.atlassian.com/incident-management/kpis/cost-of-downtime" target="_blank" rel="noopener">Atlassian</Link>), remediation effort, and customer impact
              <br/>
              • <strong>$50,000 implementation cost:</strong> Mid-market typical: licenses ($10-15K) + consulting/training ($20-25K) + internal setup ($15-20K)
            </Typography>
          </>
        )}
        
        {businessSize === 'large' && (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our defaults reflect typical large US organizations (500+ employees, 200+ developers) using manual database deployment processes:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              • <strong>20 deployments/quarter:</strong> Higher deployment frequency but with significant manual overhead across many teams (<Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">2023 State of DevOps Report</Link>)
              <br/>
              • <strong>60-day lead time:</strong> Enterprise complexity: extensive approvals, compliance reviews, and multi-team coordination (<Link href="https://cloud.google.com/architecture/devops/devops-measurement-metrics" target="_blank" rel="noopener">Google Cloud DevOps</Link>)
              <br/>
              • <strong>25% failure rate:</strong> High complexity with numerous systems, environments, dependencies, and integration points (<Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">DORA Research</Link>)
              <br/>
              • <strong>$1,500/day cost of delay:</strong> Enterprise-level salaries with significant team impact and organizational overhead
              <br/>
              • <strong>$12,000 per deployment savings:</strong> Higher downtime costs due to large customer base, SLAs, and complex remediation (<Link href="https://www.atlassian.com/incident-management/kpis/cost-of-downtime" target="_blank" rel="noopener">Atlassian</Link>)
              <br/>
              • <strong>$100,000 implementation cost:</strong> Enterprise scope: licenses + extensive training + enterprise integration + compliance setup
            </Typography>
          </>
        )}
      </Paper>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configuration saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Baseline Configuration (Pre-Flyway)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Enter your metrics from before adopting Flyway
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Business Size</InputLabel>
                    <Select
                      value={businessSize}
                      label="Business Size"
                      onChange={(e) => handleBusinessSizeChange(e.target.value as 'small' | 'medium' | 'large')}
                    >
                      <MenuItem value="small">Small (&lt;50 employees, &lt;20 developers)</MenuItem>
                      <MenuItem value="medium">Medium (50-500 employees, 20-200 developers)</MenuItem>
                      <MenuItem value="large">Large (500+ employees, 200+ developers)</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, pl: 1.75 }}>Selecting a business size will update all fields with industry-standard defaults</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Deployments per Quarter"
                    type="number"
                    value={userMetrics.deploymentsPerQuarter}
                    onChange={(e) => setUserMetrics({ ...userMetrics, deploymentsPerQuarter: Number(e.target.value) })}
                    helperText="How many production deployments did you complete quarterly before Flyway?"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Lead Time (days)"
                    type="number"
                    value={userMetrics.leadTimeDays}
                    onChange={(e) => setUserMetrics({ ...userMetrics, leadTimeDays: Number(e.target.value) })}
                    helperText="Average days from code commit to production (DORA metric)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">How does lead time affect ROI?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Lead time <strong>directly drives one of the four major ROI components</strong> and often represents 40-60% of total ROI, making it the <strong>largest single contributor</strong> to Flyway's business value.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Calculation Formula
                        </Typography>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          <Box component="div">
                            leadTimeReduction = max(0, baseline_lead_time - flyway_lead_time)
                            <br/>
                            leadTimeSavingsPerDeployment = leadTimeReduction × costOfDelayPerDay
                            <br/>
                            timeSavingsPerQuarter = leadTimeSavingsPerDeployment × deployments_per_quarter
                          </Box>
                        </Paper>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                          Example Calculation
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          If your baseline is <strong>35 days</strong> lead time and Flyway reduces it to <strong>5 days</strong>:
                        </Typography>
                        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Lead time reduction:</strong> 30 days
                          </Typography>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Cost of delay:</strong> $500/day (medium business default)
                          </Typography>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Deployments per quarter:</strong> 12
                          </Typography>
                        </Box>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.lighter', borderLeft: 4, borderColor: 'success.main' }}>
                          <Typography variant="body2" fontWeight="bold" color="success.dark">
                            Quarterly savings from lead time alone: 30 days × $500/day × 12 = $180,000/quarter
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.dark">
                            Annual savings: $720,000/year
                          </Typography>
                        </Paper>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                          The Four ROI Components
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Lead time is one of four savings categories calculated:
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Component</strong></TableCell>
                                <TableCell><strong>Calculation</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell><strong>1. Lead Time Savings</strong></TableCell>
                                <TableCell>Days reduced × cost of delay per day × deployments</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>2. Failure Rate Savings</TableCell>
                                <TableCell>Percentage reduction × deployments × cost per failure</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>3. Deployment Efficiency</TableCell>
                                <TableCell>Additional deployments enabled × 30% of savings per deployment</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>4. Labor Savings</TableCell>
                                <TableCell>DBA + developer time saved (80% reduction) × hourly rates × deployments</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                          Why Lead Time Matters for ROI
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          <strong>Cost of Delay</strong> is the business value lost each day that features, fixes, or improvements sit waiting for production deployment. Lead time reduction captures:
                        </Typography>
                        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Feature value delivery:</strong> Revenue from new features reaching customers sooner
                          </Typography>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Bug fix urgency:</strong> Customer satisfaction/retention from faster fixes
                          </Typography>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Competitive advantage:</strong> Market responsiveness vs competitors
                          </Typography>
                          <Typography component="li" variant="body2" color="text.secondary">
                            <strong>Opportunity cost:</strong> Developer time spent on next features vs deployment overhead
                          </Typography>
                        </Box>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                          Impact by Business Size
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Size</strong></TableCell>
                                <TableCell align="right"><strong>Baseline Lead Time</strong></TableCell>
                                <TableCell align="right"><strong>Cost of Delay</strong></TableCell>
                                <TableCell align="right"><strong>Typical Annual Impact</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell><strong>Small</strong> (&lt;50 employees)</TableCell>
                                <TableCell align="right">20 days</TableCell>
                                <TableCell align="right">$200/day</TableCell>
                                <TableCell align="right">~$48K/year</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Medium</strong> (50-500)</TableCell>
                                <TableCell align="right">35 days</TableCell>
                                <TableCell align="right">$500/day</TableCell>
                                <TableCell align="right">~$720K/year</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Large</strong> (500+)</TableCell>
                                <TableCell align="right">60 days</TableCell>
                                <TableCell align="right">$1,500/day</TableCell>
                                <TableCell align="right">~$4.3M/year</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                          *Assumes Flyway reduces lead time to 3-5 days on average
                        </Typography>

                        <Paper elevation={0} sx={{ p: 2, mt: 3, bgcolor: 'primary.lighter', borderLeft: 4, borderColor: 'primary.main' }}>
                          <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                            Key Insight
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            For many organizations, lead time savings represent 40-60% of total ROI, making it often the largest single contributor to Flyway's business value. This aligns with <Link href="https://dora.dev/research/" target="_blank" rel="noopener">DORA research</Link> showing lead time as a key predictor of organizational performance.
                          </Typography>
                        </Paper>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Script Failure Rate (%)"
                    type="number"
                    value={userMetrics.scriptFailureRate}
                    onChange={(e) => setUserMetrics({ ...userMetrics, scriptFailureRate: Number(e.target.value) })}
                    helperText="Percentage of deployments that required rollback or caused incidents"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cost of Delay per Day ($)"
                    type="number"
                    value={userMetrics.costOfDelayPerDay}
                    onChange={(e) => setUserMetrics({ ...userMetrics, costOfDelayPerDay: Number(e.target.value) })}
                    helperText="Business value lost per day features/fixes are delayed reaching production"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, pl: 1.75 }}>
                    Typical ranges: Startup (&lt;20 devs) $100-200/day | Mid-market (20-200) $300-600/day | Enterprise (200+) $800-2000/day
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Savings per Deployment ($)"
                    type="number"
                    value={userMetrics.savingsPerDeployment}
                    onChange={(e) => setUserMetrics({ ...userMetrics, savingsPerDeployment: Number(e.target.value) })}
                    helperText="Cost avoided per successful deployment (downtime, remediation, support tickets)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="DBA Hours per Deployment (Pre-Flyway)"
                    type="number"
                    value={userMetrics.dbaHoursPerDeployment}
                    onChange={(e) => setUserMetrics({ ...userMetrics, dbaHoursPerDeployment: Number(e.target.value) })}
                    helperText="Manual deployment time: planning, review, execution, validation (typically 6-12 hours)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Developer Hours per Deployment (Pre-Flyway)"
                    type="number"
                    value={userMetrics.developerHoursPerDeployment}
                    onChange={(e) => setUserMetrics({ ...userMetrics, developerHoursPerDeployment: Number(e.target.value) })}
                    helperText="Script writing, testing, coordination time (typically 3-6 hours)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="DBA Annual Salary ($)"
                    type="number"
                    value={userMetrics.dbaAnnualSalary}
                    onChange={(e) => setUserMetrics({ ...userMetrics, dbaAnnualSalary: Number(e.target.value) })}
                    helperText="Fully-loaded cost including benefits (US avg: $150K-200K for mid-level)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Developer Annual Salary ($)"
                    type="number"
                    value={userMetrics.developerAnnualSalary}
                    onChange={(e) => setUserMetrics({ ...userMetrics, developerAnnualSalary: Number(e.target.value) })}
                    helperText="Fully-loaded cost including benefits (US avg: $130K-180K for mid-level)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Implementation Cost ($)"
                    type="number"
                    value={userMetrics.implementationCost}
                    onChange={(e) => setUserMetrics({ ...userMetrics, implementationCost: Number(e.target.value) })}
                    helperText="Total investment: licenses, consulting, training, internal setup effort"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" fullWidth onClick={handleSave}>
                    Save Configuration
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Flyway Performance
              </Typography>
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Deployments/Q</Typography>
                    <Typography variant="h6">{flywayMetrics.deploymentsPerQuarter}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Lead Time</Typography>
                    <Typography variant="h6">{flywayMetrics.leadTimeDays} days</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Failure Rate</Typography>
                    <Typography variant="h6">{flywayMetrics.scriptFailureRate}%</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Divider sx={{ my: 2 }} />

              {roi && (
                <>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {roi.roiPercentage}%
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Return on Investment
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light' }}>
                        <Typography variant="caption" color="success.dark">Annual Savings</Typography>
                        <Typography variant="h6" color="success.dark">
                          ${roi.annualSavings.toLocaleString()}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light' }}>
                        <Typography variant="caption" color="info.dark">Payback Period</Typography>
                        <Typography variant="h6" color="info.dark">
                          {roi.paybackMonths} months
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Quarterly Savings Breakdown
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Lead time reduction:</strong> {roi.leadTimeReduction.toFixed(1)} days → ${roi.timeSavingsPerQuarter.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Failure rate reduction:</strong> {roi.failureRateReduction.toFixed(1)}% → ${roi.failureSavingsPerQuarter.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Deployment efficiency:</strong> +{roi.deploymentIncrease} deployments → ${roi.efficiencySavings.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>DBA & developer labor savings:</strong> 80% time reduction → ${roi.laborSavingsPerQuarter.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                      Total quarterly savings: ${roi.totalQuarterlySavings.toLocaleString()}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoiCalculationPage;
