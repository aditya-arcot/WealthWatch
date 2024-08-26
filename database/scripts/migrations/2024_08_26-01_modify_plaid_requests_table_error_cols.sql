/*
    modify plaid api table error columns
*/

BEGIN;

ALTER TABLE plaid_api_requests
ALTER COLUMN error_code TYPE TEXT
USING error_code::TEXT;

ALTER TABLE plaid_api_requests
RENAME COLUMN error_name TO error_type;

COMMIT;