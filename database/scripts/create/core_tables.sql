CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE items (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    plaid_id TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL,
    access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    healthy BOOLEAN NOT NULL,
    cursor TEXT,
    last_refreshed TIMESTAMPTZ,
    transactions_last_refreshed TIMESTAMPTZ,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type_id INTEGER REFERENCES notification_types(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    persistent BOOLEAN NOT NULL,
    read BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    plaid_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mask TEXT,
    official_name TEXT,
    current_balance DOUBLE PRECISION,
    available_balance DOUBLE PRECISION,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    credit_limit DOUBLE PRECISION,
    type TEXT NOT NULL,
    subtype TEXT NOT NULL,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    plaid_id TEXT UNIQUE NOT NULL,
    merchant_id TEXT,
    merchant TEXT,
    name TEXT NOT NULL,
    custom_name TEXT,
    amount DOUBLE PRECISION NOT NULL,
    primary_category TEXT,
    detailed_category TEXT,
    category_id INTEGER REFERENCES categories(id) NOT NULL,
    custom_category_id INTEGER REFERENCES categories(id),
    payment_channel TEXT NOT NULL,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    date TIMESTAMPTZ NOT NULL,
    pending BOOLEAN NOT NULL,
    note TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE securities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plaid_id TEXT UNIQUE NOT NULL,
    proxy_plaid_id TEXT,
    institution_id TEXT,
    institution_security_id TEXT,
    name TEXT,
    type_id INTEGER REFERENCES security_types(id) NOT NULL,
    ticker TEXT,
    market_code TEXT,
    cash_equivalent BOOLEAN NOT NULL,
    close_price DOUBLE PRECISION,
    close_price_as_of TIMESTAMPTZ,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE holdings (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    security_id INTEGER REFERENCES securities(id) ON DELETE CASCADE NOT NULL,
    cost_basis DOUBLE PRECISION,
    price DOUBLE PRECISION NOT NULL,
    price_as_of TIMESTAMPTZ,
    quantity DOUBLE PRECISION NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    vested_quantity DOUBLE PRECISION,
    vested_value DOUBLE PRECISION,
    iso_currency_code TEXT,
    unofficial_currency_code TEXT,
    create_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT holdings_account_security_unique UNIQUE (account_id, security_id)
);