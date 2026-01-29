-- Without auditing turned on, this is as close as we get, (last change to an object) similar to Oracle LAST_DDL_TIME.
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
ORDER BY change_date;
