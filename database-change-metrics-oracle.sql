-- Database Change Metrics Query - Oracle
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
ORDER BY TRUNC(event_timestamp);

