/*
    drop public schema, set search path
    variables - db_name
    requires run by database owner
*/

\if :{?db_name}
    \echo db_name: :db_name
\else
   \echo 'error - db_name is not set. exiting...'
   SELECT 1 / 0;
   \quit
\endif

BEGIN;

DROP SCHEMA public;

ALTER DATABASE :db_name SET search_path TO core, lookup, debug;

COMMIT;