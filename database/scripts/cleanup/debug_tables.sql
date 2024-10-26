DELETE FROM audit
WHERE create_timestamp < NOW() - INTERVAL '1 week';

DELETE FROM app_requests
WHERE create_timestamp < NOW() - INTERVAL '1 week';

DELETE FROM plaid_link_events
WHERE create_timestamp < NOW() - INTERVAL '1 week';

DELETE FROM plaid_api_requests
WHERE create_timestamp < NOW() - INTERVAL '1 week';

DELETE FROM jobs
WHERE create_timestamp < NOW() - INTERVAL '1 week';