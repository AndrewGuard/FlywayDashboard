# Lead Time Display Updates

## Changes Made

### 1. Enhanced UI Display (ChangeInDeploymentMetricsWidget.js)

The Lead Time metric now shows more precision:

- **For times < 1 day**: Displays in hours (e.g., "1.1 hours")
- **For times ≥ 1 day**: Displays with 2 decimal places (e.g., "1.75 days")

This provides better visibility into short lead times that would otherwise round to 0.

**Example Output:**
```
Lead Time for Changes
Flyway: 1.75 days
Non-Flyway: 20 days
-18.25 days ✓
```

### 2. Sample Data with Realistic Lead Times

Added 6 sample production migrations with realistic lead times:

| Script | Lead Time | Database |
|--------|-----------|----------|
| V100_20251201120000__feature_user_profile.sql | 14.10 days | northwind_prod |
| V101_20251110090000__add_customer_segments.sql | 7.29 days | northwind_prod |
| V102_20251125143000__optimize_queries.sql | 2.81 days | northwind_prod |
| V103_20251205100000__add_indexes.sql | 5.21 days | pagila_prod |
| V104_20251210080000__refactor_schema.sql | 3.13 days | pagila_prod |
| V105_20251212153000__add_audit_trail.sql | 1.73 days | northwind_prod |

**New Average Lead Time**: 1.75 days (was 0.045 days)

## Managing Sample Data

### Add More Sample Lead Time Data Points
```bash
cd server
node add-sample-lead-times.js
```

### Generate Historical Lead Time Chart Data (90 days)
```bash
cd server
node generate-lead-time-history.js
```
This creates 90 days of historical data showing Flyway lead time improvement from ~20 days to current average (~1.7 days).

### Remove Sample Data and Recalculate from Real Production Data
```bash
# Trigger a fresh calculation from production databases
curl http://localhost:3001/api/metrics/lead-times/refresh
```

### View Current Lead Times
```bash
curl http://localhost:3001/api/metrics/lead-times
```

### View Lead Time History (for chart)
```bash
curl http://localhost:3001/api/metrics/lead-time-history
```

## How Lead Time is Calculated

1. **Source**: Production databases only (defined in `jdbc-connections.json` under `prod` array)
2. **Script Timestamp**: Parsed from V script filename (format: `V###_YYYYMMDDHHMMSS__description.sql`)
3. **Deploy Timestamp**: From `installed_on` field in `flyway_schema_history` table
4. **Lead Time**: Delta between script creation and deployment
5. **Negative Values**: Set to 0 (when script created after deployment - data quality issue)

## Files Modified

- `src/ChangeInDeploymentMetricsWidget.js` - Enhanced display formatting
- `server/routes/leadTimesRoutes.js` - Lead time calculation logic
- `server/db/database.js` - Database schema with environment tracking
- `server/add-sample-lead-times.js` - Sample data generator (NEW)
