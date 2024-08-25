/*
add error code, error response columns to plaid api requests table
*/

BEGIN;

CREATE TABLE plaid_api_requests_migrate (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER,
    item_id INTEGER,
    timestamp TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    method TEXT NOT NULL,
    params JSON NOT NULL,
    response JSON,
    error_code INTEGER,
    error_name TEXT,
    error_message TEXT,
    error_response TEXT,
    error_stack TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plaid_api_requests_migrate (
    user_id, 
    item_id, 
    timestamp, 
    duration, 
    method, 
    params, 
    response, 
    error_name, 
    error_message, 
    error_stack, 
    create_timestamp
)
SELECT
    user_id,
    item_id,
    timestamp,
    duration,
    method,
    params,
    response,
    error_name,
    error_message,
    error_stack,
    create_timestamp
FROM
    plaid_api_requests;

DROP TABLE plaid_api_requests;

ALTER TABLE plaid_api_requests_migrate
RENAME TO plaid_api_requests;

ALTER SEQUENCE plaid_api_requests_migrate_id_seq
RENAME TO plaid_api_requests_id_seq;

ALTER TABLE plaid_api_requests
RENAME CONSTRAINT plaid_api_requests_migrate_pkey TO plaid_api_requests_pkey;

COMMIT;