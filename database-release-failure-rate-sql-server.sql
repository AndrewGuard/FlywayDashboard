-- SQL Server Release Failure Rate Script
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
FROM sys.fn_get_audit_file('D:\SqlAudit\MyAudit\*.sqlaudit', DEFAULT, DEFAULT)
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

/*
Notes:
- Turnkey Extended Events capture + reporting for FAILED DDL (CREATE/ALTER/DROP)
- SQL Server (on-prem) — writes to .xel file, then queries and buckets by day/hour.

What it captures:
- error_reported events where the submitted batch text contains CREATE/ALTER/DROP
- filtered to a single database (set @DbName)
- includes sql_text + useful context actions

Permissions:
- Requires ALTER ANY EVENT SESSION (or sysadmin)
- Read access to the .xel path

Notes:
- This is a practical, low-friction solution. Pattern-matching SQL text is not
  perfect (e.g., dynamic SQL, unusual spacing, comments), but works well in practice.
*/

-------------------------------------------------------------------------------
-- 0) CONFIG
-------------------------------------------------------------------------------
DECLARE @DbName        sysname        = N'YourDatabaseName';
DECLARE @SessionName   sysname        = N'XE_FailedDDL_' + REPLACE(@DbName, N']', N'');
DECLARE @TargetFolder  nvarchar(260)  = N'D:\XEvents\';  -- ensure SQL Server service account can write here
DECLARE @FileBase      nvarchar(520)  = @TargetFolder + @SessionName;

-- Optional: keep this small-ish and let it roll
DECLARE @MaxFileSizeMB int            = 256;
DECLARE @MaxRollover   int            = 10;

-------------------------------------------------------------------------------
-- 1) CREATE (or RECREATE) EVENT SESSION
-------------------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.server_event_sessions WHERE name = @SessionName)
BEGIN
    DECLARE @drop nvarchar(max) = N'DROP EVENT SESSION ' + QUOTENAME(@SessionName) + N' ON SERVER;';
    EXEC sys.sp_executesql @drop;
END
GO

DECLARE @DbName        sysname        = N'YourDatabaseName';
DECLARE @SessionName   sysname        = N'XE_FailedDDL_' + REPLACE(@DbName, N']', N'');
DECLARE @TargetFolder  nvarchar(260)  = N'D:\XEvents\';
DECLARE @FileBase      nvarchar(520)  = @TargetFolder + @SessionName;
DECLARE @MaxFileSizeMB int            = 256;
DECLARE @MaxRollover   int            = 10;

DECLARE @sql nvarchar(max) = N'
CREATE EVENT SESSION ' + QUOTENAME(@SessionName) + N' ON SERVER
ADD EVENT sqlserver.error_reported
(
    ACTION
    (
        sqlserver.sql_text,
        sqlserver.database_id,
        sqlserver.username,
        sqlserver.client_app_name,
        sqlserver.client_hostname,
        sqlserver.session_id
    )
    WHERE
    (
        -- Only this DB
        sqlserver.database_id = DB_ID(N''' + REPLACE(@DbName, '''', '''''') + N''')
        -- Only true errors (severity >= 11); adjust if you want to include informational messages
        AND [severity] >= 11
        -- Heuristic filter for DDL in the submitted batch.
        AND
        (
            sqlserver.sql_text LIKE N''%CREATE%'' OR
            sqlserver.sql_text LIKE N''%ALTER%''  OR
            sqlserver.sql_text LIKE N''%DROP%''
        )
        -- Reduce noise: ignore common "object not found" chatter if you want (optional)
        -- AND [error_number] NOT IN (3701, 3729)
    )
)
ADD TARGET package0.event_file
(
    SET filename = N''' + REPLACE(@FileBase, '''', '''''') + N''',
        max_file_size = ' + CAST(@MaxFileSizeMB AS nvarchar(20)) + N',
        max_rollover_files = ' + CAST(@MaxRollover AS nvarchar(20)) + N'
)
WITH
(
    STARTUP_STATE = ON
);';

EXEC sys.sp_executesql @sql;
GO

-------------------------------------------------------------------------------
-- 2) START SESSION
-------------------------------------------------------------------------------
DECLARE @DbName      sysname      = N'YourDatabaseName';
DECLARE @SessionName sysname      = N'XE_FailedDDL_' + REPLACE(@DbName, N']', N'');

DECLARE @start nvarchar(max) = N'ALTER EVENT SESSION ' + QUOTENAME(@SessionName) + N' ON SERVER STATE = START;';
EXEC sys.sp_executesql @start;
GO

/*============================================================================
3) REPORTING QUERY: bucket failures by DAY and by HOUR
- Reads from the .xel file(s)
- Filters again for safety and buckets event_time into day/hour
=============================================================================*/
DECLARE @DbName       sysname       = N'YourDatabaseName';
DECLARE @SessionName  sysname       = N'XE_FailedDDL_' + REPLACE(@DbName, N']', N'');
DECLARE @TargetFolder nvarchar(260) = N'D:\XEvents\';
DECLARE @XelPattern   nvarchar(520) = @TargetFolder + @SessionName + N'*.xel';

-- Time window (optional)
DECLARE @StartTime datetime2(0) = DATEADD(DAY, -30, SYSUTCDATETIME());  -- last 30 days
DECLARE @EndTime   datetime2(0) = SYSUTCDATETIME();

;WITH xe AS
(
    SELECT CAST(event_data AS xml) AS x
    FROM sys.fn_xe_file_target_read_file(@XelPattern, NULL, NULL, NULL)
),
parsed AS
(
    SELECT
        -- event timestamp in UTC from XEvents
        x.value('(event/@timestamp)[1]', 'datetime2(7)')                           AS event_time_utc,
        x.value('(event/data[@name="error_number"]/value)[1]', 'int')             AS error_number,
        x.value('(event/data[@name="severity"]/value)[1]', 'int')                 AS severity,
        x.value('(event/data[@name="message"]/value)[1]', 'nvarchar(2048)')       AS [message],

        x.value('(event/action[@name="database_id"]/value)[1]', 'int')            AS database_id,
        DB_NAME(x.value('(event/action[@name="database_id"]/value)[1]', 'int'))   AS database_name,
        x.value('(event/action[@name="username"]/value)[1]', 'sysname')           AS username,
        x.value('(event/action[@name="client_app_name"]/value)[1]', 'nvarchar(256)') AS client_app_name,
        x.value('(event/action[@name="client_hostname"]/value)[1]', 'nvarchar(256)') AS client_hostname,
        x.value('(event/action[@name="session_id"]/value)[1]', 'int')             AS session_id,
        x.value('(event/action[@name="sql_text"]/value)[1]', 'nvarchar(max)')     AS sql_text
    FROM xe
)
SELECT
    CAST(event_time_utc AS date) AS [day_utc],
    -- Hour bucket start (UTC)
    DATEADD(HOUR, DATEDIFF(HOUR, '20000101', event_time_utc), '20000101') AS hour_bucket_utc,
    COUNT(*) AS failed_ddl_count,
    SUM(CASE WHEN sql_text LIKE N'%CREATE%' THEN 1 ELSE 0 END) AS create_like,
    SUM(CASE WHEN sql_text LIKE N'%ALTER%'  THEN 1 ELSE 0 END) AS alter_like,
    SUM(CASE WHEN sql_text LIKE N'%DROP%'   THEN 1 ELSE 0 END) AS drop_like
FROM parsed
WHERE database_name = @DbName
  AND event_time_utc >= @StartTime
  AND event_time_utc <  @EndTime
  AND severity >= 11
  AND (
        sql_text LIKE N'%CREATE%' OR
        sql_text LIKE N'%ALTER%'  OR
        sql_text LIKE N'%DROP%'
      )
GROUP BY
    CAST(event_time_utc AS date),
    DATEADD(HOUR, DATEDIFF(HOUR, '20000101', event_time_utc), '20000101')
ORDER BY
    hour_bucket_utc DESC;
GO
