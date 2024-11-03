/*
    separate db objects into schemas
*/

-- move core tables
ALTER TABLE access_requests SET SCHEMA core;

ALTER TABLE users SET SCHEMA core;

ALTER TABLE items SET SCHEMA core;

ALTER TABLE accounts SET SCHEMA core;

ALTER TABLE notifications SET SCHEMA core;

ALTER TABLE transactions SET SCHEMA core;

ALTER TABLE securities SET SCHEMA core;

ALTER TABLE holdings SET SCHEMA core;

ALTER TABLE credit_card_liabilities SET SCHEMA core;

ALTER TABLE mortgage_liabilities SET SCHEMA core;

ALTER TABLE student_loan_liabilities SET SCHEMA core;

-- move lookup tables
ALTER TABLE access_request_statuses SET SCHEMA lookup;

ALTER TABLE notification_types SET SCHEMA lookup;

ALTER TABLE category_groups SET SCHEMA lookup;

ALTER TABLE categories SET SCHEMA lookup;

ALTER TABLE security_types SET SCHEMA lookup;

ALTER TABLE student_loan_status_types SET SCHEMA lookup;

ALTER TABLE student_loan_repayment_plan_types SET SCHEMA lookup;

-- move debug tables
ALTER TABLE audit SET SCHEMA debug;

ALTER TABLE app_requests SET SCHEMA debug;

ALTER TABLE plaid_link_events SET SCHEMA debug;

ALTER TABLE plaid_api_requests SET SCHEMA debug;

ALTER TABLE jobs SET SCHEMA debug;

-- move session table
ALTER TABLE session SET SCHEMA core;

-- move functions
ALTER FUNCTION set_update_timestamp() SET SCHEMA core;

ALTER FUNCTION insert_audit_record() SET SCHEMA debug;

-- move views
ALTER VIEW active_items SET SCHEMA core;

ALTER VIEW active_accounts SET SCHEMA core;

ALTER VIEW active_notifications SET SCHEMA core;

ALTER VIEW active_transactions SET SCHEMA core;

ALTER VIEW active_holdings SET SCHEMA core;
