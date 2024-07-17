START TRANSACTION;

CREATE OR REPLACE FUNCTION set_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    new.update_timestamp = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    create_timestamp TIMESTAMP DEFAULT NOW(),
    update_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trigger_users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    healthy BOOLEAN NOT NULL,
    cursor TEXT,
    create_timestamp TIMESTAMP DEFAULT NOW(),
    update_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trigger_items_update_timestamp
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

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
    create_timestamp TIMESTAMP DEFAULT NOW(),
    update_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trigger_accounts_update_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC(28, 10) NOT NULL,
    merchant TEXT,
    merchant_id TEXT,
    category TEXT,
    detailed_category TEXT,
    payment_channel TEXT NOT NULL,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    date DATE NOT NULL,
    pending BOOLEAN NOT NULL,
    create_timestamp TIMESTAMP DEFAULT NOW(),
    update_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trigger_transactions_update_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE set_update_timestamp();

CREATE TABLE IF NOT EXISTS plaid_link_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    create_timestamp TIMESTAMP DEFAULT NOW()
);

COMMIT;