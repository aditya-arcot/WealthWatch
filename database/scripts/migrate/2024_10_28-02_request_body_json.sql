/*
    change request body type to json
*/

ALTER TABLE app_requests 
ALTER COLUMN request_body TYPE JSON USING request_body::TEXT::JSON;