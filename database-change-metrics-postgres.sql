We need PGAudit to do this and the logs, as PGAudit is still in it’s infancy.
What is PGAudit?  https://www.pgaudit.org/

-- Example if you ingest logs into a table like: audit_log(ts timestamptz, message text)
SELECT
  date_trunc('day', ts) AS change_day,
  count(*)              AS ddl_events
FROM audit_log
WHERE ts >= now() - interval '3 months'
  AND message ILIKE '%AUDIT:%'
  AND message ~* '\b(ALTER|CREATE|DROP|TRUNCATE)\b'
GROUP BY 1
ORDER BY 1;

And if the log table is enabled, then we can do this:

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.ddl_events (
  event_id      bigserial PRIMARY KEY,
  event_ts      timestamptz NOT NULL DEFAULT now(),
  username      text        NOT NULL DEFAULT session_user,
  database_name text        NOT NULL DEFAULT current_database(),
  client_addr   inet        NULL     DEFAULT inet_client_addr(),
  application   text        NULL     DEFAULT current_setting('application_name', true),

  event_type    text        NOT NULL,   -- e.g. ddl_command_end
  command_tag   text        NOT NULL,   -- e.g. CREATE TABLE, ALTER TABLE
  object_type   text        NULL,
  schema_name   text        NULL,
  object_name   text        NULL
);
