/*
    create schemas, grant permissions
    variables - db_name, user
*/

\if :{?db_name}
    \echo db_name: :db_name
\else
   \echo 'error - db_name is not set. exiting...'
   SELECT 1 / 0;
   \quit
\endif

\if :{?user}
    \echo user: :user
\else
   \echo 'error - user is not set. exiting...'
   SELECT 1 / 0;
   \quit
\endif

BEGIN;

CREATE SCHEMA core;

GRANT USAGE, CREATE ON SCHEMA core TO :user;

GRANT USAGE, CREATE ON SCHEMA core TO PUBLIC;

CREATE SCHEMA lookup;

GRANT USAGE, CREATE ON SCHEMA lookup TO :user;

GRANT USAGE, CREATE ON SCHEMA lookup TO PUBLIC;

CREATE SCHEMA debug;

GRANT USAGE, CREATE ON SCHEMA debug TO :user;

GRANT USAGE, CREATE ON SCHEMA debug TO PUBLIC;

COMMIT;