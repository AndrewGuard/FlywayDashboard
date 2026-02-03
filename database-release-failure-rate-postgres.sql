For this platform, it's more involved, as we need to configure pgaudit to capture the information for failures.  We'll need to be able to write to an external file the data, as it won't be stored internal to the database, but an external CSV file.

shared_preload_libraries = 'pgaudit'

# Capture DDL via pgaudit (you can include ROLE/READ/WRITE later if desired)
pgaudit.log = 'ddl'
pgaudit.log_catalog = off
pgaudit.log_relation = on
pgaudit.log_statement = on

# Make logs queryable (CSV is easiest to ingest)
logging_collector = on
log_destination = 'csvlog'
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.csv'

# Ensure statement text is present on errors too
log_min_error_statement = error

# Helpful for correlation (optional but recommended)
log_line_prefix = '%m [%p] %u@%d tx=%x '


Once this is done, then we need to create an extension to capture the information:

CREATE EXTENSION IF NOT EXISTS file_fdw;


The code to perform the process of collecting the failure data is as follows:

CREATE SERVER IF NOT EXISTS pglog FOREIGN DATA WRAPPER file_fdw;

-- Point this at a specific log file first (easiest), or a symlink to "current"
CREATE FOREIGN TABLE IF NOT EXISTS pg_csvlog (
  log_time                timestamp(3) with time zone,
  user_name               text,
  database_name           text,
  process_id              integer,
  connection_from         text,
  session_id              text,
  session_line_num        bigint,
  command_tag             text,
  session_start_time      timestamp with time zone,
  virtual_transaction_id  text,
  transaction_id          bigint,
  error_severity          text,
  sql_state_code          text,
  message                 text,
  detail                  text,
  hint                    text,
  internal_query          text,
  internal_query_pos      integer,
  context                 text,
  query                   text,
  query_pos               integer,
  location                text,
  application_name        text,
  backend_type            text,
  leader_pid              integer,
  query_id                bigint
)
SERVER pglog
OPTIONS (
  filename '/var/lib/postgresql/data/log/postgresql-2026-01-27_000000.csv',
  format 'csv',
  header 'false'
);

This data could then be loaded into the sqllite database or simply used to query internally in Postgres.

SELECT
  date_trunc('hour', log_time) AS hour_bucket,
  count(*) AS failed_ddl
FROM pg_csvlog
WHERE error_severity = 'ERROR'
  AND coalesce(query, '') ~* '^\s*(create|drop|alter)\b'
GROUP BY 1
ORDER BY 1 DESC;
