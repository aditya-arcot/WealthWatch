/*
add error code, error response columns to plaid api requests table
*/

ALTER TABLE plaid_api_requests
ADD COLUMN error_code INTEGER,
ADD COLUMN error_response TEXT;