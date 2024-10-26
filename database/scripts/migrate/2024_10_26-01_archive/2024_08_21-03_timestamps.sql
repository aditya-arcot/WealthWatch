/*
    add not null constraint to create, update timestamps
*/

BEGIN;

-- audit
ALTER TABLE audit
ALTER COLUMN create_timestamp SET NOT NULL;

-- categories
ALTER TABLE categories
ALTER COLUMN create_timestamp SET NOT NULL;

-- users
ALTER TABLE users
ALTER COLUMN create_timestamp SET NOT NULL;

ALTER TABLE users
ALTER COLUMN update_timestamp SET NOT NULL;

-- notifications
ALTER TABLE notifications
ALTER COLUMN create_timestamp SET NOT NULL;

ALTER TABLE notifications
ALTER COLUMN update_timestamp SET NOT NULL;

-- items
ALTER TABLE items
ALTER COLUMN create_timestamp SET NOT NULL;

ALTER TABLE items
ALTER COLUMN update_timestamp SET NOT NULL;

-- accounts
ALTER TABLE accounts
ALTER COLUMN create_timestamp SET NOT NULL;

ALTER TABLE accounts
ALTER COLUMN update_timestamp SET NOT NULL;

-- transactions
ALTER TABLE transactions
ALTER COLUMN create_timestamp SET NOT NULL;

ALTER TABLE transactions
ALTER COLUMN update_timestamp SET NOT NULL;

-- app requests
ALTER TABLE app_requests
ALTER COLUMN create_timestamp SET NOT NULL;

-- plaid link events
ALTER TABLE plaid_link_events
ALTER COLUMN create_timestamp SET NOT NULL;

-- plaid api requests
ALTER TABLE plaid_api_requests
ALTER COLUMN create_timestamp SET NOT NULL;

-- jobs
ALTER TABLE jobs
ALTER COLUMN create_timestamp SET NOT NULL;

COMMIT;