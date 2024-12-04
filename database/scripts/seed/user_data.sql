\if :{?admin_password_hash}
    \echo admin_password_hash: :admin_password_hash
\else
   \echo 'error - admin password hash is not set. exiting...'
   SELECT 1 / 0;
   \quit
\endif

BEGIN;

INSERT INTO
    users (
        username,
        email,
        first_name,
        last_name,
        password_hash,
        admin
    )
VALUES
    (
        'aarcot100',
        'arcot.aditya@utexas.edu',
        'Aditya',
        'Arcot',
        :'admin_password_hash',
        true
    );

COMMIT;