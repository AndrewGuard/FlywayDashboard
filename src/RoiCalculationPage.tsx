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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import { exportAsImage } from './utils/exportUtils';
import { calculateROI, UserMetricsInput, ROIBreakdown, ROIParameters, DEFAULT_ROI_PARAMETERS, ROI_PRESETS } from './utils/roiCalculations';

// Keep local interface for compatibility with existing form state
interface UserMetrics extends UserMetricsInput {}

const RoiCalculationPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [businessSize, setBusinessSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [laborAutomationPct, setLaborAutomationPct] = useState<number>(75);
  const [failureCostMultiplier, setFailureCostMultiplier] = useState<number>(1.0);
  const [costOfDelayMultiplier, setCostOfDelayMultiplier] = useState<number>(1.0);
  const [deploymentValueFactor, setDeploymentValueFactor] = useState<number>(0.5);
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);
  const [implementationCostPct, setImplementationCostPct] = useState<number>(10);

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
    setHasUnsavedChanges(true);
  };

  const handleMetricChange = (updates: Partial<UserMetrics>) => {
    setUserMetrics({ ...userMetrics, ...updates });
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    loadUserMetrics();
    loadFlywayMetrics();
  }, []);

  // Separate effect to calculate baseline annual savings (used to derive implementation cost)
  // This only recalculates when baseline metrics change, not when ROI parameters change
  const [baselineAnnualSavings, setBaselineAnnualSavings] = useState<number>(0);
  
  useEffect(() => {
    const baselineROI = calculateROI(userMetrics, flywayMetrics, DEFAULT_ROI_PARAMETERS);
    setBaselineAnnualSavings(baselineROI.annualSavings);
  }, [
    userMetrics.deploymentsPerQuarter,
    userMetrics.leadTimeDays,
    userMetrics.scriptFailureRate,
    userMetrics.savingsPerDeployment,
    userMetrics.costOfDelayPerDay,
    userMetrics.dbaHoursPerDeployment,
    userMetrics.developerHoursPerDeployment,
    userMetrics.dbaAnnualSalary,
    userMetrics.developerAnnualSalary,
    flywayMetrics.deploymentsPerQuarter,
    flywayMetrics.leadTimeDays,
    flywayMetrics.scriptFailureRate
  ]);

  // Main ROI calculation effect
  useEffect(() => {
    const roiParameters: ROIParameters = {
      laborAutomationPct,
      failureCostMultiplier,
      costOfDelayMultiplier,
      deploymentValueFactor
    };
    
    // Implementation cost is based on baseline annual savings, not current parameters
    const actualImplementationCost = baselineAnnualSavings * (implementationCostPct / 100);
    
    // Calculate ROI with current parameters and fixed implementation cost
    const finalMetrics = { ...userMetrics, implementationCost: actualImplementationCost };
    const roiResult = calculateROI(finalMetrics, flywayMetrics, roiParameters);
    setRoi(roiResult);
  }, [
    userMetrics.deploymentsPerQuarter,
    userMetrics.leadTimeDays,
    userMetrics.scriptFailureRate,
    userMetrics.savingsPerDeployment,
    userMetrics.costOfDelayPerDay,
    userMetrics.dbaHoursPerDeployment,
    userMetrics.developerHoursPerDeployment,
    userMetrics.dbaAnnualSalary,
    userMetrics.developerAnnualSalary,
    flywayMetrics.deploymentsPerQuarter,
    flywayMetrics.leadTimeDays,
    flywayMetrics.scriptFailureRate,
    baselineAnnualSavings,
    laborAutomationPct,
    failureCostMultiplier,
    costOfDelayMultiplier,
    deploymentValueFactor,
    implementationCostPct
  ]);

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
          // Load ROI parameters if they exist
          if (data.laborAutomationPct !== undefined) {
            setLaborAutomationPct(data.laborAutomationPct ?? 75);
            setFailureCostMultiplier(data.failureCostMultiplier ?? 1.0);
            setCostOfDelayMultiplier(data.costOfDelayMultiplier ?? 1.0);
            setDeploymentValueFactor(data.deploymentValueFactor ?? 0.5);
            // Check if it matches a preset
            const matchingPreset = Object.entries(ROI_PRESETS).find(([_, preset]) =>
              preset.parameters.laborAutomationPct === data.laborAutomationPct &&
              preset.parameters.failureCostMultiplier === data.failureCostMultiplier &&
              preset.parameters.costOfDelayMultiplier === data.costOfDelayMultiplier &&
              preset.parameters.deploymentValueFactor === data.deploymentValueFactor
            );
            setSelectedPreset(matchingPreset ? matchingPreset[0] : 'custom');
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

  async function handleSave() {
    try {
      const res = await fetch('/api/user-defined-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...userMetrics, 
          businessSize,
          laborAutomationPct,
          failureCostMultiplier,
          costOfDelayMultiplier,
          deploymentValueFactor
        })
      });

      if (res.ok) {
        setSaved(true);
        setHasUnsavedChanges(false);
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

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configuration saved successfully!
        </Alert>
      )}

      {hasUnsavedChanges && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<InfoIcon />}
        >
          <strong>You have unsaved changes.</strong> Click the "Save Configuration" button at the bottom of the form to apply your changes to the ROI calculation.
        </Alert>
      )}

      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: 'primary.lighter', 
          borderLeft: 6, 
          borderColor: 'primary.main',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => setShowCalculationInfo(!showCalculationInfo)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" color="primary.dark">
              How is ROI Calculated?
            </Typography>
          </Box>
          <ExpandMoreIcon 
            sx={{ 
              transform: showCalculationInfo ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }} 
          />
        </Box>
        {showCalculationInfo && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              This calculator uses <strong>DORA (DevOps Research and Assessment)</strong> metrics — the industry-standard framework for measuring software delivery performance. We calculate ROI based on four key components:
            </Typography>
            
            <TableContainer component={Paper} elevation={0} sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Component</strong></TableCell>
                    <TableCell><strong>Calculation Method</strong></TableCell>
                    <TableCell align="right"><strong>Typical Impact</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>1. Lead Time Savings</strong></TableCell>
                    <TableCell>Days reduced × cost of delay per day × deployments</TableCell>
                    <TableCell align="right">40-60% of ROI</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>2. Failure Rate Savings</strong></TableCell>
                    <TableCell>Percentage reduction × deployments × cost per failure</TableCell>
                    <TableCell align="right">15-25% of ROI</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>3. Deployment Efficiency</strong></TableCell>
                    <TableCell>Additional deployments enabled × 30% of savings per deployment</TableCell>
                    <TableCell align="right">10-20% of ROI</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>4. Labor Savings</strong></TableCell>
                    <TableCell>DBA + developer time saved (80% reduction) × hourly rates × deployments</TableCell>
                    <TableCell align="right">15-25% of ROI</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Formula:</strong> ROI % = (Annual Savings - Implementation Cost) / Implementation Cost × 100
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Based on <Link href="https://dora.dev/research/2023/dora-report/" target="_blank" rel="noopener">2023 State of DevOps Report</Link> and industry benchmarks. Learn more about <Link href="https://dora.dev/guides/dora-metrics-four-keys/" target="_blank" rel="noopener">DORA's Four Keys</Link>.
            </Typography>

            <Divider sx={{ my: 3 }} />

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
          </Box>
        )}
      </Paper>

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon color="primary" />
            Need Help Getting Baseline Metrics?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" paragraph>
            If you don't have historical deployment data, you can use these SQL scripts to infer deployment frequency from your database itself. 
            These scripts analyze database object modification patterns to estimate deployment activity.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              📋 How to Use These Scripts:
            </Typography>
            <Typography variant="body2" component="div">
              • Have your DBA run the appropriate script against your production database
              <br/>
              • The script counts database object changes over time
              <br/>
              • Use the results to estimate your quarterly deployment frequency
              <br/>
              • <strong>Note:</strong> This won't be a perfect 1:1 mapping to "deployments" (multiple changes may happen in one deployment, or vice versa), 
              but it provides real historical data to inform your baseline metrics
            </Typography>
          </Alert>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Select Your Database Platform:
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">📊 Oracle Release Frequency Script</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Click to copy the Oracle script:
              </Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
                onClick={(e) => {
                  const text = (e.currentTarget as HTMLElement).querySelector('pre')?.textContent || '';
                  navigator.clipboard.writeText(text);
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`-- Database Change Metrics Query - Oracle
-- ============================================
-- CONFIGURATION: Change time window here (number of months to look back)
-- ============================================
-- For Oracle, without Auditing(19c and above) the following will be CLOSEST.  
-- What is Unified Auditing in Oracle:  https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/AUDIT-Unified-Auditing.html

-- this shows how many objects changed in a given day. this is to help understand how many releases happen in a unit of time.
-- number of releases can be inferred from average number of objects touched per release - this gives number of objects altered over a unit of time.
-- multiple changes to a single object only count as 1
-- the number you get is the minimum number of releases that happened over a unit of time
DEFINE months_back = 12

-- Variables hoisted to top
DECLARE
    v_start_date DATE := ADD_MONTHS(TRUNC(SYSDATE), -&months_back);
    v_end_date DATE := TRUNC(SYSDATE);
    v_excluded_schemas VARCHAR2(100) := '''SYS'',''SYSTEM''';
    v_object_types VARCHAR2(500) := '''TABLE'',''INDEX'',''VIEW'',''SEQUENCE'',''PROCEDURE'',''FUNCTION'',''PACKAGE'',''PACKAGE BODY'',''TRIGGER'',''TYPE'',''TYPE BODY'',''MATERIALIZED VIEW''';
BEGIN
    -- Query 1: Daily count of objects with DDL changes (based on last modification time)
    FOR rec IN (
        SELECT
            TRUNC(last_ddl_time) AS change_date,
            COUNT(*) AS release_count
        FROM dba_objects
        WHERE last_ddl_time >= v_start_date
          AND owner NOT IN ('SYS','SYSTEM')
          AND object_type IN (
                'TABLE','INDEX','VIEW','SEQUENCE',
                'PROCEDURE','FUNCTION','PACKAGE','PACKAGE BODY',
                'TRIGGER','TYPE','TYPE BODY','MATERIALIZED VIEW'
              )
        GROUP BY TRUNC(last_ddl_time)
        ORDER BY change_date
    ) LOOP
        DBMS_OUTPUT.PUT_LINE('Date: ' || rec.change_date || ', Releases: ' || rec.release_count);
    END LOOP;
    
    -- Query 2: Daily count of unique objects touched by DDL (requires auditing)
    FOR rec IN (
        SELECT
            TRUNC(event_timestamp) AS change_date,
            COUNT(DISTINCT object_schema || '.' || object_name) AS release_count
        FROM unified_audit_trail
        WHERE TRUNC(event_timestamp) >= v_start_date
          AND TRUNC(event_timestamp) < v_end_date
          AND object_schema NOT IN ('SYS','SYSTEM')
          AND (
            action_name LIKE '%CREATE%'
            OR action_name LIKE '%ALTER%'
            OR action_name LIKE '%DROP%'
          )
        GROUP BY TRUNC(event_timestamp)
        ORDER BY change_date
    ) LOOP
        DBMS_OUTPUT.PUT_LINE('Date: ' || rec.change_date || ', Releases: ' || rec.release_count);
    END LOOP;
END;
/


-- Alternative: Standalone query versions
-- (Uses the same months_back variable defined at the top)

-- Calculate date range
DEFINE p_start_ts = ADD_MONTHS(TRUNC(SYSDATE), -&months_back)
DEFINE p_end_ts = TRUNC(SYSDATE)

-- Set column formatting for better display
SET LINESIZE 200
SET PAGESIZE 100
COLUMN change_date FORMAT A12 HEADING 'Change Date'
COLUMN release_count FORMAT 999,999 HEADING 'Release|Count'

-- Query 1: Daily count of objects with DDL changes
SELECT
    TO_CHAR(TRUNC(last_ddl_time), 'DD-MON-YYYY') AS change_date,
    COUNT(*) AS release_count
FROM dba_objects
WHERE last_ddl_time >= &p_start_ts
  AND owner NOT IN ('SYS','SYSTEM')
  AND object_type IN (
        'TABLE','INDEX','VIEW','SEQUENCE',
        'PROCEDURE','FUNCTION','PACKAGE','PACKAGE BODY',
        'TRIGGER','TYPE','TYPE BODY','MATERIALIZED VIEW'
      )
GROUP BY TRUNC(last_ddl_time)
ORDER BY TRUNC(last_ddl_time);

-- Query 2: Daily count of unique objects touched by DDL (with auditing)
SELECT
    TO_CHAR(TRUNC(event_timestamp), 'DD-MON-YYYY') AS change_date,
    COUNT(DISTINCT object_schema || '.' || object_name) AS release_count
FROM unified_audit_trail
WHERE TRUNC(event_timestamp) >= &p_start_ts
  AND TRUNC(event_timestamp) < &p_end_ts
  AND object_schema NOT IN ('SYS','SYSTEM')
  AND (
    action_name LIKE '%CREATE%'
    OR action_name LIKE '%ALTER%'
    OR action_name LIKE '%DROP%'
  )
GROUP BY TRUNC(event_timestamp)
ORDER BY TRUNC(event_timestamp);`}</pre>
              </Paper>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                💡 Adjust the <code>months_back</code> variable at the top to change the analysis time window
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">📊 SQL Server Release Frequency Script</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Click to copy the SQL Server script:
              </Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
                onClick={(e) => {
                  const text = (e.currentTarget as HTMLElement).querySelector('pre')?.textContent || '';
                  navigator.clipboard.writeText(text);
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`-- Without auditing turned on, this is as close as we get, (last change to an object) similar to Oracle LAST_DDL_TIME.
-- What is SQL Server Auditing and how to configure?  https://learn.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine?view=sql-server-ver17


-- this shows how many objects changed in a given day. this is to help understand how many releases happen in a unit of time.
-- number of releases can be inferred from average number of objects touched per release - this gives number of objects altered over a unit of time.
-- multiple changes to a single object only count as 1
-- the number you get is the minimum number of releases that happened over a unit of time

/* Configuration: How many months back to analyze */
DECLARE @MonthsBack int = 3;

/* Daily count of unique objects touched by DDL */
DECLARE @StartDate date = DATEADD(month, -@MonthsBack, CONVERT(date, GETDATE()));

SELECT
    CONVERT(date, o.modify_date) AS change_date,
    COUNT(*) AS objects_modified
FROM sys.objects o
JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.modify_date >= @StartDate
  AND s.name NOT IN ('sys')
  AND o.type IN ('U','V','P','FN','TF','IF','TR')  -- tables, views, procs, funcs, triggers
GROUP BY CONVERT(date, o.modify_date)
ORDER BY change_date;`}</pre>
              </Paper>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                💡 Adjust the <code>@MonthsBack</code> variable at the top to change the analysis time window
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">📊 Oracle Release Failure Rate Script</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ⚠️ Requires Unified Auditing (Oracle 19c+)
                </Typography>
                <Typography variant="body2">
                  This script requires Unified Auditing to be configured in Oracle 19c or later.
                  See <Link href="https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/AUDIT-Unified-Auditing.html" target="_blank" rel="noopener">Oracle documentation</Link> for setup instructions.
                </Typography>
              </Alert>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Click to copy the Oracle failure rate script:
              </Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
                onClick={(e) => {
                  const text = (e.currentTarget as HTMLElement).querySelector('pre')?.textContent || '';
                  navigator.clipboard.writeText(text);
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`-- Oracle Release Failure Rate Script
-- ============================================
-- CONFIGURATION: Change time window here (number of months to look back)
-- ============================================
-- Requires Unified Auditing to be configured - this is a 19c+ feature
-- What is Unified Auditing in Oracle: https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/AUDIT-Unified-Auditing.html

-- Failure Rate for releases can only be done on # of times scripts, (per DDL statements) fail inside a database.
-- This script tracks DDL statement success/failure rates to help estimate deployment script failure rates.

/* Configuration: How many months back to analyze */
DEFINE months_back = 3

-- Calculate date range
DEFINE start_ts = ADD_MONTHS(TRUNC(SYSDATE), -&months_back)
DEFINE end_ts = TRUNC(SYSDATE)

-- Daily DDL success and failure rate
SELECT
  TRUNC(event_timestamp) AS day,
  COUNT(*) AS ddl_events,
  SUM(CASE WHEN return_code <> 0 THEN 1 ELSE 0 END) AS ddl_failures,
  ROUND(
    100 * SUM(CASE WHEN return_code <> 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
  , 2) AS failure_rate_pct
FROM unified_audit_trail
WHERE event_timestamp >= &start_ts
  AND event_timestamp <  &end_ts
  AND action_name IN (
    'CREATE TABLE','ALTER TABLE','DROP TABLE',
    'TRUNCATE TABLE',
    'CREATE INDEX','DROP INDEX',
    'CREATE VIEW','DROP VIEW',
    'CREATE PROCEDURE','CREATE PACKAGE','CREATE PACKAGE BODY',
    'CREATE FUNCTION','CREATE TYPE', 'DROP PROCEDURE','DROP PACKAGE',
    'DROP TYPE','DROP FUNCTION'
  )
GROUP BY TRUNC(event_timestamp)
ORDER BY day;`}</pre>
              </Paper>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                💡 Adjust the <code>months_back</code> variable at the top to change the analysis time window
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                📈 This script tracks DDL failures to help estimate your script failure rate baseline
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">📊 SQL Server Release Failure Rate Script</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ⚠️ Requires SQL Server Audit or Extended Events
                </Typography>
                <Typography variant="body2">
                  This script uses SQL Server Audit or Extended Events to track DDL failures.
                  See <Link href="https://learn.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine?view=sql-server-ver17" target="_blank" rel="noopener">Microsoft documentation</Link> for setup instructions.
                </Typography>
              </Alert>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Click to copy the SQL Server failure rate script (includes both Audit and Extended Events options):
              </Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  maxHeight: '500px',
                  overflow: 'auto',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
                onClick={(e) => {
                  const text = (e.currentTarget as HTMLElement).querySelector('pre')?.textContent || '';
                  navigator.clipboard.writeText(text);
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{`-- SQL Server Release Failure Rate Script
-- ============================================
-- We're back to SQL Server Audit or Extended Events for this kind of information
-- What is SQL Server Auditing? https://learn.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine?view=sql-server-ver17
-- ============================================

/*============================================================================
OPTION 1: Using SQL Server Audit
=============================================================================*/

DECLARE @start datetime2(0) = '2026-01-01 00:00:00';
DECLARE @end   datetime2(0) = '2026-01-28 00:00:00';

SELECT
    CAST(event_time AS date) AS [day],
    CASE
        WHEN statement LIKE 'CREATE %' THEN 'CREATE'
        WHEN statement LIKE 'DROP %'   THEN 'DROP'
        ELSE 'OTHER'
    END AS ddl_verb,
    COUNT(*) AS failed_count
FROM sys.fn_get_audit_file('D:\\SqlAudit\\MyAudit\\*.sqlaudit', DEFAULT, DEFAULT)
WHERE event_time >= @start
  AND event_time <  @end
  AND succeeded = 0
  AND (statement LIKE 'CREATE %' OR statement LIKE 'DROP %')
GROUP BY CAST(event_time AS date),
         CASE
            WHEN statement LIKE 'CREATE %' THEN 'CREATE'
            WHEN statement LIKE 'DROP %'   THEN 'DROP'
            ELSE 'OTHER'
         END
ORDER BY [day], ddl_verb;


/*============================================================================
OPTION 2: Using Extended Events (More Involved)
=============================================================================*/

-- See full script for complete Extended Events setup including:
-- - Event session creation for error_reported events
-- - Filtering for DDL operations (CREATE/ALTER/DROP)
-- - Reporting queries to bucket failures by day and hour
-- 
-- The full script includes:
-- 1. Configuration variables (@DbName, @TargetFolder, etc.)
-- 2. Event session creation with error filtering
-- 3. Reporting query using sys.fn_xe_file_target_read_file
--
-- Copy this entire script to a .sql file for the complete implementation.`}</pre>
              </Paper>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                💡 <strong>OPTION 1 (Audit):</strong> Adjust <code>@start</code> and <code>@end</code> dates, and update the audit file path
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                💡 <strong>OPTION 2 (Extended Events):</strong> Requires more setup but provides detailed tracking - see full script
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                📈 This script tracks DDL failures to help estimate your script failure rate baseline
              </Typography>
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>

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
                Current Flyway Performance
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your current deployment metrics with Flyway
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
                      <strong>Lead time reduction:</strong> {roi.leadTimeReduction.toFixed(1)} days × ${(userMetrics.costOfDelayPerDay * costOfDelayMultiplier).toFixed(0)}/day × {flywayMetrics.deploymentsPerQuarter} deps = ${roi.timeSavingsPerQuarter.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Failure rate reduction:</strong> {roi.failureRateReduction.toFixed(1)}% × ${(userMetrics.savingsPerDeployment * failureCostMultiplier).toFixed(0)} cost × {flywayMetrics.deploymentsPerQuarter} deps = ${roi.failureSavingsPerQuarter.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Deployment efficiency:</strong> +{roi.deploymentIncrease} deployments × ${(userMetrics.savingsPerDeployment * deploymentValueFactor).toFixed(0)} value = ${roi.efficiencySavings.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>DBA & developer labor savings:</strong> {laborAutomationPct}% automation → ${roi.laborSavingsPerQuarter.toLocaleString()}/quarter
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                      Total quarterly savings: ${roi.totalQuarterlySavings.toLocaleString()}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Accordion sx={{ bgcolor: 'grey.50' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2" color="primary">
                        📊 How This ROI is Calculated (DORA Metrics)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>1. Lead Time Savings:</strong> (Baseline Lead Time - Flyway Lead Time) × Cost of Delay × Deployments per Quarter
                        <br />• Cost of Delay Multiplier: <strong>{costOfDelayMultiplier}x</strong> ({costOfDelayMultiplier === 1 ? 'base cost only' : costOfDelayMultiplier > 1 ? 'includes opportunity costs' : 'conservative estimate'})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>2. Failure Cost Reduction:</strong> (Baseline Failure Rate - Flyway Failure Rate) × Failure Cost × Deployments
                        <br />• Failure Cost Multiplier: <strong>{failureCostMultiplier}x</strong> ({failureCostMultiplier === 1 ? 'failures = deployment cost' : failureCostMultiplier > 1 ? 'failures cost more than deployments' : 'failures cost less than deployments'})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>3. Deployment Frequency Value:</strong> (Flyway Deployments - Baseline Deployments) × Deployment Value
                        <br />• Deployment Value Factor: <strong>{(deploymentValueFactor * 100).toFixed(0)}%</strong> of savings per deployment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>4. Labor Automation Savings:</strong> (DBA Hours + Dev Hours) × Hourly Rate × Automation % × Deployments
                        <br />• Labor Automation: <strong>{laborAutomationPct}%</strong> time reduction from manual work
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ROI Calculation Parameters
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Adjust how ROI is calculated using DORA metrics
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Preset Configuration</InputLabel>
                    <Select
                      value={selectedPreset}
                      label="Preset Configuration"
                      onChange={(e) => {
                        const preset = e.target.value;
                        setSelectedPreset(preset);
                        if (preset !== 'custom' && ROI_PRESETS[preset]) {
                          const params = ROI_PRESETS[preset].parameters;
                          setLaborAutomationPct(params.laborAutomationPct);
                          setFailureCostMultiplier(params.failureCostMultiplier);
                          setCostOfDelayMultiplier(params.costOfDelayMultiplier);
                          setDeploymentValueFactor(params.deploymentValueFactor);
                          setHasUnsavedChanges(true);
                        }
                      }}
                    >
                      {Object.entries(ROI_PRESETS).map(([key, preset]) => (
                        <MenuItem key={key} value={key}>
                          {preset.name} - {preset.description}
                        </MenuItem>
                      ))}
                      <MenuItem value="custom">Custom - Fine-tune individual parameters</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Labor Automation: {laborAutomationPct}%
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={laborAutomationPct}
                      onChange={(e) => {
                        setLaborAutomationPct(Number(e.target.value));
                        setSelectedPreset('custom');
                        setHasUnsavedChanges(true);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Percentage of manual labor automated by Flyway (recommended: 75%)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Failure Cost Multiplier: {failureCostMultiplier.toFixed(2)}x
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.25"
                      value={failureCostMultiplier}
                      onChange={(e) => {
                        setFailureCostMultiplier(Number(e.target.value));
                        setSelectedPreset('custom');
                        setHasUnsavedChanges(true);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    How much failures cost vs successful deployments (1.0 = equal cost, 2.0 = failures cost 2x)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cost of Delay Multiplier: {costOfDelayMultiplier.toFixed(2)}x
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={costOfDelayMultiplier}
                      onChange={(e) => {
                        setCostOfDelayMultiplier(Number(e.target.value));
                        setSelectedPreset('custom');
                        setHasUnsavedChanges(true);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Multiplier for opportunity costs (1.0 = base cost, 1.5 = includes indirect impact)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Deployment Value Factor: {(deploymentValueFactor * 100).toFixed(0)}%
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={deploymentValueFactor}
                      onChange={(e) => {
                        setDeploymentValueFactor(Number(e.target.value));
                        setSelectedPreset('custom');
                        setHasUnsavedChanges(true);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Value of additional deployments (50% = each deployment worth 50% of savings)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Cost of Implementation
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Implementation Cost: {implementationCostPct}% of Annual Savings
                  </Typography>
                  <Box sx={{ px: 1 }}>  
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={implementationCostPct}
                      onChange={(e) => {
                        setImplementationCostPct(Number(e.target.value));
                        setHasUnsavedChanges(true);
                      }}
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Implementation cost as percentage of annual savings (licenses, consulting, training, setup)
                    {roi && (
                      <>
                        <br />
                        <strong>Calculated cost: ${(roi.annualSavings * (implementationCostPct / 100)).toLocaleString()}</strong>
                      </>
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Deployments per Quarter"
                    type="number"
                    value={userMetrics.deploymentsPerQuarter}
                    onChange={(e) => handleMetricChange({ deploymentsPerQuarter: Number(e.target.value) })}
                    helperText="How many production deployments did you complete quarterly before Flyway?"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Lead Time (days)"
                    type="number"
                    value={userMetrics.leadTimeDays}
                    onChange={(e) => handleMetricChange({ leadTimeDays: Number(e.target.value) })}
                    helperText="Average days from code commit to production (DORA metric)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Script Failure Rate (%)"
                    type="number"
                    value={userMetrics.scriptFailureRate}
                    onChange={(e) => handleMetricChange({ scriptFailureRate: Number(e.target.value) })}
                    helperText="Percentage of deployments that required rollback or caused incidents"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cost of Delay per Day ($)"
                    type="number"
                    value={userMetrics.costOfDelayPerDay}
                    onChange={(e) => handleMetricChange({ costOfDelayPerDay: Number(e.target.value) })}
                    helperText="Business value lost per day features/fixes are delayed reaching production"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, pl: 1.75 }}>
                    Typical ranges: Startup (&lt;20 devs) $100-200/day | Mid-market (20-200) $300-600/day | Enterprise (200+) $800-2000/day
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Savings per Deployment ($)"
                    type="number"
                    value={userMetrics.savingsPerDeployment}
                    onChange={(e) => handleMetricChange({ savingsPerDeployment: Number(e.target.value) })}
                    helperText="Cost avoided per successful deployment (downtime, remediation, support tickets)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="DBA Hours per Deployment (Pre-Flyway)"
                    type="number"
                    value={userMetrics.dbaHoursPerDeployment}
                    onChange={(e) => handleMetricChange({ dbaHoursPerDeployment: Number(e.target.value) })}
                    helperText="Manual deployment time: planning, review, execution, validation (typically 6-12 hours)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Developer Hours per Deployment (Pre-Flyway)"
                    type="number"
                    value={userMetrics.developerHoursPerDeployment}
                    onChange={(e) => handleMetricChange({ developerHoursPerDeployment: Number(e.target.value) })}
                    helperText="Script writing, testing, coordination time (typically 3-6 hours)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="DBA Annual Salary ($)"
                    type="number"
                    value={userMetrics.dbaAnnualSalary}
                    onChange={(e) => handleMetricChange({ dbaAnnualSalary: Number(e.target.value) })}
                    helperText="Fully-loaded cost including benefits (US avg: $150K-200K for mid-level)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Developer Annual Salary ($)"
                    type="number"
                    value={userMetrics.developerAnnualSalary}
                    onChange={(e) => handleMetricChange({ developerAnnualSalary: Number(e.target.value) })}
                    helperText="Fully-loaded cost including benefits (US avg: $130K-180K for mid-level)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleSave}
                    size="large"
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      bgcolor: hasUnsavedChanges ? 'warning.main' : 'primary.main',
                      '&:hover': {
                        bgcolor: hasUnsavedChanges ? 'warning.dark' : 'primary.dark',
                      },
                      animation: hasUnsavedChanges ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%, 100%': {
                          boxShadow: '0 0 0 0 rgba(237, 108, 2, 0.7)'
                        },
                        '50%': {
                          boxShadow: '0 0 0 8px rgba(237, 108, 2, 0)'
                        }
                      }
                    }}
                  >
                    {hasUnsavedChanges ? '⚠️ Save Configuration to Apply Changes' : 'Save Configuration'}
                  </Button>
                  {hasUnsavedChanges && (
                    <Typography variant="caption" color="warning.dark" display="block" sx={{ mt: 1, textAlign: 'center', fontWeight: 'bold' }}>
                      Changes will not affect ROI calculation until saved
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoiCalculationPage;
