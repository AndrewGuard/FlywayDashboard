-- Oracle Release Failure Rate Script
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
ORDER BY day;
