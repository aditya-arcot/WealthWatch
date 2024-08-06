START TRANSACTION;

-- UPDATE TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION set_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    new.update_timestamp = TIMEZONE('UTC', NOW());
    RETURN new;
END;
$$ LANGUAGE plpgsql;


-- AUDIT TABLE
CREATE TABLE IF NOT EXISTS audit (
    id SERIAL PRIMARY KEY,
    operation CHAR(1) NOT NULL CHECK (operation IN ('I', 'U', 'D')),
    table_name TEXT NOT NULL,
    row_id INTEGER NOT NULL,
    row_data JSON NOT NULL,
    user_id TEXT NOT NULL,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);


-- INSERT AUDIT FUNCTION
CREATE OR REPLACE FUNCTION insert_audit_record()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit (operation, table_name, row_id, row_data, user_id)
        VALUES ('I', TG_TABLE_NAME, NEW.id, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit (operation, table_name, row_id, row_data, user_id)
        VALUES ('U', TG_TABLE_NAME, NEW.id, row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit (operation, table_name, row_id, row_data, user_id)
        VALUES ('D', TG_TABLE_NAME, OLD.id, row_to_json(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);


-- USERS TABLE, TRIGGERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW()),
    update_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TRIGGER trigger_users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_users_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW 
EXECUTE FUNCTION insert_audit_record();


-- ITEMS TABLE, TRIGGERS, VIEW
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL,
    access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    healthy BOOLEAN NOT NULL,
    cursor TEXT,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW()),
    update_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TRIGGER trigger_items_update_timestamp
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_items_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW 
EXECUTE FUNCTION insert_audit_record();

CREATE VIEW active_items AS
SELECT *
FROM items
WHERE active = TRUE;


-- ACCOUNTS TABLE, TRIGGERS, VIEW
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    account_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mask TEXT,
    official_name TEXT,
    current_balance NUMERIC(28, 10),
    available_balance NUMERIC(28, 10),
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    credit_limit NUMERIC(28, 10),
    type TEXT NOT NULL,
    subtype TEXT NOT NULL,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW()),
    update_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TRIGGER trigger_accounts_update_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_accounts_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON accounts
FOR EACH ROW 
EXECUTE FUNCTION insert_audit_record();

CREATE VIEW active_accounts AS
SELECT a.*
FROM accounts a
JOIN items i 
    ON a.item_id = i.id
WHERE i.active = TRUE;


-- TRANSACTIONS TABLE, TRIGGERS, VIEW
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    merchant_id TEXT,
    merchant TEXT,
    name TEXT NOT NULL,
    custom_name TEXT,
    amount NUMERIC(28, 10) NOT NULL,
    primary_category TEXT,
    detailed_category TEXT,
    category_id INTEGER REFERENCES categories(id),
    custom_category_id INTEGER REFERENCES categories(id),
    payment_channel TEXT NOT NULL,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    date DATE NOT NULL,
    pending BOOLEAN NOT NULL,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW()),
    update_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);

CREATE TRIGGER trigger_transactions_update_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TRIGGER trigger_transactions_insert_audit
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW 
EXECUTE FUNCTION insert_audit_record();

CREATE VIEW active_transactions AS
SELECT t.*
FROM transactions t
JOIN accounts a 
    ON t.account_id = a.id
JOIN items i 
    ON a.item_id = i.id
WHERE i.active = TRUE;


-- APP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS app_requests (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    user_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    query_params JSON,
    route_params JSON,
    request_headers JSON,
    request_body TEXT,
    remote_address TEXT,
    remote_port INTEGER,
    session JSON,
    response_status INTEGER NOT NULL,
    response_headers JSON,
    response_body TEXT,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);


-- PLAID LINK EVENTS TABLE
CREATE TABLE IF NOT EXISTS plaid_link_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    request_id TEXT,
    institution_id TEXT,
    institution_name TEXT,
    public_token TEXT,
    status TEXT,
    error_type TEXT,
    error_code TEXT,
    error_message TEXT,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);


-- PLAID API REQUESTS TABLE
CREATE TABLE IF NOT EXISTS plaid_api_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    item_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    method TEXT NOT NULL,
    params JSON NOT NULL,
    response JSON,
    error_name TEXT,
    error_message TEXT,
    error_stack TEXT,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);


-- WEBHOOKS TABLE
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    data JSON NOT NULL,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);


-- JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    queue_name TEXT NOT NULL,
    job_id TEXT,
    job_name TEXT,
    success BOOLEAN NOT NULL,
    data JSON,
    error_name TEXT,
    error_message TEXT,
    error_stack TEXT,
    create_timestamp TIMESTAMP DEFAULT TIMEZONE('UTC', NOW())
);

COMMIT;